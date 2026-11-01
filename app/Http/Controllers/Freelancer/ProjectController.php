<?php

namespace App\Http\Controllers\Freelancer;

use App\Http\Controllers\Controller;
use App\Models\Conversation;
use App\Models\Deliverable;
use App\Models\Dispute;
use App\Models\Project;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Inertia\Inertia;

class ProjectController extends Controller
{
    public function index(Request $request)
    {
        $search = trim((string) $request->query('search', ''));

        $projects = Project::query()
            ->leftJoin('sila_p.users as client', 'sila_p.projects.client_id', '=', 'client.id')
            ->leftJoin('sila_p.client_companies as comp', 'comp.user_id', '=', 'client.id')
            ->leftJoin('sila_p.proposals as prop_orig', 'prop_orig.project_id', '=', 'sila_p.projects.id')
            ->leftJoin('sila_p.proposals as prop_brief', 'prop_brief.brief_id', '=', 'sila_p.projects.brief_id')
            ->where('sila_p.projects.freelancer_id', auth()->id())
            ->when($search !== '', function ($query) use ($search) {
                $query->where(function ($query) use ($search) {
                    $query->where('sila_p.projects.title', 'ilike', "%{$search}%")
                        ->orWhere('client.user_name', 'ilike', "%{$search}%")
                        ->orWhere('comp.business_name', 'ilike', "%{$search}%");
                });
            })
            ->select([
                'sila_p.projects.id',
                'sila_p.projects.brief_id',
                'sila_p.projects.client_id',
                'sila_p.projects.freelancer_id',
                'sila_p.projects.title',
                'sila_p.projects.status',
                'sila_p.projects.progress',
                'sila_p.projects.rating',
                'sila_p.projects.rated_at',
                'sila_p.projects.created_at',
                'sila_p.projects.updated_at',
                'client.user_name as client_name',
                'client.avatar_path as client_avatar',
                'client.city as client_city',
                'comp.business_name as company_name',
                'comp.company_description as company_description',
                \Illuminate\Support\Facades\DB::raw('COALESCE(prop_orig.price, prop_brief.price, 0) as resolved_price'),
            ])
            ->with([
                'deliverables:id,project_id,title,status,file_path,external_link,client_feedback,remaining_revisions,notes,created_at,updated_at',
            ])
            ->latest('sila_p.projects.updated_at')
            ->get();

        $clientIds = $projects->pluck('client_id')->filter()->unique();
        $conversations = Conversation::where('freelancer_id', auth()->id())
            ->whereIn('client_id', $clientIds)
            ->latest('updated_at')
            ->get()
            ->keyBy('client_id');

        $formattedProjects = $projects->map(function ($project) use ($conversations) {
            $totalTasks = $project->deliverables->count();
            $completedTasks = $project->deliverables->filter(function ($d) {
                return $d->status === 'approved';
            })->count();

            $progress = $project->status === 'completed'
                ? 100
                : ($totalTasks > 0 ? round(($completedTasks / $totalTasks) * 100) : 0);

            $hasRevisionRequested = $project->deliverables->contains('status', 'revision_requested');
            $hasAwaitingReview = $project->deliverables->contains(function ($d) {
                return $d->status === 'submitted' && (!empty($d->file_path) || !empty($d->external_link));
            });

            $conversation = $conversations->get($project->client_id);

            // Compute project-wide remaining revisions
            $minRemaining = $project->deliverables->min('remaining_revisions');
            $projectRemainingRevisions = $minRemaining !== null ? (int) $minRemaining : 2;

            // Compute tasks with active/locked flow
            $tasks = [];
            $hasActive = false;
            $activeTaskIndex = -1;
            $activeTaskTitle = null;

            foreach ($project->deliverables as $idx => $task) {
                $hasSubmission = !empty($task->file_path) || !empty($task->external_link);

                if ($task->status === 'approved') {
                    $status = 'completed';
                } elseif ($task->status === 'revision_requested') {
                    $status = 'revision_requested';
                    if (!$hasActive) {
                        $hasActive = true;
                        $activeTaskIndex = $idx;
                        $activeTaskTitle = $task->title;
                    }
                } elseif ($task->status === 'submitted' && $hasSubmission) {
                    $status = 'awaiting_review';
                } else {
                    if (!$hasActive) {
                        $status = 'active';
                        $hasActive = true;
                        $activeTaskIndex = $idx;
                        $activeTaskTitle = $task->title;
                    } else {
                        $status = 'locked';
                    }
                }

                $tasks[] = [
                    'id'                 => (string) $task->id,
                    'title'              => $task->title,
                    'status'             => $status,
                    'clientFeedback'     => $task->client_feedback,
                    'remainingRevisions' => $projectRemainingRevisions,
                ];
            }

            return [
                'id'                   => (string) $project->id,
                'clientId'             => (string) $project->client_id,
                'clientName'           => $project->company_name ?: ($project->client_name ?? 'شركة'),
                'companyName'          => $project->company_name,
                'companyDescription'   => $project->company_description,
                'avatar'               => $project->client_avatar,
                'city'                 => $project->client_city ?? 'اليمن',
                'title'                => $project->title,
                'status'               => $project->status,
                'rating'               => $project->rating,
                'ratedAt'              => $project->rated_at?->toISOString(),
                'hasRevisionRequested' => $hasRevisionRequested,
                'hasAwaitingReview'    => $hasAwaitingReview,
                'projectValue'         => number_format((float) ($project->resolved_price ?? 0), 0),
                'progress'             => $progress,
                'activeWorkspace'      => $project->status !== 'completed',
                'completionDate'       => $project->updated_at?->format('d M Y'),
                'totalTasks'           => $totalTasks,
                'completedTasks'       => $completedTasks,
                'activeTaskIndex'      => $activeTaskIndex,
                'activeTaskTitle'      => $activeTaskTitle,
                'remainingRevisions'   => $projectRemainingRevisions,
                'chatId'               => $conversation ? (string) $conversation->id : null,
                'tasks'                => $tasks,
            ];
        });

        return Inertia::render('freelancer/MyProjects', [
            'pageTitle' => 'مشاريعي',
            'projects'  => $formattedProjects,
            'search'    => $search,
        ]);
    }

    public function show($id)
    {
        $project = Project::with([
            'deliverables' => fn($q) => $q->select([
                'id',
                'project_id',
                'title',
                'client_feedback',
                'status',
                'file_path',
                'external_link',
                'notes',
                'remaining_revisions',
                'created_at',
                'updated_at'
            ])->orderBy('created_at', 'asc'),
            'originalProposal' => fn($q) => $q->select(['id', 'project_id', 'title', 'price', 'revision_limit', 'timeline', 'validity', 'additional_terms']),
            'originalProposal.milestones' => fn($q) => $q->select(['id', 'proposal_id', 'title', 'description', 'amount', 'status']),
            'proposalViaBrief' => fn($q) => $q->select(['id', 'brief_id', 'title', 'price', 'revision_limit', 'timeline', 'validity', 'additional_terms']),
            'proposalViaBrief.milestones' => fn($q) => $q->select(['id', 'proposal_id', 'title', 'description', 'amount', 'status']),
            'client:id,user_name,avatar_path,city',
            'client.clientCompany:id,user_id,business_name,company_description,industry',
            'disputes' => fn($q) => $q->with(['initiatedBy:id,user_name', 'againstUser:id,user_name'])->orderBy('created_at', 'desc'),
        ])->findOrFail($id);

        abort_if($project->freelancer_id !== auth()->id(), 403);

        $disputes = $project->disputes->map(fn(Dispute $disp) => [
            'id'                        => (string) $disp->id,
            'reason'                    => $disp->reason,
            'details'                   => $disp->details,
            'status'                    => $disp->status,
            'status_label'              => $disp->status_label,
            'resolution_decision'       => $disp->resolution_decision,
            'resolution_decision_label' => $disp->resolution_decision_label,
            'freelancer_payout_amount'  => (float) $disp->freelancer_payout_amount,
            'client_refund_amount'      => (float) $disp->client_refund_amount,
            'admin_notes'               => $disp->admin_notes,
            'is_initiator'              => (string) $disp->initiated_by_user_id === (string) auth()->id(),
            'initiated_by_name'         => $disp->initiatedBy?->user_name ?? 'مستخدم',
            'against_user_name'         => $disp->againstUser?->user_name ?? 'الطرف الآخر',
            'created_at'                => $disp->created_at ? $disp->created_at->locale('ar')->translatedFormat('d F Y - h:i a') : null,
            'resolved_at'               => $disp->resolved_at ? $disp->resolved_at->locale('ar')->translatedFormat('d F Y - h:i a') : null,
        ]);

        $activeDispute = $disputes->first(fn($d) => in_array($d['status'], ['open', 'under_review']));

        $proposal = $project->originalProposal ?? $project->proposalViaBrief;
        $totalRevisionLimit = (int) ($proposal?->revision_limit ?? 2);
        $minRemaining = $project->deliverables->min('remaining_revisions');
        $projectRemainingRevisions = $minRemaining !== null ? (int) $minRemaining : $totalRevisionLimit;

        $conversation = Conversation::where('freelancer_id', auth()->id())
            ->where('client_id', $project->client_id)
            ->latest('updated_at')
            ->first();

        $totalTasks = $project->deliverables->count();
        $completedTasks = $project->deliverables->filter(fn($d) => $d->status === 'approved')->count();
        $progress = $project->status === 'completed'
            ? 100
            : ($totalTasks > 0 ? round(($completedTasks / $totalTasks) * 100) : 0);

        // Map tasks
        $tasks = [];
        $hasActive = false;
        $activeTaskId = null;
        foreach ($project->deliverables as $d) {
            $hasSubmission = !empty($d->file_path) || !empty($d->external_link);

            if ($d->status === 'approved') {
                $status = 'completed';
            } elseif ($d->status === 'revision_requested') {
                $status = 'revision_requested';
                if (!$hasActive) {
                    $hasActive = true;
                    $activeTaskId = (string) $d->id;
                }
            } elseif ($d->status === 'submitted' && $hasSubmission) {
                $status = 'awaiting_review';
            } else {
                if (!$hasActive) {
                    $status = 'active';
                    $hasActive = true;
                    $activeTaskId = (string) $d->id;
                } else {
                    $status = 'locked';
                }
            }

            $tasks[] = [
                'id'                 => (string) $d->id,
                'title'              => $d->title,
                'status'             => $status,
                'rawStatus'          => $d->status,
                'clientFeedback'     => $d->client_feedback,
                'remainingRevisions' => $projectRemainingRevisions,
                'notes'              => $d->notes,
                'filePath'           => $d->file_path,
                'fileName'           => $d->file_path ? basename($d->file_path) : null,
                'externalLink'       => $d->external_link,
                'submittedAt'        => $d->updated_at ? $d->updated_at->locale('ar')->translatedFormat('d F Y - h:i a') : null,
                'downloadUrl'        => $d->file_path ? route('freelancer.projects.deliverables.download', [$project->id, $d->id]) : null,
                'viewUrl'            => $d->file_path ? route('freelancer.projects.deliverables.view', [$project->id, $d->id]) : null,
            ];
        }

        $projectData = [
            'id'                 => (string) $project->id,
            'title'              => $project->title,
            'status'             => $project->status,
            'rating'             => $project->rating,
            'ratedAt'            => $project->rated_at?->toISOString(),
            'projectValue'       => $proposal ? number_format($proposal->price, 0) : '0',
            'progress'           => $progress,
            'completedTasks'     => $completedTasks,
            'totalTasks'         => $totalTasks,
            'activeTaskId'       => $activeTaskId,
            'revisionLimit'      => $totalRevisionLimit,
            'remainingRevisions' => $projectRemainingRevisions,
            'chatId'             => $conversation ? (string) $conversation->id : null,
            'disputes'           => $disputes,
            'active_dispute'     => $activeDispute,

            'client' => [
                'id'          => (string) $project->client_id,
                'name'        => $project->client?->clientCompany?->business_name ?: ($project->client?->user_name ?? 'شركة'),
                'companyName' => $project->client?->clientCompany?->business_name,
                'avatar'      => $project->client?->avatar_path,
                'city'        => $project->client?->city ?? 'اليمن',
                'description' => $project->client?->clientCompany?->company_description,
            ],

            'tasks' => $tasks,

            'originalProposal' => $proposal ? [
                'title'           => $proposal->title ?? $project->title,
                'totalPrice'      => number_format($proposal->price, 0),
                'revisions'       => $proposal->revision_limit !== null ? "{$proposal->revision_limit} تعديلات (للمشروع كامل)" : 'غير محدد',
                'timeline'        => $proposal->timeline ?? 'حسب الاتفاق',
                'validity'        => $proposal->validity ?? '7 أيام',
                'additionalTerms' => $proposal->additional_terms ?? null,
                'milestones'      => $proposal->milestones->map(fn($m) => [
                    'id'     => (string) $m->id,
                    'title'  => $m->title,
                    'amount' => (float) $m->amount,
                    'status' => $m->status,
                ]),
            ] : null,

            'rawProposal' => $proposal ? [
                'title'            => $proposal->title ?? $project->title,
                'price'            => (float) $proposal->price,
                'timeline'         => $proposal->timeline,
                'revision_limit'   => $proposal->revision_limit,
                'validity'         => $proposal->validity,
                'additional_terms' => $proposal->additional_terms,
                'milestones'       => $proposal->milestones->map(fn($m) => [
                    'id'          => (string) $m->id,
                    'title'       => $m->title,
                    'description' => $m->description,
                    'amount'      => (float) $m->amount,
                    'status'      => $m->status,
                ]),
            ] : null,
        ];

        return Inertia::render('freelancer/ProjectWorkspace', [
            'pageTitle' => 'مساحة عمل المشروع: ' . $project->title,
            'project'   => $projectData,
        ]);
    }

    /**
     * Store a new deliverable file submission for the active task.
     * Route: POST /projects/{id}/deliverables
     *
     * File naming convention inside the bucket:
     *   {projectId}/{deliverableId}/{deliverableId}-{timestamp}-{sanitized_original}.ext
     *
     * e.g. abc123/def456/def456-1724430000-brand-identity-final.zip
     */
    public function storeDeliverable(Request $request, $projectId)
    {
        $request->validate([
            'file'          => [
                'nullable',
                'file',
                'max:51200',   // 50 MB
                'mimes:pdf,zip,rar,png,jpg,jpeg,webp,gif,svg,mp4,mov,fig,sketch,ai,psd,xd,docx,xlsx,pptx',
            ],
            'external_link' => [
                'nullable',
                'string',
                'max:2048',
                'regex:/^https?:\/\/(?:[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?\.)+[a-zA-Z]{2,}(?::\d{1,5})?(?:[\/?#][^\s"\'<>`\\^]*)?$/i',
            ],
            'notes'         => 'nullable|string|max:5000',
            'task_id'       => 'required|uuid',
        ], [
            'external_link.regex' => 'صيغة الرابط غير صحيحة أو تحتوي على محارف غير آمنة. يرجى إدخال رابط صالح يبدأ بـ http:// أو https://',
            'file.mimes'          => 'نوع الملف غير مدعوم.',
            'file.max'            => 'الحد الأقصى لحجم الملف هو 50 ميجابايت.',
        ]);

        $project = Project::findOrFail($projectId);
        abort_if((string) $project->freelancer_id !== (string) auth()->id(), 403);

        $deliverable = Deliverable::where('project_id', $projectId)
            ->where('id', $request->task_id)
            ->where(function ($query) {
                $query->whereNull('status')
                      ->orWhereNotIn('status', ['approved']);
            })
            ->firstOrFail();

        $newFileUploaded = $request->hasFile('file') && $request->file('file')->isValid();
        $hasNewLink      = $request->filled('external_link');
        $hasExistingFile = !empty($deliverable->file_path);
        $hasExistingLink = !empty($deliverable->external_link);

        // Must have at least a file OR an external link (either newly submitted or previously existing)
        if (!$newFileUploaded && !$hasNewLink && !$hasExistingFile && !$hasExistingLink) {
            return back()->withErrors(['file' => 'يجب إرفاق ملف أو رابط خارجي على الأقل.']);
        }

        // ── 1. Handle File Upload / Revision ──────────────────────────────────
        // Default: keep existing file intact if no new file is uploaded
        $filePath = $deliverable->file_path;

        if ($newFileUploaded) {
            // If new file is uploaded: remove previous file from storage and store new one
            if ($deliverable->file_path) {
                try {
                    Storage::disk('deliverables-files')->delete($deliverable->file_path);
                } catch (\Exception $e) {
                    \Log::warning('Failed to delete previous deliverable file: ' . $e->getMessage());
                }
            }

            $uploadedFile = $request->file('file');

            // Build a consistent, human-readable filename:
            // {deliverableId}-{unix_timestamp}-{sanitized_original_name}.{ext}
            $ext           = strtolower($uploadedFile->getClientOriginalExtension());
            $originalName  = pathinfo($uploadedFile->getClientOriginalName(), PATHINFO_FILENAME);
            $sanitizedName = Str::slug($originalName, '-');   // removes special chars, spaces → dashes
            $sanitizedName = Str::limit($sanitizedName, 60, '');  // cap length
            $timestamp     = now()->timestamp;
            $deliverableId = $deliverable->id;

            $fileName = "{$deliverableId}-{$timestamp}-{$sanitizedName}.{$ext}";

            // Path inside the bucket: {projectId}/{deliverableId}/
            $storagePath = "{$projectId}/{$deliverableId}";

            try {
                // putFileAs(directory, file, filename) — stores inside the bucket defined in disk config
                Storage::disk('deliverables-files')->putFileAs($storagePath, $uploadedFile, $fileName);
                $filePath = "{$storagePath}/{$fileName}";
            } catch (\Exception $e) {
                return back()->withErrors([
                    'file' => 'فشل رفع الملف إلى التخزين. يرجى المحاولة مجدداً. (' . $e->getMessage() . ')'
                ]);
            }
        }

        // ── 2. Handle External Link ──────────────────────────────────────────
        // If a new link is provided: update it (keeping existing file if no new file).
        // If NO new link is provided: keep existing link if it exists.
        // If both are provided: both are updated/replaced.
        $sanitizedLink = $hasNewLink
            ? trim(strip_tags((string) $request->external_link))
            : $deliverable->external_link;

        // ── 3. Handle Notes ──────────────────────────────────────────────────
        $sanitizedNotes = $request->filled('notes')
            ? trim(strip_tags((string) $request->notes))
            : $deliverable->notes;

        // ── 4. Save to DB ────────────────────────────────────────────────────
        $deliverable->update([
            'file_path'     => $filePath,
            'external_link' => $sanitizedLink,
            'notes'         => $sanitizedNotes,
            'status'        => 'submitted',    // resets to submitted awaiting client review
        ]);

        // ── Auto-complete project when all deliverables are submitted/approved ─
        $hasMore = Deliverable::where('project_id', $projectId)
            ->whereNotIn('status', ['submitted', 'approved'])
            ->exists();

        if (!$hasMore) {
            $allApproved = Deliverable::where('project_id', $projectId)
                ->where('status', '!=', 'approved')
                ->doesntExist();

            if ($allApproved) {
                $project->update(['status' => 'completed']);
            }
        }

        return redirect()
            ->route('freelancer.projects.show', $projectId)
            ->with('success', 'تم إرسال التسليم للعميل بنجاح! سيتم مراجعته وإخطارك بالنتيجة.');
    }

    /**
     * Legacy: mark a task complete without a file (kept for backwards compatibility).
     */
    public function submitTask(Request $request, $projectId, $taskId)
    {
        $request->validate([
            'external_link' => [
                'nullable',
                'string',
                'max:2048',
                'regex:/^https?:\/\/(?:[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?\.)+[a-zA-Z]{2,}(?::\d{1,5})?(?:[\/?#][^\s"\'<>`\\^]*)?$/i',
            ],
            'notes'         => 'nullable|string|max:5000',
        ]);

        $project = Project::findOrFail($projectId);
        abort_if($project->freelancer_id !== auth()->id(), 403);

        $deliverable = Deliverable::where('project_id', $projectId)->findOrFail($taskId);

        $deliverable->update([
            'status'          => 'completed',
            'external_link'   => $request->filled('external_link') ? trim(strip_tags((string) $request->external_link)) : null,
            'client_feedback' => $request->filled('notes') ? trim(strip_tags((string) $request->notes)) : null,
        ]);

        $nextDeliverable = Deliverable::where('project_id', $projectId)
            ->where('status', 'locked')
            ->orderBy('id', 'asc')
            ->first();

        if ($nextDeliverable) {
            $nextDeliverable->update(['status' => 'active']);
        } else {
            $project->update(['status' => 'completed']);
        }

        return redirect()->back()->with('success', 'تم إرسال التسليم للعميل بنجاح!');
    }

    /**
     * Download deliverable file securely for freelancer.
     */
    public function downloadDeliverable(Request $request, $project, $deliverable)
    {
        $projectModel = $project instanceof Project ? $project : Project::findOrFail($project);
        abort_if((string) $projectModel->freelancer_id !== (string) auth()->id(), 403, 'غير مصرح لك.');

        $deliverableModel = $deliverable instanceof Deliverable 
            ? $deliverable 
            : Deliverable::where('project_id', $projectModel->id)->findOrFail($deliverable);

        abort_if(!$deliverableModel->file_path, 404, 'الملف غير موجود.');

        $rawPath = (string) $deliverableModel->file_path;
        if (filter_var($rawPath, FILTER_VALIDATE_URL)) {
            return redirect()->away($rawPath);
        }

        $cleanPath = ltrim($rawPath, '/');
        if (preg_match('#(?:deliverables-files/)(.+)#', $cleanPath, $matches)) {
            $cleanPath = $matches[1];
        }

        $fileName = basename($cleanPath);
        $userFriendlyName = preg_replace('/^[a-f0-9\-]+-\d+-/i', '', $fileName) ?: $fileName;

        try {
            if (Storage::disk('deliverables-files')->exists($cleanPath)) {
                return Storage::disk('deliverables-files')->download($cleanPath, $userFriendlyName);
            }
        } catch (\Throwable $e) {
            \Log::warning('Freelancer download S3 error: ' . $e->getMessage());
        }

        $publicUrl = 'https://uvgwjjpzkzmgeolkqnuf.supabase.co/storage/v1/object/public/deliverables-files/' . $cleanPath;
        return redirect()->away($publicUrl);
    }

    /**
     * View deliverable file securely (inline) for freelancer.
     */
    public function viewDeliverable(Request $request, $project, $deliverable)
    {
        $projectModel = $project instanceof Project ? $project : Project::findOrFail($project);
        abort_if((string) $projectModel->freelancer_id !== (string) auth()->id(), 403, 'غير مصرح لك.');

        $deliverableModel = $deliverable instanceof Deliverable 
            ? $deliverable 
            : Deliverable::where('project_id', $projectModel->id)->findOrFail($deliverable);

        abort_if(!$deliverableModel->file_path, 404, 'الملف غير موجود.');

        $rawPath = (string) $deliverableModel->file_path;
        if (filter_var($rawPath, FILTER_VALIDATE_URL)) {
            return redirect()->away($rawPath);
        }

        $cleanPath = ltrim($rawPath, '/');
        if (preg_match('#(?:deliverables-files/)(.+)#', $cleanPath, $matches)) {
            $cleanPath = $matches[1];
        }

        $ext = strtolower(pathinfo($cleanPath, PATHINFO_EXTENSION));
        $archiveOrDesignTypes = ['zip', 'rar', '7z', 'tar', 'gz', 'psd', 'ai', 'xd', 'fig', 'sketch'];

        if (in_array($ext, $archiveOrDesignTypes)) {
            return $this->downloadDeliverable($request, $projectModel, $deliverableModel);
        }

        try {
            if (Storage::disk('deliverables-files')->exists($cleanPath)) {
                return Storage::disk('deliverables-files')->response($cleanPath);
            }
        } catch (\Throwable $e) {
            \Log::warning('Freelancer view S3 error: ' . $e->getMessage());
        }

        $publicUrl = 'https://uvgwjjpzkzmgeolkqnuf.supabase.co/storage/v1/object/public/deliverables-files/' . $cleanPath;
        return redirect()->away($publicUrl);
    }

    /**
     * File a new dispute for arbitration from the freelancer.
     */
    public function storeDispute(Request $request, $project)
    {
        $projectModel = $project instanceof Project ? $project : Project::findOrFail($project);
        abort_if((string) $projectModel->freelancer_id !== (string) auth()->id(), 403, 'غير مصرح لك بتقديم شكوى على هذا المشروع.');

        // Check if there is an existing active dispute
        $hasActiveDispute = Dispute::where('project_id', $projectModel->id)
            ->whereIn('status', ['open', 'under_review'])
            ->exists();

        if ($hasActiveDispute) {
            return back()->with('error', 'توجد بالفعل شكوى / نزاع مفتوح قيد التحكيم الإداري لهذا المشروع.');
        }

        $validated = $request->validate([
            'reason'  => 'required|string|max:255',
            'details' => 'required|string|min:15|max:5000',
        ], [
            'reason.required'  => 'يرجى اختيار سبب النزاع أو الشكوى.',
            'details.required' => 'يرجى كتابة شرح مفصل للمشكلة والطلبات.',
            'details.min'      => 'يرجى توضيح تفاصيل الشكوى بأكثر من 15 حرفاً لتمكين الإدارة من الفحص والتحكيم.',
            'details.max'      => 'تجاوزت تفاصيل الشكوى الحد المسموح به (5000 حرف).',
        ]);

        Dispute::create([
            'project_id'           => $projectModel->id,
            'initiated_by_user_id' => auth()->id(),
            'against_user_id'      => $projectModel->client_id,
            'reason'               => $validated['reason'],
            'details'              => $validated['details'],
            'status'               => 'open',
        ]);

        return back()->with('success', 'تم تسجيل الشكوى وإحالتها إلى إدارة التحكيم بنجاح. سيقوم الفريق الإداري بالاطلاع على مجريات المشروع والتواصل لفض النزاع.');
    }
}

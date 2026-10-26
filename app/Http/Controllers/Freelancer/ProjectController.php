<?php

namespace App\Http\Controllers\Freelancer;

use App\Http\Controllers\Controller;
use App\Models\Conversation;
use App\Models\Project;
use App\Models\Deliverable;
use Illuminate\Http\Request;
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
                    'remainingRevisions' => $task->remaining_revisions,
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
        ])->findOrFail($id);

        abort_if($project->freelancer_id !== auth()->id(), 403);

        $proposal = $project->originalProposal ?? $project->proposalViaBrief;

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
                'remainingRevisions' => $d->remaining_revisions,
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
            'id'             => (string) $project->id,
            'title'          => $project->title,
            'status'         => $project->status,
            'projectValue'   => $proposal ? number_format($proposal->price, 0) : '0',
            'progress'       => $progress,
            'completedTasks' => $completedTasks,
            'totalTasks'     => $totalTasks,
            'activeTaskId'   => $activeTaskId,
            'chatId'         => $conversation ? (string) $conversation->id : null,

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
                'revisions'       => $proposal->revision_limit ? "{$proposal->revision_limit} تعديلات" : 'غير محدد',
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
            'external_link' => 'nullable|url|max:2048',
            'notes'         => 'nullable|string|max:5000',
            'task_id'       => 'required|uuid',
        ]);

        // Must have at least a file OR an external_link
        if (!$request->hasFile('file') && !$request->filled('external_link')) {
            return back()->withErrors(['file' => 'يجب إرفاق ملف أو رابط خارجي على الأقل.']);
        }

        $project = Project::findOrFail($projectId);
        abort_if($project->freelancer_id !== auth()->id(), 403);

        $deliverable = Deliverable::where('project_id', $projectId)
            ->where('id', $request->task_id)
            ->where(function ($query) {
                $query->whereNull('status')
                      ->orWhereNotIn('status', ['approved']);
            })
            ->firstOrFail();

        // ── Upload file to Supabase Storage ──────────────────────────────────
        $filePath  = null;
        $publicUrl = null;

        if ($request->hasFile('file') && $request->file('file')->isValid()) {
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

                // Store the relative path (bucket-relative) — useful for constructing URLs later
                $filePath  = "{$storagePath}/{$fileName}";

                // Build the public URL for direct access
                $publicUrl = rtrim(env('SUPABASE_ENDPOINT'), '/')
                    . '/../object/public/'
                    . env('SUPABASE_BUCKET', 'deliverables-files')
                    . '/' . $filePath;
            } catch (\Exception $e) {
                return back()->withErrors([
                    'file' => 'فشل رفع الملف إلى التخزين. يرجى المحاولة مجدداً. (' . $e->getMessage() . ')'
                ]);
            }
        }

        // ── Save to DB ────────────────────────────────────────────────────────
        $deliverable->update([
            'file_path'     => $filePath,      // relative path inside bucket
            'external_link' => $request->external_link ?: null,
            'notes'         => $request->notes ?: null,
            'status'        => 'submitted',    // awaiting client review
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
            'external_link' => 'nullable|url',
            'notes'         => 'nullable|string',
        ]);

        $project = Project::findOrFail($projectId);
        abort_if($project->freelancer_id !== auth()->id(), 403);

        $deliverable = Deliverable::where('project_id', $projectId)->findOrFail($taskId);

        $deliverable->update([
            'status'          => 'completed',
            'client_feedback' => $request->notes,
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
    public function downloadDeliverable(Request $request, Project $project, Deliverable $deliverable)
    {
        abort_if($project->freelancer_id !== auth()->id(), 403, 'غير مصرح لك.');
        abort_if($deliverable->project_id !== $project->id, 404);
        abort_if(!$deliverable->file_path, 404, 'الملف غير موجود.');

        return Storage::disk('deliverables-files')->download(
            $deliverable->file_path,
            basename($deliverable->file_path)
        );
    }

    /**
     * View deliverable file securely (inline) for freelancer.
     */
    public function viewDeliverable(Request $request, Project $project, Deliverable $deliverable)
    {
        abort_if($project->freelancer_id !== auth()->id(), 403, 'غير مصرح لك.');
        abort_if($deliverable->project_id !== $project->id, 404);
        abort_if(!$deliverable->file_path, 404, 'الملف غير موجود.');

        return Storage::disk('deliverables-files')->response(
            $deliverable->file_path
        );
    }
}

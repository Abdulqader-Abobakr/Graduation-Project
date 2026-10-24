<?php

namespace App\Http\Controllers\Freelancer;

use App\Http\Controllers\Controller;
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
            ->leftJoin('sila_p.proposals as prop_orig', 'prop_orig.project_id', '=', 'sila_p.projects.id')
            ->leftJoin('sila_p.proposals as prop_brief', 'prop_brief.brief_id', '=', 'sila_p.projects.brief_id')
            ->where('sila_p.projects.freelancer_id', auth()->id())
            ->when($search !== '', function ($query) use ($search) {
                $query->where(function ($query) use ($search) {
                    $query->where('sila_p.projects.title', 'ilike', "%{$search}%")
                        ->orWhere('client.user_name', 'ilike', "%{$search}%");
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
                \Illuminate\Support\Facades\DB::raw('COALESCE(prop_orig.price, prop_brief.price, 0) as resolved_price'),
            ])
            ->with([
                'deliverables:id,project_id,title,status,file_path,external_link,created_at',
            ])
            ->latest('sila_p.projects.updated_at')
            ->get();

        $formattedProjects = $projects->map(function ($project) {
            $totalTasks = $project->deliverables->count();
            // Count 'approved' tasks AND 'submitted' tasks that actually have a file/link
            $completedTasks = $project->deliverables->filter(function ($d) {
                if ($d->status === 'approved') return true;
                if ($d->status === 'submitted' && (!empty($d->file_path) || !empty($d->external_link))) return true;
                return false;
            })->count();

            $progress = $project->status === 'completed'
                ? 100
                : ($totalTasks > 0 ? round(($completedTasks / $totalTasks) * 100) : 0);

            return [
                'id'              => (string) $project->id,
                'clientName'      => $project->client_name ?? 'عميل',
                'title'           => $project->title,
                'status'          => $project->status,
                'projectValue'    => number_format((float) ($project->resolved_price ?? 0), 0),
                'progress'        => $progress,
                'activeWorkspace' => $project->status !== 'completed',
                'completionDate'  => $project->updated_at?->format('d M Y'),
                // Map tasks properly to compute active vs locked
                'tasks'           => (function () use ($project) {
                    $tasks = [];
                    $hasActive = false;
                    foreach ($project->deliverables as $task) {
                        $hasSubmission = !empty($task->file_path) || !empty($task->external_link);

                        if ($task->status === 'approved') {
                            $status = 'completed';
                        } elseif ($task->status === 'revision_requested') {
                            $status = 'active';
                            $hasActive = true;
                        } elseif ($task->status === 'submitted' && $hasSubmission) {
                            $status = 'awaiting_review';
                        } else {
                            if (!$hasActive) {
                                $status = 'active';
                                $hasActive = true;
                            } else {
                                $status = 'locked';
                            }
                        }

                        $tasks[] = [
                            'id'      => (string) $task->id,
                            'title'   => $task->title,
                            'status'  => $status,
                            'dueDate' => null,
                        ];
                    }
                    return $tasks;
                })(),
            ];
        });

        return Inertia::render('freelancer/MyProjects', [
            'pageTitle' => 'مشاريعي',
            'projects'  => $formattedProjects,
        ]);
    }

    public function show($id)
    {
        $project = Project::with([
            'deliverables'                => fn($q) => $q->select(['id', 'project_id', 'title', 'client_feedback', 'status', 'file_path', 'external_link', 'created_at'])->orderBy('created_at', 'asc'),
            'originalProposal'            => fn($q) => $q->select(['id', 'project_id', 'title', 'price', 'revision_limit', 'timeline', 'validity', 'additional_terms']),
            'originalProposal.milestones' => fn($q) => $q->select(['id', 'proposal_id', 'title', 'description', 'amount', 'status']),
            'proposalViaBrief'            => fn($q) => $q->select(['id', 'brief_id', 'title', 'price', 'revision_limit', 'timeline', 'validity', 'additional_terms']),
            'proposalViaBrief.milestones' => fn($q) => $q->select(['id', 'proposal_id', 'title', 'description', 'amount', 'status']),
            'client:id,user_name',
        ])->findOrFail($id);

        abort_if($project->freelancer_id !== auth()->id(), 403);

        $proposal = $project->originalProposal ?? $project->proposalViaBrief;

        $projectData = [
            'id'           => (string) $project->id,
            'clientName'   => $project->client?->user_name ?? 'عميل',
            'title'        => $project->title,
            'status'       => $project->status,
            'projectValue' => $proposal ? number_format($proposal->price, 0) : '0',

            'tasks' => (function () use ($project) {
                $tasks = [];
                $hasActive = false;
                foreach ($project->deliverables as $d) {
                    $hasSubmission = !empty($d->file_path) || !empty($d->external_link);

                    if ($d->status === 'approved') {
                        $status = 'completed';
                    } elseif ($d->status === 'revision_requested') {
                        $status = 'active';
                        $hasActive = true;
                    } elseif ($d->status === 'submitted' && $hasSubmission) {
                        $status = 'awaiting_review';
                    } else {
                        // Not submitted yet
                        if (!$hasActive) {
                            $status = 'active';
                            $hasActive = true;
                        } else {
                            $status = 'locked';
                        }
                    }

                    $tasks[] = [
                        'id'          => (string) $d->id,
                        'title'       => $d->title,
                        'description' => $d->client_feedback ?? '',
                        'status'      => $status,
                        'dueDate'     => null,
                    ];
                }
                return $tasks;
            })(),

            // ── Sidebar summary (aliased keys for the SummaryItem labels) ──
            'originalProposal' => $proposal ? [
                'title'           => $proposal->title ?? $project->title,
                'totalPrice'      => number_format($proposal->price, 0),
                'revisions'       => $proposal->revision_limit
                    ? "{$proposal->revision_limit} تعديلات"
                    : 'غير محدد',
                'timeline'        => $proposal->timeline ?? 'حسب الاتفاق',
                'validity'        => $proposal->validity ?? '7 أيام',
                'additionalTerms' => $proposal->additional_terms ?? null,
                'milestones'      => $proposal->milestones->map(fn($m) => [
                    'id'    => (string) $m->id,
                    'title' => $m->title,
                    // 'amount' and 'status' are available if needed by the modal
                    'amount' => (float) $m->amount,
                    'status' => $m->status,
                ]),
            ] : null,

            // ── Raw proposal passed directly to ProposalDetailsModal ──
            // The modal resolves its own fields from the raw DB attributes.
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
                    'status' => $m->status,
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
}

<?php

namespace App\Http\Controllers\Company;

use App\Http\Controllers\Controller;
use App\Models\Brief;
use App\Models\Conversation;
use App\Models\Deliverable;
use App\Models\Freelancer;
use App\Models\Project;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class BriefController extends Controller
{
    public function index(Request $request): Response
    {
        $tab = $request->query('tab', 'explore');
        if ($request->filled('project')) {
            $tab = 'workspace';
        } elseif ($request->filled('conversation')) {
            $tab = 'chat';
        }

        $requestsLoader = fn() => $this->requestsData($request);
        $projectsLoader = fn() => $this->projectsData($request);
        $exploreLoader = fn() => $this->exploreFreelancersData();
        $freelancersLoader = fn() => $this->freelancersData();
        $conversationsLoader = fn() => $this->conversationsListData($request);

        return Inertia::render('company_side/App', [
            'requests'           => $tab === 'requests' ? $requestsLoader() : [],
            'projects'           => ($tab === 'projects' || $tab === 'workspace') ? $projectsLoader() : [],
            'exploreFreelancers' => $tab === 'explore' ? $exploreLoader() : [],
            'freelancers'        => ($tab === 'explore' || $tab === 'requests') ? $freelancersLoader() : [],
            'conversations'      => $tab === 'chat' ? $conversationsLoader() : [],
            'conversation'       => $tab === 'chat' ? $this->conversationData($request) : null,
            'workspaceProject'   => $tab === 'workspace' ? $this->workspaceProjectData($request) : null,
        ]);
    }

    public function requestsPoll(Request $request): JsonResponse
    {
        return response()->json([
            'requests' => $this->requestsData($request),
        ]);
    }

    public static function invalidateBriefCaches(?string $clientId = null): void
    {
        if ($clientId) {
            Cache::forget("company_requests_{$clientId}");
        }
        Cache::put('briefs_cache_version', (string) microtime(true), 86400);
    }

    private function requestsData(Request $request): array
    {
        $userId = (string) $request->user()->id;

        return Cache::remember("company_requests_{$userId}", 30, function () use ($userId) {
            return Brief::query()
                ->leftJoin('sila_p.users as targeted', 'sila_p.briefs.targeted_freelancer_id', '=', 'targeted.id')
                ->where('sila_p.briefs.client_id', $userId)
                ->select([
                    'sila_p.briefs.*',
                    'targeted.user_name as targeted_freelancer_name',
                    DB::raw('(SELECT COUNT(*) FROM sila_p.proposals p WHERE p.brief_id = sila_p.briefs.id) as proposals_count'),
                ])
                ->with([
                    'proposals' => fn($q) => $q
                        ->leftJoin('sila_p.users as fl', 'sila_p.proposals.freelancer_id', '=', 'fl.id')
                        ->select([
                            'sila_p.proposals.*',
                            'fl.user_name as freelancer_name',
                        ]),
                    'proposals.milestones:id,proposal_id,title,description,amount,status',
                ])
                ->orderByDesc('sila_p.briefs.created_at')
                ->get()
                ->map(fn(Brief $brief) => [
                    'id' => (string) $brief->id,
                    'title' => $brief->title,
                    'category' => $brief->category,
                    'providerType' => $brief->provider_type,
                    'description' => $brief->description,
                    'status' => $brief->status,
                    'proposalsCount' => (int) $brief->proposals_count,
                    'targetedFreelancer' => $brief->targeted_freelancer_name,
                    'targetedFreelancerId' => $brief->targeted_freelancer_id,
                    'createdAt' => $brief->created_at?->toISOString(),
                    'proposals' => $brief->proposals->map(fn($proposal) => [
                        'id' => (string) $proposal->id,
                        'freelancerId' => (string) $proposal->freelancer_id,
                        'freelancerName' => $proposal->freelancer_name ?? 'مستقل',
                        'title' => $proposal->title,
                        'price' => (float) $proposal->price,
                        'revision_limit' => $proposal->revision_limit,
                        'timeline' => $proposal->timeline,
                        'validity' => $proposal->validity,
                        'additional_terms' => $proposal->additional_terms,
                        'status' => $proposal->status,
                        'milestones' => $proposal->milestones->map(fn($milestone) => [
                            'id' => (string) $milestone->id,
                            'title' => $milestone->title,
                            'description' => $milestone->description,
                            'amount' => (float) $milestone->amount,
                            'status' => $milestone->status,
                        ])->values()->all(),
                    ])->values()->all(),
                ])
                ->values()
                ->all();
        });
    }

    private function projectsData(Request $request): array
    {
        return Project::query()
            ->leftJoin('sila_p.users as fl', 'sila_p.projects.freelancer_id', '=', 'fl.id')
            ->where('sila_p.projects.client_id', $request->user()->id)
            ->select([
                'sila_p.projects.id',
                'sila_p.projects.freelancer_id',
                'sila_p.projects.title',
                'sila_p.projects.status',
                'sila_p.projects.created_at',
                'fl.user_name as freelancer_name',
            ])
            ->orderByDesc('sila_p.projects.created_at')
            ->get()
            ->map(fn(Project $project) => [
                'id'           => (string) $project->id,
                'freelancerId' => (string) $project->freelancer_id,
                'title'        => $project->title,
                'status'       => $project->status,
                'client'       => $project->freelancer_name ?? 'مستقل',
            ])
            ->all();
    }

    private function exploreFreelancersData(): array
    {
        return Cache::remember('company_explore_freelancers', 60, function () {
            return Freelancer::query()
                ->join('sila_p.users as u', 'sila_p.freelancers.user_id', '=', 'u.id')
                ->where('u.role', 'freelancer')
                ->select([
                    'sila_p.freelancers.*',
                    'u.user_name as user_name',
                    'u.avatar_path as user_avatar_path',
                    'u.city as user_city',
                    'u.created_at as user_created_at',
                    DB::raw('(SELECT p.title FROM sila_p.portfolios p WHERE p.freelancer_id = sila_p.freelancers.id LIMIT 1) as first_portfolio_title'),
                    DB::raw("(SELECT COUNT(*) FROM sila_p.projects pr WHERE pr.freelancer_id = u.id AND pr.status = 'completed') as completed_projects_count"),
                ])
                ->with(['portfolios:id,freelancer_id,title,marketing_domain,images'])
                ->orderByDesc('sila_p.freelancers.created_at')
                ->get()
                ->map(fn(Freelancer $freelancer) => [
                    'id' => (string) $freelancer->user_id,
                    'freelancer_id' => (string) $freelancer->id,
                    'name' => $freelancer->user_name ?? 'مستقل',
                    'avatar' => $freelancer->user_avatar_path,
                    'city' => $freelancer->user_city,
                    'jobTitle' => $freelancer->job_title,
                    'bio' => $freelancer->bio,
                    'joinedAt' => $freelancer->user_created_at ? Carbon::parse($freelancer->user_created_at)->diffForHumans() : null,
                    'completedProjectsCount' => (int) ($freelancer->completed_projects_count ?? 0),
                    'industries' => array_values(array_unique(array_merge(
                        $freelancer->experienced_sectors ?? [],
                        $freelancer->marketing_specialties ?? [],
                    ))),
                    'marketing_specialties' => $freelancer->marketing_specialties ?? [],
                    'experienced_sectors' => $freelancer->experienced_sectors ?? [],
                    'portfolio' => $freelancer->first_portfolio_title,
                    'portfolios' => $freelancer->portfolios->map(fn($p) => [
                        'id' => (string) $p->id,
                        'title' => $p->title,
                        'marketing_domain' => $p->marketing_domain,
                        'images' => $p->images ?? [],
                    ])->values()->all(),
                ])
                ->all();
        });
    }

    public function showFreelancer(Request $request, string $id)
    {
        $freelancer = Freelancer::query()
            ->join('sila_p.users as u', 'sila_p.freelancers.user_id', '=', 'u.id')
            ->where('u.role', 'freelancer')
            ->where(function ($query) use ($id) {
                $query->where('sila_p.freelancers.user_id', $id)
                    ->orWhere('sila_p.freelancers.id', $id)
                    ->orWhere('u.id', $id);
            })
            ->select([
                'sila_p.freelancers.*',
                'u.user_name as user_name',
                'u.avatar_path as user_avatar_path',
                'u.city as user_city',
                'u.created_at as user_created_at',
                DB::raw('(SELECT p.title FROM sila_p.portfolios p WHERE p.freelancer_id = sila_p.freelancers.id LIMIT 1) as first_portfolio_title'),
                DB::raw("(SELECT COUNT(*) FROM sila_p.projects pr WHERE pr.freelancer_id = u.id AND pr.status = 'completed') as completed_projects_count"),
            ])
            ->with(['portfolios:id,freelancer_id,title,marketing_domain,images'])
            ->first();

        if (! $freelancer) {
            $user = User::where('id', $id)->where('role', 'freelancer')->first();
            if (! $user) {
                abort(404, 'المستقل غير موجود.');
            }

            $data = [
                'id' => (string) $user->id,
                'freelancer_id' => null,
                'name' => $user->user_name ?? 'مستقل',
                'avatar' => $user->avatar_path,
                'city' => $user->city,
                'jobTitle' => null,
                'bio' => null,
                'joinedAt' => $user->created_at?->diffForHumans(),
                'completedProjectsCount' => 0,
                'industries' => [],
                'marketing_specialties' => [],
                'experienced_sectors' => [],
                'portfolio' => null,
                'portfolios' => [],
            ];

            if ($request->wantsJson() || $request->ajax()) {
                return response()->json($data);
            }

            return redirect()->route('company.dashboard', ['tab' => 'explore', 'freelancer' => $id]);
        }

        $data = [
            'id' => (string) $freelancer->user_id,
            'freelancer_id' => (string) $freelancer->id,
            'name' => $freelancer->user_name ?? 'مستقل',
            'avatar' => $freelancer->user_avatar_path,
            'city' => $freelancer->user_city,
            'jobTitle' => $freelancer->job_title,
            'bio' => $freelancer->bio,
            'joinedAt' => $freelancer->user_created_at ? Carbon::parse($freelancer->user_created_at)->diffForHumans() : null,
            'completedProjectsCount' => (int) ($freelancer->completed_projects_count ?? 0),
            'industries' => array_values(array_unique(array_merge(
                $freelancer->experienced_sectors ?? [],
                $freelancer->marketing_specialties ?? [],
            ))),
            'marketing_specialties' => $freelancer->marketing_specialties ?? [],
            'experienced_sectors' => $freelancer->experienced_sectors ?? [],
            'portfolio' => $freelancer->first_portfolio_title,
            'portfolios' => $freelancer->portfolios->map(fn($p) => [
                'id' => (string) $p->id,
                'title' => $p->title,
                'marketing_domain' => $p->marketing_domain,
                'images' => $p->images ?? [],
            ])->values()->all(),
        ];

        if ($request->wantsJson() || $request->ajax()) {
            return response()->json($data);
        }

        return redirect()->route('company.dashboard', ['tab' => 'explore', 'freelancer' => $data['id']]);
    }

    private function freelancersData(): array
    {
        return Cache::remember('company_freelancers_list', 120, function () {
            return User::query()
                ->where('role', 'freelancer')
                ->orderBy('user_name')
                ->get(['id', 'user_name'])
                ->all();
        });
    }

    private function conversationsListData(Request $request): array
    {
        $activeConvId = $request->query('conversation');

        return Conversation::query()
            ->leftJoin('sila_p.users as fl', 'sila_p.conversations.freelancer_id', '=', 'fl.id')
            ->leftJoin('sila_p.briefs as b', 'sila_p.conversations.brief_id', '=', 'b.id')
            ->where('sila_p.conversations.client_id', $request->user()->id)
            ->select([
                'sila_p.conversations.*',
                'fl.id as fl_id',
                'fl.user_name as fl_name',
                'fl.avatar_path as fl_avatar',
                'b.title as brief_title',
                DB::raw('(SELECT m.body FROM sila_p.messages m WHERE m.conversation_id = sila_p.conversations.id ORDER BY m.created_at DESC LIMIT 1) as latest_msg_body'),
                DB::raw('(SELECT m.sender_id FROM sila_p.messages m WHERE m.conversation_id = sila_p.conversations.id ORDER BY m.created_at DESC LIMIT 1) as latest_msg_sender_id'),
                DB::raw('(SELECT m.created_at FROM sila_p.messages m WHERE m.conversation_id = sila_p.conversations.id ORDER BY m.created_at DESC LIMIT 1) as latest_msg_created_at'),
            ])
            ->orderByDesc('sila_p.conversations.updated_at')
            ->get()
            ->map(function ($conv) use ($activeConvId) {
                $latestCreatedAt = $conv->latest_msg_created_at ? Carbon::parse($conv->latest_msg_created_at) : null;
                $hasNew = false;
                if ($conv->latest_msg_sender_id && $conv->latest_msg_sender_id === $conv->freelancer_id) {
                    if ((string) $conv->id === (string) $activeConvId) {
                        $hasNew = false;
                    } elseif (! $conv->client_read_at) {
                        $hasNew = true;
                    } elseif ($latestCreatedAt) {
                        $hasNew = $latestCreatedAt->gt($conv->client_read_at);
                    }
                }

                return [
                    'id' => (string) $conv->id,
                    'subject' => $conv->subject,
                    'requestTitle' => $conv->brief_title,
                    'freelancer' => [
                        'id' => (string) $conv->fl_id,
                        'name' => $conv->fl_name ?? 'مستقل',
                        'avatar' => $conv->fl_avatar,
                    ],
                    'lastMessage' => $conv->latest_msg_body,
                    'hasNewFreelancerMessage' => $hasNew,
                    'updatedAt' => $latestCreatedAt?->diffForHumans() ?? $conv->updated_at?->diffForHumans(),
                ];
            })
            ->all();
    }

    private function conversationData(Request $request): ?array
    {
        $conversationId = $request->query('conversation');

        if (! $conversationId) {
            return null;
        }

        $userId = (string) $request->user()->id;

        $conv = DB::table('sila_p.conversations as c')
            ->leftJoin('sila_p.users as fl', 'c.freelancer_id', '=', 'fl.id')
            ->leftJoin('sila_p.briefs as b', 'c.brief_id', '=', 'b.id')
            ->where('c.id', $conversationId)
            ->where('c.client_id', $userId)
            ->select([
                'c.id',
                'c.subject',
                'fl.id as fl_id',
                'fl.user_name as fl_name',
                'fl.avatar_path as fl_avatar',
                'b.title as brief_title',
            ])
            ->first();

        if (! $conv) {
            return null;
        }

        // Mark as read for client when opened
        DB::table('sila_p.conversations')
            ->where('id', $conversationId)
            ->update(['client_read_at' => now()]);
        Cache::forget("user_unread_chat_{$userId}");
        Cache::forget("chat_meta_{$conversationId}");

        return [
            'id' => (string) $conv->id,
            'subject' => $conv->subject,
            'requestTitle' => $conv->brief_title ?: $conv->subject,
            'freelancer' => [
                'id' => (string) $conv->fl_id,
                'name' => $conv->fl_name ?? 'المستقل',
                'avatar' => $conv->fl_avatar,
            ],
            'messages' => ChatController::getCachedMessages((string) $conversationId),
        ];
    }

    private function workspaceProjectData(Request $request): ?array
    {
        $projectId = $request->query('project');

        if (! $projectId) {
            return null;
        }

        $project = Project::query()
            ->where('client_id', $request->user()->id)
            ->with([
                'deliverables' => fn($q) => $q->orderBy('created_at', 'asc'),
                'originalProposal:id,project_id,revision_limit',
                'proposalViaBrief:id,brief_id,revision_limit',
            ])
            ->findOrFail($projectId);

        $proposal = $project->originalProposal ?? $project->proposalViaBrief;
        $totalRevisionLimit = (int) ($proposal?->revision_limit ?? 2);
        $minRemaining = $project->deliverables->min('remaining_revisions');
        $projectRemainingRevisions = $minRemaining !== null ? (int) $minRemaining : $totalRevisionLimit;

        return [
            'id' => (string) $project->id,
            'title' => $project->title,
            'status' => $project->status,
            'revision_limit' => $totalRevisionLimit,
            'remaining_revisions' => $projectRemainingRevisions,
            'deliverables' => $project->deliverables->map(fn(Deliverable $d) => [
                'id' => (string) $d->id,
                'title' => $d->title,
                'status' => $d->status,
                'file_path' => $d->file_path,
                'file_name' => $d->file_path ? basename($d->file_path) : null,
                'download_url' => $d->file_path ? route('company.projects.deliverables.download', [$project->id, $d->id]) : null,
                'view_url' => $d->file_path ? route('company.projects.deliverables.view', [$project->id, $d->id]) : null,
                'external_link' => $d->external_link,
                'notes' => $d->notes,
                'client_feedback' => $d->client_feedback,
                'remaining_revisions' => $projectRemainingRevisions,
                'submitted_at' => $d->updated_at ? $d->updated_at->locale('ar')->translatedFormat('d F Y - h:i a') : null,
            ]),
        ];
    }

    public function store(Request $request): RedirectResponse
    {
        $validated = $this->validatedBrief($request);
        $userId = (string) $request->user()->id;

        Brief::create([
            'client_id' => $userId,
            'targeted_freelancer_id' => $validated['targeted_freelancer_id'],
            'title' => $validated['title'],
            'category' => $validated['category'],
            'provider_type' => $validated['provider_type'],
            'description' => strip_tags((string) $validated['description']),
            'status' => 'open',
        ]);

        self::invalidateBriefCaches($userId);

        return redirect()->route('company.dashboard', ['tab' => 'requests']);
    }

    public function update(Request $request, string $id): RedirectResponse
    {
        $userId = (string) $request->user()->id;
        $brief = Brief::where('client_id', $userId)->findOrFail($id);

        abort_if($brief->proposals()->exists(), 403, 'لا يمكن تعديل الطلب بعد تلقي عروض.');

        $validated = $this->validatedBrief($request);
        $brief->update($this->briefData($validated));

        self::invalidateBriefCaches($userId);

        return redirect()->route('company.dashboard', ['tab' => 'requests']);
    }

    public function destroy(Request $request, string $id): RedirectResponse
    {
        $userId = (string) $request->user()->id;
        $brief = Brief::where('client_id', $userId)->findOrFail($id);
        $brief->delete();

        self::invalidateBriefCaches($userId);

        return redirect()->route('company.dashboard', ['tab' => 'requests']);
    }

    private function validatedBrief(Request $request): array
    {
        $validated = $request->validate([
            'title' => ['required', 'string', 'max:255'],
            'category' => ['required', 'in:digital_marketing,branding,dev,analytics,content,تسويق رقمي,تصميم وهويات بصرية,تطوير مواقع وتطبيقات,تحليلات ولوحات بيانات,كتابة وإعداد محتوى'],
            'provider_type' => ['required', 'in:public,specific'],
            'targeted_freelancer_id' => ['nullable', 'uuid'],
            'description' => ['required', 'string', 'max:10000'],
        ]);

        if ($validated['provider_type'] === 'specific') {
            $targetId = (string) ($validated['targeted_freelancer_id'] ?? '');
            $inCachedList = collect($this->freelancersData())->contains(fn($fl) => (string) ($fl->id ?? $fl['id'] ?? '') === $targetId);
            abort_unless(
                $targetId !== '' && ($inCachedList || User::whereKey($targetId)->where('role', 'freelancer')->exists()),
                422,
                'يرجى اختيار مستقل صحيح.'
            );
        } else {
            $validated['targeted_freelancer_id'] = null;
        }

        return $validated;
    }

    private function briefData(array $validated): array
    {
        return [
            'targeted_freelancer_id' => $validated['targeted_freelancer_id'],
            'title' => $validated['title'],
            'category' => $validated['category'],
            'provider_type' => $validated['provider_type'],
            'description' => strip_tags((string) $validated['description']),
        ];
    }
}

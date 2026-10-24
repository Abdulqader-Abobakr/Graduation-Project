<?php

namespace App\Http\Controllers\Freelancer;

use App\Http\Controllers\Company\BriefController;
use App\Http\Controllers\Controller;
use App\Models\Project;
use App\Models\Proposal;
use App\Models\Conversation;
use App\Models\Brief;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class ProposalController extends Controller
{
    /**
     * Display listing of freelancer proposals, direct orders, and active negotiations.
     */
    public function index(Request $request): Response
    {
        $user = $request->user() ?? auth()->user();
        $search = trim((string) $request->query('search', ''));

        return Inertia::render('freelancer/Proposals', [
            'directOrders'  => $this->getDirectOrders($user, $search),
            'sentProposals' => $this->getSentProposals($user, $search),
        ]);
    }

    public function poll(Request $request): JsonResponse
    {
        $user = $request->user() ?? auth()->user();
        $search = trim((string) $request->query('search', ''));

        return response()->json([
            'directOrders'  => $this->getDirectOrders($user, $search),
            'sentProposals' => $this->getSentProposals($user, $search),
        ]);
    }

    private function getDirectOrders($user, string $search)
    {
        $fetch = function () use ($user, $search) {
            $targetedBriefs = Brief::query()
                ->leftJoin('sila_p.users as client', 'sila_p.briefs.client_id', '=', 'client.id')
                ->where('sila_p.briefs.status', 'open')
                ->where('sila_p.briefs.targeted_freelancer_id', $user->id)
                ->when($search !== '', function ($query) use ($search) {
                    $query->where(function ($query) use ($search) {
                        $query->where('sila_p.briefs.title', 'ilike', "%{$search}%")
                            ->orWhere('sila_p.briefs.description', 'ilike', "%{$search}%")
                            ->orWhere('client.user_name', 'ilike', "%{$search}%");
                    });
                })
                ->select([
                    'sila_p.briefs.id',
                    'sila_p.briefs.client_id',
                    'sila_p.briefs.targeted_freelancer_id',
                    'sila_p.briefs.provider_type',
                    'sila_p.briefs.title',
                    'sila_p.briefs.category',
                    'sila_p.briefs.description',
                    'sila_p.briefs.created_at',
                    'client.user_name as client_user_name',
                ])
                ->orderByDesc('sila_p.briefs.created_at')
                ->get()
                ->map(function ($brief) {
                    return [
                        'id'           => (string) $brief->id,
                        'isBrief'      => true,
                        'providerType' => $brief->targeted_freelancer_id ? 'specific' : ($brief->provider_type ?? 'public'),
                        'client'       => $brief->client_user_name ?? 'عميل جديد',
                        'service'      => $brief->title,
                        'category'     => $brief->category,
                        'description'  => $brief->description,
                        'price'        => null,
                        'delivery'     => $brief->created_at?->locale('ar')->diffForHumans() ?? 'جديد',
                    ];
                });

            $inquiryProjects = Project::query()
                ->leftJoin('sila_p.users as client', 'sila_p.projects.client_id', '=', 'client.id')
                ->where('sila_p.projects.freelancer_id', $user->id)
                ->where('sila_p.projects.status', 'inquiry')
                ->when($search !== '', function ($query) use ($search) {
                    $query->where(function ($query) use ($search) {
                        $query->where('sila_p.projects.title', 'ilike', "%{$search}%")
                            ->orWhere('client.user_name', 'ilike', "%{$search}%");
                    });
                })
                ->select([
                    'sila_p.projects.id',
                    'sila_p.projects.brief_id',
                    'sila_p.projects.freelancer_id',
                    'sila_p.projects.client_id',
                    'sila_p.projects.title',
                    'sila_p.projects.status',
                    'sila_p.projects.created_at',
                    'client.user_name as client_user_name',
                    DB::raw('COALESCE((SELECT p.price FROM sila_p.proposals p WHERE p.project_id = sila_p.projects.id LIMIT 1), (SELECT p.price FROM sila_p.proposals p WHERE p.brief_id = sila_p.projects.brief_id LIMIT 1), 0) as resolved_price'),
                    DB::raw("COALESCE((SELECT p.timeline FROM sila_p.proposals p WHERE p.project_id = sila_p.projects.id LIMIT 1), (SELECT p.timeline FROM sila_p.proposals p WHERE p.brief_id = sila_p.projects.brief_id LIMIT 1), 'بعد 5 أيام') as resolved_timeline"),
                ])
                ->orderByDesc('sila_p.projects.created_at')
                ->get()
                ->map(function ($order) {
                    return [
                        'id'       => (string) $order->id,
                        'isBrief'  => false,
                        'client'   => $order->client_user_name ?? 'عميل جديد',
                        'service'  => $order->title,
                        'price'    => number_format((float) ($order->resolved_price ?? 0)),
                        'delivery' => $order->resolved_timeline ?? 'بعد 5 أيام',
                    ];
                });

            return $targetedBriefs->concat($inquiryProjects)->values()->all();
        };

        if ($search !== '') {
            return $fetch();
        }

        $ver = Cache::get('briefs_cache_version', '1');

        return Cache::remember("freelancer_direct_orders_{$user->id}_{$ver}", 30, $fetch);
    }

    private function getSentProposals($user, string $search)
    {
        $fetch = function () use ($user, $search) {
            return Proposal::query()
                ->leftJoin('sila_p.projects', 'sila_p.proposals.project_id', '=', 'sila_p.projects.id')
                ->leftJoin('sila_p.users as client_project', 'sila_p.projects.client_id', '=', 'client_project.id')
                ->leftJoin('sila_p.briefs', 'sila_p.proposals.brief_id', '=', 'sila_p.briefs.id')
                ->leftJoin('sila_p.users as client_brief', 'sila_p.briefs.client_id', '=', 'client_brief.id')
                ->where('sila_p.proposals.freelancer_id', $user->id)
                ->when($search !== '', function ($query) use ($search) {
                    $query->where(function ($query) use ($search) {
                        $query->where('sila_p.proposals.title', 'ilike', "%{$search}%")
                            ->orWhere('sila_p.briefs.title', 'ilike', "%{$search}%")
                            ->orWhere('sila_p.projects.title', 'ilike', "%{$search}%")
                            ->orWhere('client_brief.user_name', 'ilike', "%{$search}%")
                            ->orWhere('client_project.user_name', 'ilike', "%{$search}%");
                    });
                })
                ->select([
                    'sila_p.proposals.id',
                    'sila_p.proposals.freelancer_id',
                    'sila_p.proposals.brief_id',
                    'sila_p.proposals.project_id',
                    'sila_p.proposals.title',
                    'sila_p.proposals.price',
                    'sila_p.proposals.revision_limit',
                    'sila_p.proposals.timeline',
                    'sila_p.proposals.validity',
                    'sila_p.proposals.additional_terms',
                    'sila_p.proposals.status',
                    'sila_p.proposals.created_at',
                    DB::raw("COALESCE(client_project.user_name, client_brief.user_name, 'عميل') as resolved_client_name"),
                ])
                ->with([
                    'milestones:id,proposal_id,title,description',
                ])
                ->latest('sila_p.proposals.created_at')
                ->get()
                ->map(function ($proposal) {
                    $statusType = match ($proposal->status) {
                        'accepted' => 'accepted',
                        'rejected' => 'rejected',
                        default    => 'pending',
                    };
                    $statusLabel = match ($proposal->status) {
                        'accepted' => 'مقبول',
                        'rejected' => 'مرفوض',
                        default    => 'قيد المراجعة',
                    };

                    return [
                        'id'         => $proposal->id,
                        'client'     => $proposal->resolved_client_name ?? 'عميل',
                        'title'      => $proposal->title,
                        'amount'     => number_format($proposal->price ?? 0),
                        'date'       => $proposal->created_at
                            ? $proposal->created_at->format('d F')
                            : 'اليوم',
                        'status'     => $statusLabel,
                        'statusType' => $statusType,
                        'rawProposal' => [
                            'id'              => (string) $proposal->id,
                            'title'           => $proposal->title,
                            'status'          => $proposal->status,
                            'totalPrice'      => number_format($proposal->price ?? 0),
                            'revisions'       => $proposal->revision_limit
                                ? "{$proposal->revision_limit} تعديلات"
                                : 'غير محدد',
                            'timeline'        => $proposal->timeline ?? 'أسبوعين',
                            'validity'        => $proposal->validity ?? '7 أيام',
                            'additionalTerms' => $proposal->additional_terms ?? null,
                            'milestones'      => $proposal->milestones->map(fn($item) => [
                                'id'          => (string) $item->id,
                                'title'       => $item->title,
                                'description' => $item->description,
                            ])->values()->all(),
                        ],
                    ];
                })
                ->values()
                ->all();
        };

        if ($search !== '') {
            return $fetch();
        }

        $ver = Cache::get('briefs_cache_version', '1');

        return Cache::remember("freelancer_sent_proposals_{$user->id}_{$ver}", 30, $fetch);
    }

    /**
     * Accept a direct order.
     */
    public function acceptOrder(Request $request, $id)
    {
        $brief = Brief::where('targeted_freelancer_id', $request->user()->id)
            ->where('status', 'open')
            ->find($id);

        if ($brief) {
            return $this->createForBrief($request, $id);
        }

        $project = Project::where('freelancer_id', $request->user()->id)
            ->findOrFail($id);

        $project->update(['status' => 'active']);
        BriefController::invalidateBriefCaches((string) $project->client_id);

        return redirect()->back()->with('success', 'تم قبول الطلب وبدء العمل بنجاح.');
    }

    /**
     * Reject a direct order.
     */
    public function rejectOrder(Request $request, $id)
    {
        $brief = Brief::where('targeted_freelancer_id', $request->user()->id)
            ->find($id);

        if ($brief) {
            $brief->delete();
            BriefController::invalidateBriefCaches((string) $brief->client_id);
            return redirect()->back()->with('success', 'تم رفض الطلب.');
        }

        $project = Project::where('freelancer_id', $request->user()->id)
            ->findOrFail($id);

        $project->update(['status' => 'canceled']);
        BriefController::invalidateBriefCaches((string) $project->client_id);

        return redirect()->back()->with('success', 'تم رفض الطلب.');
    }

    public function edit(Request $request, string $id)
    {
        $proposal = $this->pendingProposal($request, $id)->load(['brief.client', 'milestones']);
        $chatId = $proposal->brief?->conversations()
            ->where('freelancer_id', $request->user()->id)
            ->value('id');

        return Inertia::render('freelancer/CreateProposal', [
            'chatId' => $chatId,
            'clientName' => $proposal->brief?->client?->user_name ?? 'عميل',
            'clientRequest' => $proposal->brief?->title ?? 'طلب غير محدد',
            'proposalId' => (string) $proposal->id,
            'initialData' => [
                'title' => $proposal->title ?? '',
                'price' => (string) $proposal->price,
                'timeline' => $proposal->timeline ?? '',
                'revision_limit' => (string) $proposal->revision_limit,
                'validity' => $proposal->validity ?? '',
                'additional_terms' => $proposal->additional_terms ?? '',
                'milestones' => $proposal->milestones->map(fn ($milestone) => [
                    'id' => (string) $milestone->id,
                    'title' => $milestone->title,
                    'description' => $milestone->description ?? '',
                ])->values(),
            ],
        ]);
    }

    public function update(Request $request, string $id): RedirectResponse
    {
        $proposal = $this->pendingProposal($request, $id);
        $validated = $this->validatedProposal($request);

        DB::transaction(function () use ($proposal, $validated) {
            $proposal->update([
                'title' => $validated['title'],
                'price' => $validated['price'],
                'timeline' => $validated['timeline'],
                'revision_limit' => $validated['revision_limit'],
                'validity' => $validated['validity'],
                'additional_terms' => $validated['additional_terms'] ?? null,
            ]);
            $proposal->milestones()->delete();
            $this->createMilestones($proposal, $validated['milestones']);
        });

        BriefController::invalidateBriefCaches($proposal->brief?->client_id ? (string) $proposal->brief->client_id : null);

        return redirect()->route('freelancer.proposals')->with('success', 'تم تحديث العرض بنجاح.');
    }

    public function destroy(Request $request, string $id): RedirectResponse
    {
        $proposal = $this->pendingProposal($request, $id);
        $clientId = $proposal->brief?->client_id ? (string) $proposal->brief->client_id : null;

        DB::transaction(function () use ($proposal) {
            $proposal->milestones()->delete();
            $proposal->delete();
        });

        BriefController::invalidateBriefCaches($clientId);

        return redirect()->route('freelancer.proposals')->with('success', 'تم حذف العرض بنجاح.');
    }

    /**
     * Show the proposal creation form for a specific conversation.
     */
    public function create(Request $request, $chatId)
    {
        $user = $request->user();
        $chat = Conversation::with('client')->findOrFail($chatId);

        abort_if($chat->freelancer_id !== $user->id, 403);

        return Inertia::render('freelancer/CreateProposal', [
            'chatId'        => $chatId,
            // Fixed: user_name instead of name
            'clientName'    => $chat->client?->user_name ?? 'عميل',
            'clientRequest' => $chat->subject ?? 'طلب غير محدد',
        ]);
    }

    /**
     * Start a conversation for an open brief before creating a proposal.
     */
    public function createForBrief(Request $request, $briefId)
    {
        $user = $request->user();
        $brief = Brief::findOrFail($briefId);

        abort_unless(
            $brief->status === 'open'
                && ($brief->targeted_freelancer_id === null || $brief->targeted_freelancer_id === $user->id),
            403
        );

        $chat = Conversation::firstOrCreate(
            [
                'brief_id' => $brief->id,
                'client_id' => $brief->client_id,
                'freelancer_id' => $user->id,
            ],
            [
                'subject' => $brief->title,
                'unread_count' => 0,
            ]
        );

        return redirect()->route('freelancer.proposals.create', $chat->id);
    }

    /**
     * Store a newly submitted proposal.
     */
    public function store(Request $request, $chatId)
    {
        $user = $request->user();
        $chat = Conversation::findOrFail($chatId);

        abort_if($chat->freelancer_id !== $user->id, 403);

        $request->validate([
            'title'                        => 'required|string|max:255',
            'price'                        => 'required|numeric|min:1',
            'timeline'                     => 'required|string|max:100',
            'revision_limit'               => 'required|integer',
            'validity'                     => 'required|string|max:100',
            'additional_terms'             => 'nullable|string',
            'milestones'                   => 'required|array|min:1',
            'milestones.*.title'           => 'required|string|max:255',
            'milestones.*.description'     => 'required|string',
        ]);

        $proposal = Proposal::create([
            'freelancer_id'    => $user->id,
            'brief_id'         => $chat->brief_id ?? null,
            'title'            => $request->title,
            'price'            => $request->price,
            'timeline'         => $request->timeline,
            'revision_limit'   => $request->revision_limit,
            'validity'         => $request->validity,
            'additional_terms' => $request->additional_terms,
            'status'           => 'pending',
        ]);

        $totalAmountCents = (int) round(((float) $request->price) * 100);
        $milestoneCount = count($request->milestones);
        $baseAmountCents = intdiv($totalAmountCents, $milestoneCount);

        foreach ($request->milestones as $milestoneIndex => $milestone) {
            $milestoneAmountCents = $milestoneIndex === $milestoneCount - 1
                ? $totalAmountCents - ($baseAmountCents * ($milestoneCount - 1))
                : $baseAmountCents;

            $proposal->milestones()->create([
                'title'       => $milestone['title'],
                'description' => $milestone['description'],
                'amount'      => number_format($milestoneAmountCents / 100, 2, '.', ''),
                'status'      => 'pending',
            ]);
        }

        BriefController::invalidateBriefCaches($chat->client_id ? (string) $chat->client_id : null);

        return redirect()->route('freelancer.proposals', ['tab' => 'sent'])
            ->with('success', 'تم إرسال العرض للعميل بنجاح!');
    }

    private function pendingProposal(Request $request, string $id): Proposal
    {
        $proposal = Proposal::query()
            ->whereKey($id)
            ->where('freelancer_id', $request->user()->id)
            ->with('brief')
            ->firstOrFail();

        abort_if($proposal->status !== 'pending', 403, 'لا يمكن تعديل أو حذف عرض تمت مراجعته.');

        return $proposal;
    }

    private function validatedProposal(Request $request): array
    {
        return $request->validate([
            'title' => 'required|string|max:255',
            'price' => 'required|numeric|min:1',
            'timeline' => 'required|string|max:100',
            'revision_limit' => 'required|integer',
            'validity' => 'required|string|max:100',
            'additional_terms' => 'nullable|string',
            'milestones' => 'required|array|min:1',
            'milestones.*.title' => 'required|string|max:255',
            'milestones.*.description' => 'required|string',
        ]);
    }

    private function createMilestones(Proposal $proposal, array $milestones): void
    {
        $totalAmountCents = (int) round(((float) $proposal->price) * 100);
        $milestoneCount = count($milestones);
        $baseAmountCents = intdiv($totalAmountCents, $milestoneCount);

        foreach ($milestones as $milestoneIndex => $milestone) {
            $milestoneAmountCents = $milestoneIndex === $milestoneCount - 1
                ? $totalAmountCents - ($baseAmountCents * ($milestoneCount - 1))
                : $baseAmountCents;

            $proposal->milestones()->create([
                'title' => $milestone['title'],
                'description' => $milestone['description'],
                'amount' => number_format($milestoneAmountCents / 100, 2, '.', ''),
                'status' => 'pending',
            ]);
        }
    }
}

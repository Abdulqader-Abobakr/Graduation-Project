<?php

namespace App\Http\Controllers\Freelancer;

use App\Http\Controllers\Controller;
use App\Models\Project;
use App\Models\Transaction;
use App\Models\Brief;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Inertia\Inertia;
use Inertia\Response;

class DashboardController extends Controller
{
    /**
     * Render the Freelancer Dashboard view with real-time statistics and project activities.
     */
    public function index(Request $request): Response
    {
        $user = $request->user() ?? auth()->user();
        $search = trim((string) $request->query('search', ''));

        // 1. Statistics (Consolidated into a single SQL network roundtrip)
        $startOfMonth = now()->startOfMonth()->toDateTimeString();
        $startOfNextMonth = now()->startOfMonth()->addMonth()->toDateTimeString();

        $stats = Cache::remember("freelancer_dashboard_stats_{$user->id}", 30, function () use ($user, $startOfMonth, $startOfNextMonth) {
            return \Illuminate\Support\Facades\DB::selectOne("
                SELECT 
                    (SELECT COUNT(*) FROM sila_p.projects WHERE freelancer_id = :uid1 AND status = 'active') as active_projects,
                    (SELECT COALESCE(SUM(t.amount), 0) 
                       FROM sila_p.transactions t 
                       JOIN sila_p.projects p ON t.project_id = p.id 
                      WHERE p.freelancer_id = :uid2 
                        AND t.verification_status = 'verified' 
                        AND t.created_at >= :start 
                        AND t.created_at < :end) as monthly_earnings,
                    (SELECT COALESCE(SUM(unread_count), 0) FROM sila_p.conversations WHERE freelancer_id = :uid3) as unread_messages
            ", [
                'uid1'  => $user->id,
                'uid2'  => $user->id,
                'uid3'  => $user->id,
                'start' => $startOfMonth,
                'end'   => $startOfNextMonth,
            ]);
        });

        $statsData = [
            'activeProjects'      => (string) ($stats->active_projects ?? 0),
            'monthlyEarnings'     => number_format((float) ($stats->monthly_earnings ?? 0)),
            'earningsChange'      => '↑ 0%',
            'rating'              => '4.8',
            'completionRate'      => '95',
            'unreadMessagesCount' => (int) ($stats->unread_messages ?? 0),
        ];

        $openBriefs = $this->getOpenBriefs($user, $search);

        return Inertia::render('freelancer/Dashboard', [
            'statsData' => $statsData,
            'openBriefs' => $openBriefs,
        ]);
    }

    public function briefsPoll(Request $request): JsonResponse
    {
        $user = $request->user() ?? auth()->user();
        $search = trim((string) $request->query('search', ''));

        return response()->json([
            'openBriefs' => $this->getOpenBriefs($user, $search),
        ]);
    }

    private function getOpenBriefs($user, string $search): array
    {
        $fetch = function () use ($search) {
            return Brief::query()
                ->leftJoin('sila_p.users as client', 'sila_p.briefs.client_id', '=', 'client.id')
                ->where('sila_p.briefs.status', 'open')
                ->whereNull('sila_p.briefs.targeted_freelancer_id')
                ->where(function ($query) {
                    $query->where('sila_p.briefs.provider_type', 'public')
                        ->orWhereNull('sila_p.briefs.provider_type');
                })
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
                    'sila_p.briefs.status',
                    'sila_p.briefs.created_at',
                    'client.user_name as client_user_name',
                ])
                ->latest('sila_p.briefs.created_at')
                ->take(20)
                ->get()
                ->map(fn (Brief $brief) => [
                    'id' => (string) $brief->id,
                    'title' => $brief->title,
                    'category' => $brief->category,
                    'providerType' => $brief->targeted_freelancer_id ? 'specific' : ($brief->provider_type ?? 'public'),
                    'description' => $brief->description,
                    'client' => $brief->client_user_name ?? 'عميل',
                    'createdAt' => $brief->created_at?->locale('ar')->diffForHumans(),
                ])
                ->all();
        };

        if ($search !== '') {
            return $fetch();
        }

        $ver = Cache::get('briefs_cache_version', '1');

        return Cache::remember("freelancer_open_briefs_{$user->id}_{$ver}", 30, $fetch);
    }
}

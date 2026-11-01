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

        $cacheKey = "freelancer_dashboard_stats_{$user->id}";
        $stats = Cache::get($cacheKey);

        if (!is_array($stats) || $stats instanceof \__PHP_Incomplete_Class) {
            Cache::forget($cacheKey);

            $row = \Illuminate\Support\Facades\DB::selectOne("
                SELECT 
                    (SELECT COUNT(*) FROM sila_p.projects WHERE freelancer_id = :uid1 AND status = 'active') as active_projects,
                    (SELECT COALESCE(SUM(t.amount), 0) 
                       FROM sila_p.transactions t 
                       JOIN sila_p.projects p ON t.project_id = p.id 
                      WHERE p.freelancer_id = :uid2 
                        AND p.status = 'completed'
                        AND t.verification_status = 'verified'
                        AND (
                            (SELECT COUNT(*) FROM sila_p.deliverables d WHERE d.project_id = p.id) = 0
                            OR (SELECT COUNT(*) FROM sila_p.deliverables d WHERE d.project_id = p.id AND (d.status IS NULL OR d.status != 'approved')) = 0
                        )
                        AND COALESCE(
                            (SELECT MAX(d.updated_at) FROM sila_p.deliverables d WHERE d.project_id = p.id AND d.status = 'approved'),
                            p.updated_at
                        ) >= :start 
                        AND COALESCE(
                            (SELECT MAX(d.updated_at) FROM sila_p.deliverables d WHERE d.project_id = p.id AND d.status = 'approved'),
                            p.updated_at
                        ) < :end) as monthly_earnings,
                    (SELECT COALESCE(SUM(unread_count), 0) FROM sila_p.conversations WHERE freelancer_id = :uid3) as unread_messages,
                    (SELECT COUNT(rating) FROM sila_p.projects WHERE freelancer_id = :uid4 AND status = 'completed' AND rating IS NOT NULL) as ratings_count,
                    (SELECT ROUND(AVG(rating), 1) FROM sila_p.projects WHERE freelancer_id = :uid5 AND status = 'completed' AND rating IS NOT NULL) as rating_average,
                    (SELECT COUNT(*) FROM sila_p.projects WHERE freelancer_id = :uid6) as total_projects,
                    (SELECT COALESCE(ROUND(AVG(
                        CASE 
                            WHEN p.status = 'completed' THEN 100 
                            ELSE COALESCE(
                                (SELECT ROUND((COUNT(*) FILTER (WHERE d.status = 'approved')::numeric / NULLIF(COUNT(*), 0)) * 100) 
                                 FROM sila_p.deliverables d 
                                 WHERE d.project_id = p.id), 
                                0
                            )
                        END
                     )), 0)
                     FROM sila_p.projects p 
                     WHERE p.freelancer_id = :uid7) as completion_rate
            ", [
                'uid1'  => $user->id,
                'uid2'  => $user->id,
                'uid3'  => $user->id,
                'uid4'  => $user->id,
                'uid5'  => $user->id,
                'uid6'  => $user->id,
                'uid7'  => $user->id,
                'start' => $startOfMonth,
                'end'   => $startOfNextMonth,
            ]);

            $stats = [
                'active_projects'  => (int) ($row->active_projects ?? 0),
                'monthly_earnings' => (float) ($row->monthly_earnings ?? 0),
                'unread_messages'  => (int) ($row->unread_messages ?? 0),
                'ratings_count'    => (int) ($row->ratings_count ?? 0),
                'rating_average'   => $row && $row->rating_average !== null ? (float) $row->rating_average : null,
                'total_projects'   => (int) ($row->total_projects ?? 0),
                'completion_rate'  => (int) ($row->completion_rate ?? 0),
            ];

            Cache::put($cacheKey, $stats, 30);
        }

        $ratingsCount = (int) ($stats['ratings_count'] ?? 0);
        $ratingAverage = $ratingsCount > 0 && isset($stats['rating_average']) && $stats['rating_average'] !== null
            ? (float) $stats['rating_average']
            : null;

        $completionRate = (int) ($stats['completion_rate'] ?? 0);
        $totalProjects = (int) ($stats['total_projects'] ?? 0);

        if ($totalProjects === 0) {
            $completionRate = 0;
            $completionRateLabel = 'لا توجد مشاريع';
        } elseif ($completionRate === 0) {
            $completionRateLabel = 'لم يبدأ بعد';
        } elseif ($completionRate >= 90) {
            $completionRateLabel = 'ممتاز';
        } elseif ($completionRate >= 75) {
            $completionRateLabel = 'جيد جداً';
        } elseif ($completionRate >= 50) {
            $completionRateLabel = 'جيد';
        } else {
            $completionRateLabel = 'قيد الإنجاز';
        }

        $statsData = [
            'activeProjects'      => (string) ($stats['active_projects'] ?? 0),
            'monthlyEarnings'     => number_format((float) ($stats['monthly_earnings'] ?? 0)),
            'earningsChange'      => '↑ 0%',
            'rating'              => $ratingAverage !== null ? (string) $ratingAverage : null,
            'ratingAverage'       => $ratingAverage,
            'ratingsCount'        => $ratingsCount,
            'completionRate'      => (string) $completionRate,
            'completionRateLabel' => $completionRateLabel,
            'unreadMessagesCount' => (int) ($stats['unread_messages'] ?? 0),
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
                ->leftJoin('sila_p.client_companies as company', 'company.user_id', '=', 'client.id')
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
                            ->orWhere('client.user_name', 'ilike', "%{$search}%")
                            ->orWhere('company.business_name', 'ilike', "%{$search}%");
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
                    'client.avatar_path as client_avatar',
                    'client.city as client_city',
                    'company.business_name as company_business_name',
                    'company.industry as company_industry',
                    'company.company_description as company_description',
                ])
                ->latest('sila_p.briefs.created_at')
                ->take(20)
                ->get()
                ->map(function (Brief $brief) {
                    $displayName = $brief->company_business_name ?: ($brief->client_user_name ?? 'شركة');
                    return [
                        'id' => (string) $brief->id,
                        'title' => $brief->title,
                        'category' => $brief->category,
                        'providerType' => $brief->targeted_freelancer_id ? 'specific' : ($brief->provider_type ?? 'public'),
                        'description' => $brief->description,
                        'clientId' => (string) $brief->client_id,
                        'client' => $displayName,
                        'clientName' => $brief->client_user_name ?? 'عميل',
                        'companyName' => $brief->company_business_name,
                        'avatar' => $brief->client_avatar,
                        'city' => $brief->client_city,
                        'industry' => $brief->company_industry,
                        'companyDescription' => $brief->company_description,
                        'createdAt' => $brief->created_at?->locale('ar')->diffForHumans(),
                    ];
                })
                ->all();
        };

        if ($search !== '') {
            return $fetch();
        }

        $ver = Cache::get('briefs_cache_version', '1');

        return Cache::remember("freelancer_open_briefs_{$user->id}_{$ver}", 30, $fetch);
    }
}

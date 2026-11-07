<?php

namespace App\Http\Controllers\Company;

use App\Http\Controllers\Controller;
use App\Models\Freelancer;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class FreelancerController extends Controller
{
    /**
     * Render the Company "Explore Freelancers" page (and handle legacy ?tab= links).
     */
    public function index(Request $request)
    {
        if ($request->filled('project')) {
            return redirect()->route('company.projects.show', $request->query('project'));
        }
        if ($request->filled('conversation')) {
            return redirect()->route('company.chat.show', $request->query('conversation'));
        }

        $tab = $request->query('tab');
        if ($tab === 'requests') {
            return redirect()->route('company.requests');
        }
        if ($tab === 'projects') {
            return redirect()->route('company.projects');
        }
        if ($tab === 'chat') {
            return redirect()->route('company.chat.index');
        }

        return Inertia::render('company_side/App', [
            'activeTab'          => 'explore',
            'exploreFreelancers' => self::exploreFreelancersData(),
            'freelancers'        => self::freelancersData(),
        ]);
    }

    /**
     * Load cached freelancer cards for the Company "Explore Freelancers" tab.
     */
    public static function exploreFreelancersData(): array
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
                    DB::raw('(SELECT p.title FROM sila_p.portfolios p WHERE p.freelancer_id = sila_p.freelancers.id ORDER BY p.created_at DESC LIMIT 1) as first_portfolio_title'),
                    DB::raw("(SELECT COUNT(*) FROM sila_p.projects pr WHERE pr.freelancer_id = u.id AND pr.status = 'completed') as completed_projects_count"),
                    DB::raw("(SELECT COUNT(rating) FROM sila_p.projects pr WHERE pr.freelancer_id = u.id AND pr.status = 'completed' AND pr.rating IS NOT NULL) as ratings_count"),
                    DB::raw("(SELECT ROUND(AVG(rating), 1) FROM sila_p.projects pr WHERE pr.freelancer_id = u.id AND pr.status = 'completed' AND pr.rating IS NOT NULL) as rating_average"),
                ])
                ->with(['portfolios' => fn($q) => $q->select(['id', 'freelancer_id', 'title', 'marketing_domain', 'images', 'created_at'])->orderByDesc('created_at')])
                ->orderByDesc('sila_p.freelancers.created_at')
                ->get()
                ->map(fn(Freelancer $freelancer) => [
                    'id' => (string) $freelancer->user_id,
                    'freelancer_id' => (string) $freelancer->id,
                    'name' => $freelancer->user_name ?? 'خبير',
                    'avatar' => $freelancer->user_avatar_path,
                    'city' => $freelancer->user_city,
                    'jobTitle' => $freelancer->job_title,
                    'bio' => $freelancer->bio,
                    'joinedAt' => $freelancer->user_created_at ? Carbon::parse($freelancer->user_created_at)->diffForHumans() : null,
                    'completedProjectsCount' => (int) ($freelancer->completed_projects_count ?? 0),
                    'ratings_count' => (int) ($freelancer->ratings_count ?? 0),
                    'rating_average' => $freelancer->ratings_count > 0 ? (float) $freelancer->rating_average : null,
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

    /**
     * Load lightweight freelancer options for the "Direct Request" dropdown.
     */
    public static function freelancersData(): array
    {
        return Cache::remember('company_freelancers_list', 120, function () {
            return User::query()
                ->where('role', 'freelancer')
                ->orderBy('user_name')
                ->get(['id', 'user_name'])
                ->map(fn($u) => [
                    'id' => (string) $u->id,
                    'user_name' => (string) $u->user_name,
                ])
                ->all();
        });
    }

    /**
     * Show a specific freelancer profile (JSON for modal or redirect to Explore tab).
     */
    public function show(Request $request, string $id)
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
                DB::raw('(SELECT p.title FROM sila_p.portfolios p WHERE p.freelancer_id = sila_p.freelancers.id ORDER BY p.created_at DESC LIMIT 1) as first_portfolio_title'),
                DB::raw("(SELECT COUNT(*) FROM sila_p.projects pr WHERE pr.freelancer_id = u.id AND pr.status = 'completed') as completed_projects_count"),
                DB::raw("(SELECT COUNT(rating) FROM sila_p.projects pr WHERE pr.freelancer_id = u.id AND pr.status = 'completed' AND pr.rating IS NOT NULL) as ratings_count"),
                DB::raw("(SELECT ROUND(AVG(rating), 1) FROM sila_p.projects pr WHERE pr.freelancer_id = u.id AND pr.status = 'completed' AND pr.rating IS NOT NULL) as rating_average"),
            ])
            ->with(['portfolios' => fn($q) => $q->select(['id', 'freelancer_id', 'title', 'marketing_domain', 'images', 'created_at'])->orderByDesc('created_at')])
            ->first();

        if (! $freelancer) {
            $user = User::where('id', $id)->where('role', 'freelancer')->first();
            if (! $user) {
                abort(404, 'الخبير غير موجود.');
            }

            $data = [
                'id' => (string) $user->id,
                'freelancer_id' => null,
                'name' => $user->user_name ?? 'خبير',
                'avatar' => $user->avatar_path,
                'city' => $user->city,
                'jobTitle' => null,
                'bio' => null,
                'joinedAt' => $user->created_at?->diffForHumans(),
                'completedProjectsCount' => 0,
                'ratings_count' => 0,
                'rating_average' => null,
                'industries' => [],
                'marketing_specialties' => [],
                'experienced_sectors' => [],
                'portfolio' => null,
                'portfolios' => [],
            ];

            if ($request->wantsJson() || $request->ajax()) {
                return response()->json($data);
            }

            return redirect()->route('company.dashboard', ['freelancer' => $id]);
        }

        $data = [
            'id' => (string) $freelancer->user_id,
            'freelancer_id' => (string) $freelancer->id,
            'name' => $freelancer->user_name ?? 'خبير',
            'avatar' => $freelancer->user_avatar_path,
            'city' => $freelancer->user_city,
            'jobTitle' => $freelancer->job_title,
            'bio' => $freelancer->bio,
            'joinedAt' => $freelancer->user_created_at ? Carbon::parse($freelancer->user_created_at)->diffForHumans() : null,
            'completedProjectsCount' => (int) ($freelancer->completed_projects_count ?? 0),
            'ratings_count' => (int) ($freelancer->ratings_count ?? 0),
            'rating_average' => $freelancer->ratings_count > 0 ? (float) $freelancer->rating_average : null,
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
            return response()->json($data)
                ->header('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0');
        }

        return redirect()->route('company.dashboard', ['freelancer' => $data['id']]);
    }
}


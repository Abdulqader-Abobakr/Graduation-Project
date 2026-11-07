<?php

namespace App\Http\Controllers\Company;

use App\Http\Controllers\Controller;
use App\Mail\NewDirectOrderMail;
use App\Models\Brief;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;
use Inertia\Inertia;
use Inertia\Response;

class BriefController extends Controller
{
    public function index(Request $request): Response
    {
        return Inertia::render('company_side/App', [
            'activeTab'   => 'requests',
            'requests'    => $this->requestsData($request),
            'freelancers' => FreelancerController::freelancersData(),
        ]);
    }

    public function requestsPoll(Request $request): JsonResponse
    {
        return response()->json([
            'requests' => $this->requestsData($request),
        ]);
    }

    public function showFreelancer(Request $request, string $id)
    {
        return app(FreelancerController::class)->show($request, $id);
    }

    public static function invalidateBriefCaches(?string $clientId = null): void
    {
        if ($clientId) {
            Cache::forget("company_requests_{$clientId}");
        }
        Cache::put('briefs_cache_version', (string) microtime(true), 86400);
    }

    public static function getOpenedProposalIds(string $userId): array
    {
        $path = storage_path('app/company_opened_proposals.json');
        if (! is_file($path)) {
            return [];
        }

        try {
            $data = json_decode((string) file_get_contents($path), true);
            if (! is_array($data)) {
                return [];
            }
            $userList = $data[$userId] ?? $data['global'] ?? [];
            return is_array($userList) ? array_map('strval', $userList) : [];
        } catch (\Throwable) {
            return [];
        }
    }

    public static function markProposalAsOpened(string $userId, string $proposalId): void
    {
        $path = storage_path('app/company_opened_proposals.json');
        $data = [];

        if (is_file($path)) {
            try {
                $decoded = json_decode((string) file_get_contents($path), true);
                if (is_array($decoded)) {
                    $data = $decoded;
                }
            } catch (\Throwable) {
                $data = [];
            }
        }

        $userList = isset($data[$userId]) && is_array($data[$userId]) ? $data[$userId] : [];
        $proposalIdStr = (string) $proposalId;

        if (! in_array($proposalIdStr, $userList, true)) {
            $userList[] = $proposalIdStr;
            $data[$userId] = array_values(array_unique($userList));
            @file_put_contents($path, json_encode($data, JSON_PRETTY_PRINT));
        }

        Cache::forget("company_requests_{$userId}");
    }

    private function requestsData(Request $request): array
    {
        $userId = (string) $request->user()->id;
        $openedMap = array_flip(self::getOpenedProposalIds($userId));

        $briefs = Cache::remember("company_requests_{$userId}", 30, function () use ($userId) {
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
                            DB::raw("(SELECT COUNT(rating) FROM sila_p.projects pr WHERE pr.freelancer_id = fl.id AND pr.status = 'completed' AND pr.rating IS NOT NULL) as freelancer_ratings_count"),
                            DB::raw("(SELECT ROUND(AVG(rating), 1) FROM sila_p.projects pr WHERE pr.freelancer_id = fl.id AND pr.status = 'completed' AND pr.rating IS NOT NULL) as freelancer_rating_avg"),
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
                        'freelancerName' => $proposal->freelancer_name ?? 'خبير',
                        'freelancerRatingsCount' => (int) ($proposal->freelancer_ratings_count ?? 0),
                        'freelancerRatingAverage' => $proposal->freelancer_ratings_count > 0 ? (float) $proposal->freelancer_rating_avg : null,
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

        foreach ($briefs as &$briefItem) {
            if (! empty($briefItem['proposals']) && is_array($briefItem['proposals'])) {
                foreach ($briefItem['proposals'] as &$propItem) {
                    $pid = (string) ($propItem['id'] ?? '');
                    $status = (string) ($propItem['status'] ?? 'pending');
                    $propItem['isOpened'] = isset($openedMap[$pid]) || ($status !== 'pending');
                }
            }
        }

        return $briefs;
    }

    public function store(Request $request): RedirectResponse
    {
        $validated = $this->validatedBrief($request);
        $userId = (string) $request->user()->id;

        $brief = Brief::create([
            'client_id' => $userId,
            'targeted_freelancer_id' => $validated['targeted_freelancer_id'],
            'title' => $validated['title'],
            'category' => $this->normalizeCategory($validated['category']),
            'provider_type' => $validated['provider_type'],
            'description' => strip_tags((string) $validated['description']),
            'status' => 'open',
        ]);

        self::invalidateBriefCaches($userId);

        if (!empty($brief->targeted_freelancer_id)) {
            Cache::forget("user_pending_orders_{$brief->targeted_freelancer_id}");
            $this->notifyTargetedFreelancer($brief, $request->user());
        }

        return redirect()->route('company.requests');
    }

    private function notifyTargetedFreelancer(Brief $brief, User $client): void
    {
        try {
            $freelancerUser = User::find($brief->targeted_freelancer_id);
            if (!$freelancerUser) {
                return;
            }

            // Verify if freelancer has email notifications enabled in their settings
            $allowsEmail = (bool) ($freelancerUser->email_notifications ?? true);
            if (!$allowsEmail || empty($freelancerUser->email)) {
                return;
            }

            $mailable = new NewDirectOrderMail($brief, $client, $freelancerUser);
            $mailer = Mail::to($freelancerUser->email);

            if (!empty($freelancerUser->alternative_email) && filter_var($freelancerUser->alternative_email, FILTER_VALIDATE_EMAIL)) {
                $mailer->cc($freelancerUser->alternative_email);
            }

            $mailer->send($mailable);
            Log::info("Direct order email notification sent successfully to freelancer {$freelancerUser->email} for brief {$brief->id}");
        } catch (\Throwable $e) {
            Log::error('Failed to send direct order email notification to freelancer', [
                'brief_id' => $brief->id,
                'freelancer_id' => $brief->targeted_freelancer_id,
                'error' => $e->getMessage(),
            ]);
        }
    }

    public function update(Request $request, string $id): RedirectResponse
    {
        $userId = (string) $request->user()->id;
        $brief = Brief::where('client_id', $userId)->findOrFail($id);

        abort_if($brief->proposals()->exists(), 403, 'لا يمكن تعديل الطلب بعد تلقي عروض.');

        $validated = $this->validatedBrief($request);
        $brief->update($this->briefData($validated));

        self::invalidateBriefCaches($userId);

        return redirect()->route('company.requests');
    }

    public function destroy(Request $request, string $id): RedirectResponse
    {
        $userId = (string) $request->user()->id;
        $brief = Brief::where('client_id', $userId)->findOrFail($id);
        $brief->delete();

        self::invalidateBriefCaches($userId);

        return redirect()->route('company.requests');
    }

    private function validatedBrief(Request $request): array
    {
        $validated = $request->validate([
            'title' => ['required', 'string', 'max:255'],
            'category' => [
                'required',
                'string',
                'in:تطوير المتاجر الإلكترونية,تطوير المواقع وصفحات الهبوط,تطوير تطبيقات الويب والأنظمة,ربط البرمجيات وأتمتة الأعمال,تحسين الأداء والأمان والصيانة,تصميم الهوية البصرية والشعارات,تصميم واجهات وتجربة المستخدم,تصميم التغليف وملصقات المنتجات,تصميم العروض والملفات التعريفية,إدارة الحملات الإعلانية الممولة,الخطط والاستراتيجيات التسويقية,تحسين محركات البحث والظهور المحلي,كتابة المحتوى الإعلاني والبيعي,إدارة التواصل الاجتماعي والمحتوى,تصميم منشورات التواصل الاجتماعي,مونتاج الفيديوهات والرسوم,تطوير المواقع التعريفية وصفحات الهبوط,تطوير تطبيقات الويب والأنظمة المخصصة,تحسين أداء المواقع والأمان والصيانة التقنية,تصميم العروض الاستثمارية والملفات التعريفية,إعداد الخطط والاستراتيجيات التسويقية,إدارة حسابات التواصل الاجتماعي وجدولة المحتوى,تصميم منشورات وإعلانات التواصل الاجتماعي,مونتاج الفيديوهات القصيرة والرسوم المتحركة,digital_marketing,branding,dev,analytics,content,تسويق رقمي,تصميم وهويات بصرية,تطوير مواقع وتطبيقات,تحليلات ولوحات بيانات,كتابة وإعداد محتوى',
            ],
            'provider_type' => ['required', 'in:public,specific'],
            'targeted_freelancer_id' => ['nullable', 'uuid'],
            'description' => ['required', 'string', 'max:10000'],
        ]);

        if ($validated['provider_type'] === 'specific') {
            $targetId = (string) ($validated['targeted_freelancer_id'] ?? '');
            $inCachedList = collect(FreelancerController::freelancersData())->contains(fn($fl) => (string) (is_array($fl) ? ($fl['id'] ?? '') : ($fl->id ?? '')) === $targetId);
            abort_unless(
                $targetId !== '' && ($inCachedList || User::whereKey($targetId)->where('role', 'freelancer')->exists()),
                422,
                'يرجى اختيار خبير صحيح.'
            );
        } else {
            $validated['targeted_freelancer_id'] = null;
        }

        return $validated;
    }

    private function normalizeCategory(string $category): string
    {
        $categoryMap = [
            'تطوير المواقع التعريفية وصفحات الهبوط' => 'تطوير المواقع وصفحات الهبوط',
            'تطوير تطبيقات الويب والأنظمة المخصصة' => 'تطوير تطبيقات الويب والأنظمة',
            'تحسين أداء المواقع والأمان والصيانة التقنية' => 'تحسين الأداء والأمان والصيانة',
            'تصميم العروض الاستثمارية والملفات التعريفية' => 'تصميم العروض والملفات التعريفية',
            'إعداد الخطط والاستراتيجيات التسويقية' => 'الخطط والاستراتيجيات التسويقية',
            'إدارة حسابات التواصل الاجتماعي وجدولة المحتوى' => 'إدارة التواصل الاجتماعي والمحتوى',
            'تصميم منشورات وإعلانات التواصل الاجتماعي' => 'تصميم منشورات التواصل الاجتماعي',
            'مونتاج الفيديوهات القصيرة والرسوم المتحركة' => 'مونتاج الفيديوهات والرسوم',
            'digital_marketing' => 'إدارة الحملات الإعلانية الممولة',
            'branding' => 'تصميم الهوية البصرية والشعارات',
            'dev' => 'تطوير تطبيقات الويب والأنظمة',
            'analytics' => 'ربط البرمجيات وأتمتة الأعمال',
            'content' => 'كتابة المحتوى الإعلاني والبيعي',
            'تسويق رقمي' => 'إدارة الحملات الإعلانية الممولة',
            'تصميم وهويات بصرية' => 'تصميم الهوية البصرية والشعارات',
            'تطوير مواقع وتطبيقات' => 'تطوير تطبيقات الويب والأنظمة',
            'تحليلات ولوحات بيانات' => 'ربط البرمجيات وأتمتة الأعمال',
            'كتابة وإعداد محتوى' => 'كتابة المحتوى الإعلاني والبيعي',
        ];

        return $categoryMap[$category] ?? $category;
    }

    private function briefData(array $validated): array
    {
        return [
            'targeted_freelancer_id' => $validated['targeted_freelancer_id'],
            'title' => $validated['title'],
            'category' => $this->normalizeCategory($validated['category']),
            'provider_type' => $validated['provider_type'],
            'description' => strip_tags((string) $validated['description']),
        ];
    }
}

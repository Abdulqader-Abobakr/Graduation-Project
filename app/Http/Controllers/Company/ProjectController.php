<?php

namespace App\Http\Controllers\Company;

use App\Http\Controllers\Controller;
use App\Models\Brief;
use App\Models\Deliverable;
use App\Models\Dispute;
use App\Models\Freelancer;
use App\Models\Project;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Inertia\Inertia;

class ProjectController extends Controller
{
    /**
     * Display the project workspace inside the company SPA shell (App.jsx).
     *
     * Redirects to the SPA dashboard to maintain data context, matching the Chat behavior.
     */
    public function show(Request $request, Project $project)
    {
        if ($project->client_id !== auth()->id()) {
            abort(403, 'غير مصرح لك بالوصول إلى مساحة عمل هذا المشروع.');
        }

        return redirect()->route('company.dashboard', [
            'tab' => 'workspace',
            'project' => $project->id
        ]);
    }

    /**
     * Submit numeric star rating (1 to 5) for a completed project.
     */
    public function rate(Request $request, Project $project)
    {
        abort_unless((string) $project->client_id === (string) auth()->id(), 403, 'غير مصرح لك بتقييم هذا المشروع.');
        abort_unless($project->status === 'completed', 400, 'لا يمكن تقييم المشروع قبل اكتماله.');
        abort_if(!is_null($project->rating), 400, 'تم تقييم هذا المشروع مسبقاً.');

        $validated = $request->validate([
            'rating' => ['required', 'integer', 'min:1', 'max:5'],
        ], [
            'rating.required' => 'يرجى تحديد التقييم من 1 إلى 5 نجوم.',
            'rating.integer'  => 'قيمة التقييم غير صالحة.',
            'rating.min'      => 'أقل تقييم مسموح به هو نجمة واحدة.',
            'rating.max'      => 'أعلى تقييم مسموح به هو 5 نجوم.',
        ]);

        $project->update([
            'rating'   => (int) $validated['rating'],
            'rated_at' => now(),
        ]);

        \Illuminate\Support\Facades\Cache::forget('company_explore_freelancers');
        if ($project->freelancer_id) {
            \Illuminate\Support\Facades\Cache::forget("freelancer_dashboard_stats_{$project->freelancer_id}");
        }

        return back()->with('success', 'تم تسجيل تقييمك للخبير بنجاح!');
    }

    /**
     * Review a deliverable (approve or request revision).
     */
    public function reviewDeliverable(Request $request, Project $project, Deliverable $deliverable)
    {
        if ($project->client_id !== auth()->id()) {
            abort(403, 'غير مصرح لك.');
        }

        if ($deliverable->project_id !== $project->id) {
            abort(404);
        }

        $validated = $request->validate([
            'status' => 'required|in:approved,revision_requested',
            'client_feedback' => 'required_if:status,revision_requested|string|nullable|max:3000',
        ]);

        if ($validated['status'] === 'revision_requested') {
            // Revisions are tracked across the ENTIRE project, not per deliverable
            $project->load(['deliverables', 'originalProposal', 'proposalViaBrief']);
            $currentRemaining = $project->deliverables->min('remaining_revisions');

            if ($currentRemaining === null) {
                $proposal = $project->originalProposal ?? $project->proposalViaBrief;
                $currentRemaining = (int) ($proposal?->revision_limit ?? 2);
            }

            if ($currentRemaining <= 0) {
                abort(403, 'لقد استنفدت الحد الأقصى من التعديلات المسموحة للمشروع كامل.');
            }

            $newRemaining = max(0, $currentRemaining - 1);

            $deliverable->status = 'revision_requested';
            $deliverable->client_feedback = !empty($validated['client_feedback'])
                ? strip_tags((string) $validated['client_feedback'])
                : null;
            $deliverable->save();

            // Deduct from ALL deliverables of this project to keep project-wide balance synchronized
            $project->deliverables()->update(['remaining_revisions' => $newRemaining]);

            return back()->with('success', "تم طلب التعديل بنجاح. متبقي {$newRemaining} تعديلات للمشروع كامل.");
        }

        if ($validated['status'] === 'approved') {
            $deliverable->status = 'approved';
            $deliverable->save();

            if ($project->freelancer_id) {
                \Illuminate\Support\Facades\Cache::forget("freelancer_dashboard_stats_{$project->freelancer_id}");
            }

            $totalDeliverables = $project->deliverables()->count();
            $approvedDeliverables = $project->deliverables()->where('status', 'approved')->count();

            if ($totalDeliverables > 0 && $totalDeliverables === $approvedDeliverables) {
                \Illuminate\Support\Facades\DB::transaction(function () use ($project) {
                    $project->status = 'completed';
                    $project->save();

                    $freelancerWallet = \App\Models\Wallet::firstOrCreate(
                        ['user_id' => $project->freelancer_id],
                        ['available_balance' => 0, 'pending_balance' => 0]
                    );

                    $project->load('originalProposal');
                    $amount = $project->originalProposal?->price ?? 0;

                    $freelancerWallet->decrement('pending_balance', $amount);
                    $freelancerWallet->increment('available_balance', $amount);
                });

                if ($project->freelancer_id) {
                    \Illuminate\Support\Facades\Cache::forget("freelancer_dashboard_stats_{$project->freelancer_id}");
                }

                return back()->with('success', 'تم قبول التسليم بنجاح، وجميع تسليمات المشروع مكتملة. تم تحويل المبلغ للرصيد المتاح للخبير.');
            }

            return back()->with('success', 'تم قبول التسليم بنجاح، وتم إتاحة التسليم التالي للخبير (إن وجد).');
        }

        return back();
    }

    /**
     * Force download the deliverable file securely from Supabase S3.
     */
    public function downloadDeliverable(Request $request, $project, $deliverable)
    {
        $projectModel = $project instanceof Project ? $project : Project::findOrFail($project);
        if ((string) $projectModel->client_id !== (string) auth()->id()) {
            abort(403, 'غير مصرح لك.');
        }

        $deliverableModel = $deliverable instanceof Deliverable 
            ? $deliverable 
            : Deliverable::where('project_id', $projectModel->id)->findOrFail($deliverable);

        if (! $deliverableModel->file_path) {
            abort(404, 'الملف غير موجود.');
        }

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
            if (\Illuminate\Support\Facades\Storage::disk('deliverables-files')->exists($cleanPath)) {
                return \Illuminate\Support\Facades\Storage::disk('deliverables-files')->download($cleanPath, $userFriendlyName);
            }
        } catch (\Throwable $e) {
            \Log::warning('Company download S3 error: ' . $e->getMessage());
        }

        $publicUrl = 'https://uvgwjjpzkzmgeolkqnuf.supabase.co/storage/v1/object/public/deliverables-files/' . $cleanPath;
        return redirect()->away($publicUrl);
    }

    /**
     * View the deliverable file securely in the browser (inline) from Supabase S3.
     */
    public function viewDeliverable(Request $request, $project, $deliverable)
    {
        $projectModel = $project instanceof Project ? $project : Project::findOrFail($project);
        if ((string) $projectModel->client_id !== (string) auth()->id()) {
            abort(403, 'غير مصرح لك.');
        }

        $deliverableModel = $deliverable instanceof Deliverable 
            ? $deliverable 
            : Deliverable::where('project_id', $projectModel->id)->findOrFail($deliverable);

        if (! $deliverableModel->file_path) {
            abort(404, 'الملف غير موجود.');
        }

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
            if (\Illuminate\Support\Facades\Storage::disk('deliverables-files')->exists($cleanPath)) {
                return \Illuminate\Support\Facades\Storage::disk('deliverables-files')->response($cleanPath);
            }
        } catch (\Throwable $e) {
            \Log::warning('Company view S3 error: ' . $e->getMessage());
        }

        $publicUrl = 'https://uvgwjjpzkzmgeolkqnuf.supabase.co/storage/v1/object/public/deliverables-files/' . $cleanPath;
        return redirect()->away($publicUrl);
    }

    /**
     * File a new dispute for arbitration.
     */
    public function storeDispute(Request $request, Project $project)
    {
        $projectModel = $project instanceof Project ? $project : Project::findOrFail($project);

        if ((string) $projectModel->client_id !== (string) auth()->id()) {
            abort(403, 'غير مصرح لك بتقديم شكوى على هذا المشروع.');
        }

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
            'against_user_id'      => $projectModel->freelancer_id,
            'reason'               => $validated['reason'],
            'details'              => $validated['details'],
            'status'               => 'open',
        ]);

        return back()->with('success', 'تم تسجيل الشكوى وإحالتها إلى إدارة التحكيم بنجاح. سيقوم الفريق الإداري بالاطلاع على مجريات المشروع والتواصل لفض النزاع.');
    }
}

<?php

namespace App\Http\Controllers\Company;

use App\Http\Controllers\Controller;
use App\Models\Brief;
use App\Models\Deliverable;
use App\Models\Freelancer;
use App\Models\Project;
use App\Models\User;
use Illuminate\Http\Request;
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
            if ($deliverable->remaining_revisions <= 0) {
                abort(403, 'لقد استنفدت الحد الأقصى من التعديلات المسموحة لهذا التسليم.');
            }

            $deliverable->status = 'revision_requested';
            $deliverable->client_feedback = !empty($validated['client_feedback'])
                ? strip_tags((string) $validated['client_feedback'])
                : null;
            $deliverable->remaining_revisions = max(0, $deliverable->remaining_revisions - 1);
            $deliverable->save();

            return back()->with('success', 'تم طلب التعديل بنجاح وتم إرسال الملاحظات للمستقل.');
        }

        if ($validated['status'] === 'approved') {
            $deliverable->status = 'approved';
            $deliverable->save();

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

                return back()->with('success', 'تم قبول التسليم بنجاح، وجميع تسليمات المشروع مكتملة. تم تحويل المبلغ للرصيد المتاح للمستقل.');
            }

            return back()->with('success', 'تم قبول التسليم بنجاح، وتم إتاحة التسليم التالي للمستقل (إن وجد).');
        }

        return back();
    }

    /**
     * Force download the deliverable file securely from Supabase S3.
     */
    public function downloadDeliverable(Request $request, Project $project, Deliverable $deliverable)
    {
        if ($project->client_id !== auth()->id()) {
            abort(403, 'غير مصرح لك.');
        }

        if ($deliverable->project_id !== $project->id) {
            abort(404);
        }

        if (! $deliverable->file_path) {
            abort(404, 'الملف غير موجود.');
        }

        return \Illuminate\Support\Facades\Storage::disk('deliverables-files')->download(
            $deliverable->file_path, 
            basename($deliverable->file_path)
        );
    }

    /**
     * View the deliverable file securely in the browser (inline) from Supabase S3.
     */
    public function viewDeliverable(Request $request, Project $project, Deliverable $deliverable)
    {
        if ($project->client_id !== auth()->id()) {
            abort(403, 'غير مصرح لك.');
        }

        if ($deliverable->project_id !== $project->id) {
            abort(404);
        }

        if (! $deliverable->file_path) {
            abort(404, 'الملف غير موجود.');
        }

        return \Illuminate\Support\Facades\Storage::disk('deliverables-files')->response(
            $deliverable->file_path
        );
    }
}

<?php

namespace App\Http\Controllers\Company;

use App\Http\Controllers\Controller;
use App\Models\Project;
use App\Models\Transaction;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Inertia\Response;

class PaymentController extends Controller
{
    /**
     * Show the payment page for a pending project.
     */
    public function create(Request $request, Project $project): Response
    {
        abort_unless($project->client_id === $request->user()->id, 403);
        abort_unless($project->status === 'pending_payment', 422, 'هذا المشروع لا يتطلب دفعاً حالياً.');

        $project->load('originalProposal');

        return Inertia::render('company_side/pages/PaymentPage', [
            'project' => [
                'id'    => (string) $project->id,
                'title' => $project->title,
                'price' => (float) ($project->originalProposal?->price ?? 0),
            ],
        ]);
    }

    /**
     * Process the payment receipt upload and activate the project.
     */
    public function store(Request $request, Project $project): RedirectResponse
    {
        abort_unless($project->client_id === $request->user()->id, 403);
        abort_unless($project->status === 'pending_payment', 422, 'هذا المشروع لا يتطلب دفعاً حالياً.');

        $validated = $request->validate([
            'receipt'        => ['required', 'file', 'mimes:jpg,jpeg,png,webp,pdf', 'max:51200'],
            'payment_method' => ['required', 'string', 'max:100', 'regex:/^[\p{Arabic}a-zA-Z0-9_\-\s]+$/u'],
        ], [
            'receipt.required' => 'يرجى إرفاق صورة السند أو الإيصال.',
            'receipt.mimes'    => 'الملف يجب أن يكون بصيغة: jpg, jpeg, png, webp, pdf.',
            'receipt.max'      => 'حجم الملف يجب ألا يتجاوز 50 ميجابايت.',
            'payment_method.regex' => 'طريقة الدفع المحددة غير صالحة.',
        ]);

        $project->load('originalProposal');

        $path = $request->file('receipt')->store(
            'project_' . $project->id,
            'receipts'
        );

        abort_unless($path, 500, 'فشل رفع الإيصال. يرجى المحاولة مرة أخرى.');

        \Illuminate\Support\Facades\DB::transaction(function () use ($project, $request, $validated, $path) {
            $amount = $project->originalProposal?->price ?? 0;

            Transaction::create([
                'project_id'          => $project->id,
                'client_id'           => $request->user()->id,
                'amount'              => $amount,
                'payment_method'      => $validated['payment_method'],
                'receipt_image_path'  => $path,
                'verification_status' => 'verified',
            ]);

            $project->update(['status' => 'active']);

            $freelancerWallet = \App\Models\Wallet::firstOrCreate(
                ['user_id' => $project->freelancer_id],
                ['available_balance' => 0, 'pending_balance' => 0]
            );
            
            $freelancerWallet->increment('pending_balance', $amount);
        });

        return redirect()
            ->route('company.projects')
            ->with('success', 'تم تأكيد الدفع وتفعيل المشروع بنجاح، والمبلغ الآن في حساب الضمان للخبير.');
    }
}

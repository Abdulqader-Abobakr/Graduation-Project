<?php

namespace App\Http\Controllers\Company;

use App\Http\Controllers\Controller;
use App\Models\Conversation;
use App\Models\Message;
use App\Models\Deliverable;
use App\Models\Project;
use App\Models\Proposal;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class ProposalController extends Controller
{
    public function accept(Request $request, string $id): RedirectResponse
    {
        $proposal = $this->companyProposal($request, $id);

        abort_if($proposal->status !== 'pending', 422, 'هذا العرض لم يعد قيد المراجعة.');

        DB::transaction(function () use ($proposal) {
            $proposal = Proposal::query()->lockForUpdate()->findOrFail($proposal->id);
            abort_if($proposal->status !== 'pending', 422, 'هذا العرض لم يعد قيد المراجعة.');

            $project = Project::create([
                'brief_id' => $proposal->brief_id,
                'client_id' => $proposal->brief->client_id,
                'freelancer_id' => $proposal->freelancer_id,
                'title' => $proposal->title,
                'status' => 'pending_payment',
                'progress' => 0,
            ]);

            // Create deliverables based on the proposal milestones with project-wide revision limit
            $projectRevisionLimit = (int) ($proposal->revision_limit ?? 2);
            foreach ($proposal->milestones as $milestone) {
                Deliverable::create([
                    'project_id' => $project->id,
                    'title' => $milestone->title,
                    'remaining_revisions' => $projectRevisionLimit,
                    'status' => null, // Will be set to 'submitted' by the freelancer later
                ]);
            }

            $proposal->update([
                'status' => 'accepted',
                'project_id' => $project->id,
            ]);
        });

        BriefController::invalidateBriefCaches((string) $request->user()->id);
        \Illuminate\Support\Facades\Cache::forget("company_pending_proposals_{$request->user()->id}");

        return redirect()->route('company.dashboard', ['tab' => 'projects'])->with('success', 'تم قبول العرض بنجاح. يرجى إتمام الدفع لتفعيل المشروع وبدء العمل.');
    }

    public function deny(Request $request, string $id): RedirectResponse
    {
        $proposal = $this->companyProposal($request, $id);

        abort_if($proposal->status !== 'pending', 422, 'هذا العرض لم يعد قيد المراجعة.');
        $proposal->update(['status' => 'rejected']);

        BriefController::invalidateBriefCaches((string) $request->user()->id);
        \Illuminate\Support\Facades\Cache::forget("company_pending_proposals_{$request->user()->id}");

        return redirect()->back()->with('success', 'تم رفض العرض.');
    }

    public function startChat(Request $request, string $id): RedirectResponse
    {
        $proposal = $this->companyProposal($request, $id);
        $brief = $proposal->brief;

        $conversation = Conversation::firstOrCreate(
            [
                'brief_id' => $brief->id,
                'client_id' => $brief->client_id,
                'freelancer_id' => $proposal->freelancer_id,
            ],
            [
                'subject' => $proposal->title,
                'unread_count' => 0,
            ]
        );
        return redirect()->route('company.dashboard', [
            'tab' => 'chat',
            'conversation' => $conversation->id
        ]);
    }

    public function sendMessage(Request $request, string $id): RedirectResponse
    {
        $conversation = Conversation::query()
            ->where('client_id', $request->user()->id)
            ->findOrFail($id);

        $validated = $request->validate([
            'body' => ['required', 'string', 'max:5000'],
        ]);

        Message::create([
            'conversation_id' => $conversation->id,
            'sender_id' => $request->user()->id,
            'body' => strip_tags((string) $validated['body']),
        ]);

        \Illuminate\Support\Facades\Cache::forget("chat_messages_{$conversation->id}");
        \Illuminate\Support\Facades\Cache::forget("chat_meta_{$conversation->id}");
        \Illuminate\Support\Facades\Cache::forget("user_unread_chat_{$conversation->freelancer_id}");

        return redirect()->back();
    }

    private function companyProposal(Request $request, string $id): Proposal
    {
        return Proposal::query()
            ->whereKey($id)
            ->whereHas('brief', fn ($query) => $query->where('client_id', $request->user()->id))
            ->with('brief')
            ->firstOrFail();
    }
}

<?php

namespace App\Http\Controllers\Freelancer;

use App\Http\Controllers\Company\ChatController as CompanyChatController;
use App\Http\Controllers\Controller;
use App\Mail\NewChatMessageMail;
use App\Models\Conversation;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;

class ChatController extends Controller
{
    /**
     * Render the Freelancer Chat page (All Conversations list or Open Conversation).
     */
    public function index(Request $request): Response
    {
        $activeConvId = $request->query('conversation');
        $search = trim((string) $request->query('search', ''));

        return Inertia::render('freelancer/Chat', [
            'conversations' => $this->conversationsListData($request, $activeConvId),
            'conversation' => $activeConvId ? $this->activeConversationData($request, (string) $activeConvId) : null,
            'search' => $search,
        ]);
    }

    /**
     * Show a specific conversation directly (e.g. /freelancer/chat/{conversation}).
     */
    public function show(Request $request, string $conversation): Response
    {
        $search = trim((string) $request->query('search', ''));
        $convData = $this->activeConversationData($request, $conversation);

        abort_unless($convData !== null, 403);

        return Inertia::render('freelancer/Chat', [
            'conversations' => $this->conversationsListData($request, $conversation),
            'conversation' => $convData,
            'search' => $search,
        ]);
    }

    /**
     * Lightweight JSON endpoint for auto-refreshing the freelancer conversations list.
     */
    public function conversations(Request $request): JsonResponse
    {
        $activeConvId = $request->query('conversation');

        return response()->json([
            'conversations' => $this->conversationsListData($request, $activeConvId ? (string) $activeConvId : null),
        ]);
    }

    /**
     * Ultra-fast JSON endpoint for polling messages.
     * Uses shared write-through local cache so active polling executes 0 remote DB queries.
     */
    public function messages(Request $request, string $conversation): JsonResponse
    {
        $userId = (string) $request->user()->id;

        $meta = CompanyChatController::getConversationMeta($conversation);
        abort_unless($meta && $meta['freelancer_id'] === $userId, 403);

        if (! empty($meta['unread_for_freelancer'])) {
            DB::table('sila_p.conversations')
                ->where('id', $conversation)
                ->update([
                    'freelancer_read_at' => now(),
                    'unread_count' => 0,
                ]);
            $meta['unread_for_freelancer'] = false;
            Cache::put("chat_meta_{$conversation}", $meta, 600);
            Cache::forget("user_unread_chat_{$userId}");
        }

        $messages = CompanyChatController::getCachedMessages($conversation);

        return response()->json(['messages' => $messages]);
    }

    /**
     * Send a message using a single SQL CTE (1 DB round-trip) and write-through cache update.
     */
    public function store(Request $request, string $conversation): JsonResponse
    {
        $validated = $request->validate([
            'body' => 'required|string|max:2000',
        ]);

        $user = $request->user();
        $userId = (string) $user->id;
        $cleanBody = strip_tags((string) $validated['body']);
        $msgId = (string) Str::uuid();

        $row = DB::selectOne(
            "WITH updated_conv AS (
                UPDATE sila_p.conversations
                SET updated_at = NOW(),
                    freelancer_read_at = NOW(),
                    unread_count = 0
                WHERE id = ? AND freelancer_id = ?
                RETURNING id, client_id, freelancer_id
            ),
            inserted_msg AS (
                INSERT INTO sila_p.messages (id, conversation_id, sender_id, body, created_at)
                SELECT ?, id, ?, ?, NOW()
                FROM updated_conv
                RETURNING id, created_at
            )
            SELECT u.id AS conv_id, u.client_id, u.freelancer_id, m.id AS msg_id, m.created_at
            FROM updated_conv u
            JOIN inserted_msg m ON true",
            [$conversation, $userId, $msgId, $userId, $cleanBody]
        );

        abort_unless($row !== null, 403);

        $createdAt = Carbon::parse($row->created_at);
        $messageData = [
            'id' => (string) $row->msg_id,
            'conversation_id' => (string) $conversation,
            'sender_id' => $userId,
            'body' => $cleanBody,
            'created_at' => $createdAt->toISOString(),
            'time' => $createdAt->format('H:i'),
            'sender' => [
                'id' => $userId,
                'user_name' => $user->user_name ?? 'مستخدم',
                'avatar_path' => $user->avatar_path,
                'avatar' => $user->avatar_path,
            ],
        ];

        $cached = Cache::get("chat_messages_{$conversation}");
        if (is_array($cached)) {
            $cached[] = $messageData;
            Cache::put("chat_messages_{$conversation}", $cached, 120);
        } else {
            Cache::forget("chat_messages_{$conversation}");
        }

        Cache::put("chat_meta_{$conversation}", [
            'id' => (string) $conversation,
            'client_id' => (string) $row->client_id,
            'freelancer_id' => (string) $row->freelancer_id,
            'unread_for_client' => true,
            'unread_for_freelancer' => false,
        ], 600);

        Cache::forget("user_unread_chat_{$row->client_id}");

        $this->notifyRecipientOfMessage(
            recipientId: (string) $row->client_id,
            sender: $user,
            conversationId: (string) $conversation,
            messageBody: $cleanBody
        );

        return response()->json(['message' => $messageData]);
    }

    private function notifyRecipientOfMessage(string $recipientId, User $sender, string $conversationId, string $messageBody): void
    {
        try {
            $throttleKey = "chat_email_throttled_{$conversationId}_{$recipientId}";
            if (Cache::has($throttleKey)) {
                return;
            }

            $recipient = User::find($recipientId);
            if (!$recipient || empty($recipient->email)) {
                return;
            }

            if (! (bool) ($recipient->email_notifications ?? true)) {
                return;
            }

            $subject = DB::table('sila_p.conversations')->where('id', $conversationId)->value('subject') ?? 'محادثة مباشرة';

            $mailable = new NewChatMessageMail($recipient, $sender, $subject, $messageBody, $conversationId);
            $mailer = Mail::to($recipient->email);
            if (!empty($recipient->alternative_email) && filter_var($recipient->alternative_email, FILTER_VALIDATE_EMAIL)) {
                $mailer->cc($recipient->alternative_email);
            }
            $mailer->send($mailable);

            // Throttle email alerts for 15 minutes per conversation to avoid spamming the inbox
            Cache::put($throttleKey, true, now()->addMinutes(15));
            Log::info("Chat message email notification sent to {$recipient->email} for conversation {$conversationId}");
        } catch (\Throwable $e) {
            Log::error('Failed to send chat email notification', [
                'conversation_id' => $conversationId,
                'recipient_id'    => $recipientId,
                'error'           => $e->getMessage(),
            ]);
        }
    }

    /**
     * Delete a conversation from the Freelancer side.
     */
    public function destroy(string $conversation)
    {
        $userId = auth()->id();

        $conv = DB::table('sila_p.conversations')
            ->where('id', $conversation)
            ->where('freelancer_id', $userId)
            ->first(['id', 'client_id', 'freelancer_id']);

        abort_unless($conv !== null, 403);

        DB::table('sila_p.messages')->where('conversation_id', $conversation)->delete();
        DB::table('sila_p.conversations')->where('id', $conversation)->delete();

        Cache::forget("chat_messages_{$conversation}");
        Cache::forget("chat_meta_{$conversation}");
        Cache::forget("user_unread_chat_{$conv->client_id}");
        Cache::forget("user_unread_chat_{$conv->freelancer_id}");

        return redirect()->route('freelancer.chat.index')
            ->with('success', 'تم حذف المحادثة بنجاح.');
    }

    private function conversationsListData(Request $request, ?string $activeConvId = null): array
    {
        $userId = $request->user()->id;

        return Conversation::query()
            ->leftJoin('sila_p.users as cl', 'sila_p.conversations.client_id', '=', 'cl.id')
            ->leftJoin('sila_p.briefs as b', 'sila_p.conversations.brief_id', '=', 'b.id')
            ->where('sila_p.conversations.freelancer_id', $userId)
            ->select([
                'sila_p.conversations.*',
                'cl.id as cl_id',
                'cl.user_name as cl_name',
                'cl.avatar_path as cl_avatar',
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

                if ($conv->latest_msg_sender_id && $conv->latest_msg_sender_id === $conv->client_id) {
                    if ((string) $conv->id === (string) $activeConvId) {
                        $hasNew = false;
                    } elseif (((int) ($conv->unread_count ?? 0)) > 0) {
                        $hasNew = true;
                    } elseif (! $conv->freelancer_read_at) {
                        $hasNew = true;
                    } elseif ($latestCreatedAt) {
                        $hasNew = $latestCreatedAt->gt($conv->freelancer_read_at);
                    }
                }

                return [
                    'id' => (string) $conv->id,
                    'subject' => $conv->subject,
                    'requestTitle' => $conv->brief_title ?: $conv->subject,
                    'client' => [
                        'id' => (string) $conv->cl_id,
                        'name' => $conv->cl_name ?? 'عميل',
                        'avatar' => $conv->cl_avatar,
                    ],
                    'lastMessage' => $conv->latest_msg_body,
                    'hasNewClientMessage' => $hasNew,
                    'updatedAt' => $latestCreatedAt?->diffForHumans() ?? $conv->updated_at?->diffForHumans(),
                ];
            })
            ->all();
    }

    private function activeConversationData(Request $request, string $conversationId): ?array
    {
        $userId = (string) $request->user()->id;

        $conv = DB::table('sila_p.conversations as c')
            ->leftJoin('sila_p.users as cl', 'c.client_id', '=', 'cl.id')
            ->leftJoin('sila_p.briefs as b', 'c.brief_id', '=', 'b.id')
            ->where('c.id', $conversationId)
            ->where('c.freelancer_id', $userId)
            ->select([
                'c.id',
                'c.subject',
                'c.brief_id',
                'c.client_id',
                'c.freelancer_id',
                'cl.id as cl_id',
                'cl.user_name as cl_name',
                'cl.avatar_path as cl_avatar',
                'b.title as brief_title',
            ])
            ->first();

        if (! $conv) {
            return null;
        }

        // Mark as read for freelancer when opened
        DB::table('sila_p.conversations')
            ->where('id', $conversationId)
            ->update([
                'freelancer_read_at' => now(),
                'unread_count' => 0,
            ]);

        Cache::forget("user_unread_chat_{$userId}");
        Cache::forget("chat_meta_{$conversationId}");

        return [
            'id' => (string) $conv->id,
            'subject' => $conv->subject,
            'brief_id' => $conv->brief_id ? (string) $conv->brief_id : null,
            'requestTitle' => $conv->brief_title ?: $conv->subject,
            'client' => [
                'id' => (string) $conv->cl_id,
                'name' => $conv->cl_name ?? 'العميل',
                'user_name' => $conv->cl_name ?? 'العميل',
                'avatar' => $conv->cl_avatar,
            ],
            'messages' => CompanyChatController::getCachedMessages($conversationId),
        ];
    }
}

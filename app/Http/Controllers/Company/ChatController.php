<?php

namespace App\Http\Controllers\Company;

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

class ChatController extends Controller
{
    /**
     * Render the Company Chat overview page.
     */
    public function index(Request $request)
    {
        return Inertia::render('company_side/App', [
            'activeTab'     => 'chat',
            'conversations' => self::conversationsListData($request),
            'conversation'  => null,
        ]);
    }

    /**
     * Show the chat page for a specific conversation directly inside the company SPA shell.
     */
    public function show(Request $request, string $conversation)
    {
        $convData = self::conversationData($request, $conversation);
        abort_unless($convData !== null, 403);

        return Inertia::render('company_side/App', [
            'activeTab'     => 'chat',
            'conversations' => self::conversationsListData($request, $conversation),
            'conversation'  => $convData,
        ]);
    }

    /**
     * Lightweight JSON endpoint for auto-refreshing the conversations overview list.
     */
    public function conversations(Request $request): JsonResponse
    {
        return response()->json([
            'conversations' => self::conversationsListData($request),
        ]);
    }

    /**
     * Load the conversations overview list for the Company Chat tab.
     */
    public static function conversationsListData(Request $request, ?string $activeConvId = null): array
    {
        $userId = $request->user()->id;
        $activeConvId = $activeConvId ?? $request->query('conversation');

        return Conversation::query()
            ->leftJoin('sila_p.users as fl', 'sila_p.conversations.freelancer_id', '=', 'fl.id')
            ->leftJoin('sila_p.briefs as b', 'sila_p.conversations.brief_id', '=', 'b.id')
            ->where('sila_p.conversations.client_id', $userId)
            ->select([
                'sila_p.conversations.*',
                'fl.id as fl_id',
                'fl.user_name as fl_name',
                'fl.avatar_path as fl_avatar',
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
                if ($conv->latest_msg_sender_id && $conv->latest_msg_sender_id === $conv->freelancer_id) {
                    if ((string) $conv->id === (string) $activeConvId) {
                        $hasNew = false;
                    } elseif (! $conv->client_read_at) {
                        $hasNew = true;
                    } elseif ($latestCreatedAt) {
                        $hasNew = $latestCreatedAt->gt($conv->client_read_at);
                    }
                }

                return [
                    'id' => (string) $conv->id,
                    'subject' => $conv->subject,
                    'requestTitle' => $conv->brief_title,
                    'freelancer' => [
                        'id' => (string) $conv->fl_id,
                        'name' => $conv->fl_name ?? 'خبير',
                        'avatar' => $conv->fl_avatar,
                    ],
                    'lastMessage' => $conv->latest_msg_body,
                    'hasNewFreelancerMessage' => $hasNew,
                    'updatedAt' => $latestCreatedAt?->diffForHumans() ?? $conv->updated_at?->diffForHumans(),
                ];
            })
            ->all();
    }

    /**
     * Load active conversation details & messages for the Company Chat tab.
     */
    public static function conversationData(Request $request, ?string $conversationId = null): ?array
    {
        $conversationId = $conversationId ?? $request->query('conversation');

        if (! $conversationId) {
            return null;
        }

        $userId = (string) $request->user()->id;

        $conv = DB::table('sila_p.conversations as c')
            ->leftJoin('sila_p.users as fl', 'c.freelancer_id', '=', 'fl.id')
            ->leftJoin('sila_p.briefs as b', 'c.brief_id', '=', 'b.id')
            ->where('c.id', $conversationId)
            ->where('c.client_id', $userId)
            ->select([
                'c.id',
                'c.subject',
                'fl.id as fl_id',
                'fl.user_name as fl_name',
                'fl.avatar_path as fl_avatar',
                'b.title as brief_title',
            ])
            ->first();

        if (! $conv) {
            return null;
        }

        // Mark as read for client when opened
        DB::table('sila_p.conversations')
            ->where('id', $conversationId)
            ->update(['client_read_at' => now()]);
        Cache::forget("user_unread_chat_{$userId}");
        Cache::forget("chat_meta_{$conversationId}");

        return [
            'id' => (string) $conv->id,
            'subject' => $conv->subject,
            'requestTitle' => $conv->brief_title ?: $conv->subject,
            'freelancer' => [
                'id' => (string) $conv->fl_id,
                'name' => $conv->fl_name ?? 'الخبير',
                'avatar' => $conv->fl_avatar,
            ],
            'messages' => self::getCachedMessages((string) $conversationId),
        ];
    }

    /**
     * Ultra-fast JSON endpoint for polling messages.
     * Uses write-through local cache so active polling executes 0 remote DB queries.
     */
    public function messages(Request $request, string $conversation): JsonResponse
    {
        $userId = (string) $request->user()->id;

        $meta = $this->getConversationMeta($conversation);
        abort_unless($meta && $meta['client_id'] === $userId, 403);

        if (! empty($meta['unread_for_client'])) {
            DB::table('sila_p.conversations')
                ->where('id', $conversation)
                ->update(['client_read_at' => now()]);
            $meta['unread_for_client'] = false;
            Cache::put("chat_meta_{$conversation}", $meta, 600);
            Cache::forget("user_unread_chat_{$userId}");
        }

        $messages = self::getCachedMessages($conversation);

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
                    client_read_at = NOW(),
                    unread_count = COALESCE(unread_count, 0) + 1
                WHERE id = ? AND client_id = ?
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
            'unread_for_client' => false,
            'unread_for_freelancer' => true,
        ], 600);

        Cache::forget("user_unread_chat_{$row->freelancer_id}");

        $this->notifyRecipientOfMessage(
            recipientId: (string) $row->freelancer_id,
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

    public function destroy(string $conversation)
    {
        $userId = auth()->id();

        $conv = DB::table('sila_p.conversations')
            ->where('id', $conversation)
            ->where('client_id', $userId)
            ->first(['id', 'client_id', 'freelancer_id']);

        abort_unless($conv !== null, 403);

        DB::table('sila_p.messages')->where('conversation_id', $conversation)->delete();
        DB::table('sila_p.conversations')->where('id', $conversation)->delete();

        Cache::forget("chat_messages_{$conversation}");
        Cache::forget("chat_meta_{$conversation}");
        Cache::forget("user_unread_chat_{$conv->client_id}");
        Cache::forget("user_unread_chat_{$conv->freelancer_id}");

        return redirect()->route('company.chat.index')
            ->with('success', 'تم حذف المحادثة بنجاح.');
    }

    public static function getConversationMeta(string $conversationId): ?array
    {
        return Cache::remember("chat_meta_{$conversationId}", 600, function () use ($conversationId) {
            $conv = DB::table('sila_p.conversations')
                ->where('id', $conversationId)
                ->select([
                    'id',
                    'client_id',
                    'freelancer_id',
                    'unread_count',
                    'client_read_at',
                    'freelancer_read_at',
                    DB::raw('(SELECT m.sender_id FROM sila_p.messages m WHERE m.conversation_id = sila_p.conversations.id ORDER BY m.created_at DESC LIMIT 1) as latest_sender_id'),
                    DB::raw('(SELECT m.created_at FROM sila_p.messages m WHERE m.conversation_id = sila_p.conversations.id ORDER BY m.created_at DESC LIMIT 1) as latest_created_at'),
                ])
                ->first();

            if (! $conv) {
                return null;
            }

            $unreadForClient = false;
            if ($conv->latest_sender_id && $conv->latest_sender_id === $conv->freelancer_id) {
                if (! $conv->client_read_at) {
                    $unreadForClient = true;
                } elseif ($conv->latest_created_at) {
                    $unreadForClient = Carbon::parse($conv->latest_created_at)->gt(Carbon::parse($conv->client_read_at));
                }
            }

            $unreadForFreelancer = ((int) ($conv->unread_count ?? 0)) > 0;
            if (! $unreadForFreelancer && $conv->latest_sender_id && $conv->latest_sender_id === $conv->client_id) {
                if (! $conv->freelancer_read_at) {
                    $unreadForFreelancer = true;
                } elseif ($conv->latest_created_at) {
                    $unreadForFreelancer = Carbon::parse($conv->latest_created_at)->gt(Carbon::parse($conv->freelancer_read_at));
                }
            }

            return [
                'id' => (string) $conv->id,
                'client_id' => (string) $conv->client_id,
                'freelancer_id' => (string) $conv->freelancer_id,
                'unread_for_client' => $unreadForClient,
                'unread_for_freelancer' => $unreadForFreelancer,
            ];
        });
    }

    public static function getCachedMessages(string $conversationId): array
    {
        return Cache::remember("chat_messages_{$conversationId}", 120, function () use ($conversationId) {
            return DB::table('sila_p.messages as m')
                ->leftJoin('sila_p.users as u', 'm.sender_id', '=', 'u.id')
                ->where('m.conversation_id', $conversationId)
                ->orderBy('m.created_at', 'asc')
                ->select([
                    'm.id',
                    'm.conversation_id',
                    'm.sender_id',
                    'm.body',
                    'm.created_at',
                    'u.user_name as sender_name',
                    'u.avatar_path as sender_avatar',
                ])
                ->get()
                ->map(function ($m) {
                    $createdAt = Carbon::parse($m->created_at);
                    return [
                        'id' => (string) $m->id,
                        'conversation_id' => (string) $m->conversation_id,
                        'sender_id' => (string) $m->sender_id,
                        'body' => $m->body,
                        'created_at' => $createdAt->toISOString(),
                        'time' => $createdAt->format('H:i'),
                        'sender' => [
                            'id' => (string) $m->sender_id,
                            'user_name' => $m->sender_name ?? 'مستخدم',
                            'avatar_path' => $m->sender_avatar,
                            'avatar' => $m->sender_avatar,
                        ],
                    ];
                })
                ->values()
                ->all();
        });
    }
}

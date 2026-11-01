<?php

namespace App\Http\Middleware;

use App\Models\Conversation;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Inertia\Middleware;

class HandleInertiaRequests extends Middleware
{
    /**
     * The root template that is loaded on the first page visit.
     *
     * @var string
     */
    protected $rootView = 'app';

    /**
     * Determine the current asset version.
     */
    public function version(Request $request): ?string
    {
        return parent::version($request);
    }

    /**
     * Define the props that are shared by default.
     *
     * @return array<string, mixed>
     */
    public function share(Request $request): array
    {
        $user = $request->user();
        $clientCompany = $user?->role === 'client_company'
            ? Cache::remember("user_client_company_{$user->id}", 300, function () use ($user) {
                $cc = $user->clientCompany;
                return $cc ? $cc->only([
                    'id',
                    'user_id',
                    'business_name',
                    'industry',
                    'company_description',
                    'commercial_register_path',
                ]) : null;
            })
            : null;

        return [
            ...parent::share($request),
            'auth' => [
                'user' => $user ? array_merge(
                    $user->only([
                        'id',
                        'user_name',
                        'email',
                        'role',
                        'avatar_path',
                        'account_state',
                    ]),
                    [
                        'client_company' => $clientCompany,
                    ]
                ) : null,
            ],
            'pageTitle' => null,
            // Flash messages — available as usePage().props.flash in React
            'flash' => [
                'success' => $request->session()->pull('success'),
                'error'   => $request->session()->pull('error'),
            ],
            'unreadChatCount' => fn () => $user ? Cache::remember("user_unread_chat_{$user->id}", 60, function () use ($user) {
                return ($user->role === 'client_company' || $user->role === 'company')
                    ? Conversation::where('client_id', $user->id)
                        ->whereRaw('(SELECT m.sender_id FROM sila_p.messages m WHERE m.conversation_id = sila_p.conversations.id ORDER BY m.created_at DESC LIMIT 1) = sila_p.conversations.freelancer_id AND (sila_p.conversations.client_read_at IS NULL OR sila_p.conversations.client_read_at < (SELECT m.created_at FROM sila_p.messages m WHERE m.conversation_id = sila_p.conversations.id ORDER BY m.created_at DESC LIMIT 1))')
                        ->count()
                    : Conversation::where('freelancer_id', $user->id)
                        ->whereRaw('(SELECT m.sender_id FROM sila_p.messages m WHERE m.conversation_id = sila_p.conversations.id ORDER BY m.created_at DESC LIMIT 1) = sila_p.conversations.client_id AND (sila_p.conversations.freelancer_read_at IS NULL OR sila_p.conversations.freelancer_read_at < (SELECT m.created_at FROM sila_p.messages m WHERE m.conversation_id = sila_p.conversations.id ORDER BY m.created_at DESC LIMIT 1))')
                        ->count();
            }) : 0,
        ];
    }
}

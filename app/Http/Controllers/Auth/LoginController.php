<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Services\SupabaseService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Cookie;
use Illuminate\Support\Facades\Log;
use Inertia\Inertia;

class LoginController extends Controller
{
    protected SupabaseService $supabase;

    public function __construct(SupabaseService $supabase)
    {
        $this->supabase = $supabase;
    }

    public function create(Request $request)
    {
        $remembered = $request->cookie('sila_remember_me') === '1';

        return Inertia::render('Auth/Login', [
            'rememberedEmail' => $remembered ? (string) $request->cookie('sila_remembered_email', '') : '',
            'rememberedPassword' => $remembered ? (string) $request->cookie('sila_remembered_password', '') : '',
            'remembered' => $remembered,
        ]);
    }

    public function store(Request $request)
    {
        $credentials = $request->validate([
            'email' => [
                'required',
                'string',
                'email',
                'max:255',
                'regex:/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/',
            ],
            'password' => ['required', 'string', 'max:100'],
        ], [
            'email.required' => 'البريد الإلكتروني مطلوب.',
            'email.email' => 'البريد الإلكتروني غير صحيح.',
            'email.regex' => 'صيغة البريد الإلكتروني غير صحيحة.',
            'password.required' => 'كلمة المرور مطلوبة.',
        ]);

        $email = strtolower(trim($credentials['email']));

        $response = $this->supabase->signIn(
            $email,
            $credentials['password']
        );

        $errorCode = $response['error_code'] ?? $response['error'] ?? null;
        $user = null;

        // Fallback to local password verification if Supabase Auth REST endpoint timed out
        if ($errorCode === 'connection_timeout') {
            try {
                $localUser = User::whereRaw('LOWER(email) = ?', [$email])->first();
                if ($localUser && !empty($localUser->password) && \Illuminate\Support\Facades\Hash::check($credentials['password'], $localUser->password)) {
                    $user = $localUser;
                }
            } catch (\Throwable $dbException) {
                Log::warning('Local DB fallback failed during login timeout', [
                    'email' => $email,
                    'message' => $dbException->getMessage(),
                ]);
            }
        }

        if (! $user) {
            if (isset($response['error']) || isset($response['error_code']) || empty($response['user']['id'])) {
                Log::warning('Supabase login failed', [
                    'email' => $email,
                    'error_code' => $errorCode,
                    'error' => $response['error'] ?? null,
                ]);

                $message = match ($errorCode) {
                    'email_not_confirmed' => 'يرجى تأكيد بريدك الإلكتروني أولاً.',
                    'invalid_grant', 'invalid_credentials' => 'البريد الإلكتروني أو كلمة المرور غير صحيحة.',
                    'connection_timeout' => 'تعذر الاتصال بالخادم بسبب بطء أو انقطاع الإنترنت. يرجى التحقق من اتصالك والمحاولة مرة أخرى.',
                    default => 'تعذر تسجيل الدخول. تحقق من إعدادات حسابك وحاول مرة أخرى.',
                };

                return back()->withErrors(['email' => $message])->withInput();
            }

            $supabaseUser = $response['user'];
            try {
                $user = User::find($supabaseUser['id']);
            } catch (\Throwable $dbException) {
                Log::error('Database error while fetching user profile on login', [
                    'supabase_user_id' => $supabaseUser['id'],
                    'message' => $dbException->getMessage(),
                ]);

                return back()->withErrors([
                    'email' => 'تعذر الوصول إلى قاعدة البيانات حالياً بسبب بطء الاتصال. يرجى المحاولة مرة أخرى.',
                ])->withInput();
            }

            if (! $user) {
                Log::error('Supabase user has no local profile', [
                    'supabase_user_id' => $supabaseUser['id'],
                    'email' => $email,
                ]);

                return back()->withErrors([
                    'email' => 'لم يكتمل إعداد هذا الحساب. يرجى التواصل مع الدعم.',
                ])->withInput();
            }

            // Keep local password hash synchronized for Laravel session guard & remember me
            if (empty($user->password) || !\Illuminate\Support\Facades\Hash::check($credentials['password'], $user->password)) {
                try {
                    $user->password = \Illuminate\Support\Facades\Hash::make($credentials['password']);
                    $user->save();
                } catch (\Throwable $e) {
                    Log::warning('Could not sync local password hash on login', ['message' => $e->getMessage()]);
                }
            }
        }

        $remember = $request->boolean('remember');

        if ($remember) {
            // Persist encrypted remember-me credentials in browser cookies for 30 days (43200 minutes)
            Cookie::queue('sila_remember_me', '1', 43200);
            Cookie::queue('sila_remembered_email', $email, 43200);
            Cookie::queue('sila_remembered_password', $credentials['password'], 43200);
        } else {
            Cookie::queue(Cookie::forget('sila_remember_me'));
            Cookie::queue(Cookie::forget('sila_remembered_email'));
            Cookie::queue(Cookie::forget('sila_remembered_password'));
        }

        Auth::login($user, $remember);
        $request->session()->regenerate();
        session(['supabase_token' => $response['access_token'] ?? null]);

    $role = $user->role;

    $destination = $role === 'freelancer' ? '/freelancer' : '/company';

    return redirect($destination)
        ->header('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0')
        ->header('Pragma', 'no-cache')
        ->header('Expires', '0');
}

    public function destroy()
    {
        Auth::logout();
        session()->forget('supabase_token');
        request()->session()->invalidate();
        request()->session()->regenerateToken();

        return redirect('/login')
            ->header('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0')
            ->header('Pragma', 'no-cache')
            ->header('Expires', '0');
    }
}
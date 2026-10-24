<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Services\SupabaseService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Inertia\Inertia;

class ForgotPasswordController extends Controller
{
    protected SupabaseService $supabase;

    public function __construct(SupabaseService $supabase)
    {
        $this->supabase = $supabase;
    }

    /**
     * Send password reset link to user's email via Supabase.
     */
    public function sendResetLinkEmail(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'email' => ['required', 'string', 'email', 'max:255'],
        ], [
            'email.required' => 'البريد الإلكتروني مطلوب.',
            'email.email' => 'البريد الإلكتروني غير صالح.',
        ]);

        $email = strtolower(trim($validated['email']));

        // Verify user exists in platform
        $user = User::whereRaw('LOWER(email) = ?', [$email])->first();
        if (! $user) {
            return response()->json([
                'message' => 'البريد الإلكتروني المدخل غير مسجل لدينا.',
            ], 422);
        }

        $redirectTo = url('/reset-password');
        $response = $this->supabase->sendPasswordResetEmail($email, $redirectTo);

        if (isset($response['error']) || isset($response['error_code'])) {
            $msg = $response['error_description'] ?? $response['msg'] ?? 'تعذر إرسال رابط إعادة التعيين. يرجى المحاولة لاحقاً.';
            return response()->json(['message' => $msg], 400);
        }

        return response()->json([
            'message' => 'تم إرسال رابط إعادة تعيين كلمة المرور إلى بريدك الإلكتروني بنجاح.',
        ]);
    }

    /**
     * Show reset password view when user clicks email link.
     */
    public function showResetForm(Request $request)
    {
        return Inertia::render('Auth/ResetPassword', [
            'email' => $request->query('email', ''),
        ]);
    }

    /**
     * Reset the user's password.
     */
    public function reset(Request $request)
    {
        $validated = $request->validate([
            'access_token' => ['nullable', 'string'],
            'email' => ['required', 'email'],
            'password' => [
                'required',
                'string',
                'min:8',
                'confirmed',
                'regex:/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};\':"\\\\|,.<>\/?]).{8,}$/',
            ],
        ], [
            'email.required' => 'البريد الإلكتروني مطلوب.',
            'password.required' => 'كلمة المرور الجديدة مطلوبة.',
            'password.min' => 'يجب ألا تقل كلمة المرور عن 8 أحرف.',
            'password.regex' => 'كلمة المرور يجب أن تحتوي على حروف صغيرة وكبيرة وأرقام ورموز خاصة.',
            'password.confirmed' => 'تأكيد كلمة المرور غير متطابق.',
        ]);

        $email = strtolower(trim($validated['email']));
        $user = User::whereRaw('LOWER(email) = ?', [$email])->first();

        if (! $user) {
            return back()->withErrors(['email' => 'المستخدم غير موجود.']);
        }

        // If access token is passed from Supabase recovery redirect
        if (!empty($validated['access_token'])) {
            $updateResponse = $this->supabase->updateUserPassword($validated['access_token'], $validated['password']);
            if (isset($updateResponse['error']) || isset($updateResponse['error_code'])) {
                $msg = $updateResponse['error_description'] ?? $updateResponse['msg'] ?? 'فشل تحديث كلمة المرور في مزود المصادقة.';
                return back()->withErrors(['password' => $msg]);
            }
        }

        // Update local database password hash
        $user->update([
            'password' => Hash::make($validated['password']),
        ]);

        return redirect('/login')->with('success', 'تم إعادة تعيين كلمة المرور بنجاح. يمكنك الآن تسجيل الدخول.');
    }
}


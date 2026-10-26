<?php

namespace App\Http\Controllers\Freelancer;

use App\Http\Controllers\Controller;
use App\Services\SupabaseService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\Rule;
use Inertia\Inertia;

class ProfileController extends Controller
{
    public function settings()
    {
        $user = auth()->user();

        return Inertia::render('freelancer/ProfileSettings', [
            'pageTitle' => 'الإعدادات',
            'user' => [
                'user_name' => $user?->user_name ?? '',
                'email' => $user?->email ?? '',
                'alternative_email' => $user?->alternative_email ?? '',
                'email_notifications' => (bool) ($user?->email_notifications ?? true),
                'phone_number' => $user?->phone_number ?? '',
                'city' => $user?->city ?? '',
                'avatar_path' => $user?->avatar_path,
            ],
        ]);
    }

    public function show()
    {
        $user       = auth()->user();
        $freelancer = $user->freelancer;

        $avatarUrl = $user->avatar_path; // avatar_path now stores the full public URL

        return Inertia::render('freelancer/Profile', [
            'pageTitle'  => $user->user_name ?: 'الملف الشخصي',
            'user'       => [
                'user_name'    => $user->user_name ?? '',
                'email'        => $user->email ?? '',
                'phone_number' => $user->phone_number ?? '',
                'city'         => $user->city ?? '',
                'avatar_path'  => $avatarUrl,
            ],
            'freelancer' => [
                // job_title and bio now exist as real DB columns on sila_p.freelancers
                'job_title'              => $freelancer?->job_title ?? '',
                'bio'                    => $freelancer?->bio ?? '',
                'marketing_specialties'  => $freelancer?->marketing_specialties ?? [],
                'experienced_sectors'    => $freelancer?->experienced_sectors ?? [],
            ],
        ]);
    }

    public function update(Request $request)
    {
        $user = auth()->user();

        $validated = $request->validate([
            'user_name'              => 'required|string|max:255',
            'email'                  => [
                'required',
                'email',
                'max:255',
                Rule::unique(
                    ($user->getConnectionName() ?: config('database.default')) . '.' . $user->getTable(),
                    'email'
                )->ignore($user->getKey(), $user->getKeyName()),
            ],
            'phone_number'           => 'nullable|string|max:50',
            'city'                   => 'nullable|string|max:255',
            'job_title'              => 'nullable|string|max:255',
            'bio'                    => 'nullable|string',
            'marketing_specialties'  => 'nullable|array',
            'marketing_specialties.*' => 'string',
            'experienced_sectors'    => 'nullable|array',
            'experienced_sectors.*'  => 'string',
            'avatar'                 => 'nullable|image|mimes:jpeg,png,jpg,webp|max:5120',
        ]);

        // Handle avatar upload to Supabase 'avatars' bucket
        if ($request->hasFile('avatar')) {
            $avatarFile = $request->file('avatar');
            $ext = strtolower($avatarFile->getClientOriginalExtension());
            $fileName = "{$user->id}-" . now()->timestamp . ".{$ext}";
            $storagePath = "{$user->id}"; // Store in a folder named after the user ID

            try {
                Storage::disk('avatars')->putFileAs($storagePath, $avatarFile, $fileName);
                
                $filePath = "{$storagePath}/{$fileName}";
                $publicUrl = rtrim(env('SUPABASE_URL'), '/')
                    . '/storage/v1/object/public/avatars/'
                    . $filePath;

                $user->avatar_path = $publicUrl;
            } catch (\Exception $e) {
                return back()->withErrors(['avatar' => 'فشل رفع الصورة الشخصية: ' . $e->getMessage()]);
            }
        }

        $user->update([
            'user_name'    => $validated['user_name'],
            'email'        => $validated['email'],
            'phone_number' => $validated['phone_number'] ?? null,
            'city'         => $validated['city'] ?? null,
            'avatar_path'  => $user->avatar_path,
        ]);

        // Create the freelancer profile record if it doesn't exist yet
        $freelancer = $user->freelancer;
        if (! $freelancer) {
            $freelancer = $user->freelancer()->create();
        }

        $freelancer->update([
            'job_title'             => $validated['job_title'] ?? null,
            'bio'                   => $validated['bio'] ?? null,
            'marketing_specialties' => $validated['marketing_specialties'] ?? [],
            'experienced_sectors'   => $validated['experienced_sectors'] ?? [],
        ]);

        return redirect()->back()->with('success', 'تم تحديث الملف الشخصي بنجاح.');
    }

    public function updatePassword(Request $request, SupabaseService $supabase)
    {
        $validated = $request->validate([
            'current_password' => ['required'],
            'password' => [
                'required',
                'string',
                'min:8',
                'confirmed',
                'different:current_password',
                'regex:/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};\':"\\\\|,.<>\/?]).{8,}$/',
            ],
        ], [
            'current_password.required' => 'حقل كلمة المرور الحالية مطلوب.',
            'password.required' => 'حقل كلمة المرور الجديدة مطلوب.',
            'password.min' => 'يجب ألا تقل كلمة المرور الجديدة عن 8 أحرف.',
            'password.confirmed' => 'تأكيد كلمة المرور غير متطابق.',
            'password.different' => 'لا يمكن أن تكون كلمة المرور الجديدة مطابقة لكلمة المرور الحالية.',
            'password.regex' => 'كلمة المرور يجب أن تحتوي على حروف صغيرة وكبيرة وأرقام ورموز خاصة.',
        ]);

        $user = $request->user();

        // 1. Verify current password with Supabase Auth
        $authResponse = $supabase->signIn($user->email, $validated['current_password']);

        if (isset($authResponse['error']) || isset($authResponse['error_code']) || empty($authResponse['access_token'])) {
            $errCode = $authResponse['error_code'] ?? $authResponse['error'] ?? null;
            return back()->withErrors([
                'current_password' => $errCode === 'connection_timeout'
                    ? 'تعذر الاتصال بخادم المصادقة بسبب بطء الشبكة. يرجى المحاولة مرة أخرى.'
                    : 'كلمة المرور الحالية غير صحيحة.',
            ]);
        }

        // 2. Update password in Supabase Auth using the obtained access token
        $updateResponse = $supabase->updateUserPassword($authResponse['access_token'], $validated['password']);

        if (isset($updateResponse['error']) || isset($updateResponse['error_code'])) {
            $errorMsg = $updateResponse['error_description'] ?? $updateResponse['msg'] ?? '';
            $isSamePasswordError = str_contains(strtolower($errorMsg), 'same_password')
                || str_contains(strtolower($errorMsg), 'should be different');

            return back()->withErrors([
                'password' => $isSamePasswordError
                    ? 'لا يمكن أن تكون كلمة المرور الجديدة مطابقة لكلمة المرور الحالية.'
                    : ($errorMsg ?: 'فشل تحديث كلمة المرور في مزود المصادقة.'),
            ]);
        }

        // 3. Keep local Laravel user in sync
        $user->update([
            'password' => Hash::make($validated['password']),
        ]);

        // Keep session supabase_token updated
        session(['supabase_token' => $updateResponse['access_token'] ?? $authResponse['access_token']]);

        return redirect()->back()->with('success', 'تم تغيير كلمة المرور بنجاح.');
    }

    public function updateAlternativeEmail(Request $request)
    {
        $user = $request->user();

        $validated = $request->validate([
            'alternative_email' => [
                'nullable',
                'email',
                'max:255',
                function ($attribute, $value, $fail) use ($user) {
                    if ($value && strtolower(trim($value)) === strtolower(trim($user->email))) {
                        $fail('لا يمكن أن يكون البريد البديل مطابقاً للبريد الأساسي.');
                    }
                },
            ],
        ], [
            'alternative_email.email' => 'يرجى إدخال بريد إلكتروني صالح.',
            'alternative_email.max' => 'يجب ألا يتجاوز البريد الإلكتروني 255 حرفاً.',
        ]);

        $user->update([
            'alternative_email' => !empty($validated['alternative_email']) ? trim($validated['alternative_email']) : null,
        ]);

        return back()->with('success', 'تم حفظ البريد الإلكتروني البديل بنجاح.');
    }

    public function updateNotifications(Request $request)
    {
        $validated = $request->validate([
            'email_notifications' => ['required', 'boolean'],
        ]);

        $request->user()->update([
            'email_notifications' => $validated['email_notifications'],
        ]);

        return back()->with('success', 'تم تحديث إعدادات إشعارات البريد بنجاح.');
    }
}

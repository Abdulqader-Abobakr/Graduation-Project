<?php

namespace App\Http\Controllers\Company;

use App\Http\Controllers\Controller;
use App\Services\SupabaseService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Rules\Password;
use Inertia\Inertia;

class ProfileController extends Controller
{
    private function getCachedCompany($user): ?array
    {
        if (! $user) {
            return null;
        }

        return Cache::remember("user_client_company_{$user->id}", 300, function () use ($user) {
            $cc = $user->clientCompany;
            return $cc ? $cc->only([
                'id',
                'user_id',
                'business_name',
                'industry',
                'company_description',
                'commercial_register_path',
            ]) : null;
        });
    }

    public function show()
    {
        $user = auth()->user();
        $company = $this->getCachedCompany($user);

        return Inertia::render('company_side/Profile', [
            'pageTitle' => 'ملفي الشخصي',
            'user' => [
                'user_name' => $user?->user_name ?? '',
                'email' => $user?->email ?? '',
                'phone_number' => $user?->phone_number ?? '',
                'city' => $user?->city ?? '',
                'avatar_path' => $user?->avatar_path,
            ],
            'company' => [
                'business_name' => $company['business_name'] ?? '',
                'industry' => $company['industry'] ?? '',
                'company_description' => $company['company_description'] ?? '',
            ],
        ]);
    }

    public function settings()
    {
        $user = auth()->user();
        $company = $this->getCachedCompany($user);

        return Inertia::render('company_side/ProfileSettings', [
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
            'company' => [
                'business_name' => $company['business_name'] ?? '',
                'industry' => $company['industry'] ?? '',
                'company_description' => $company['company_description'] ?? '',
            ],
        ]);
    }

    public function update(Request $request)
    {
        $user = auth()->user();

        $validated = $request->validate([
            'user_name' => [
                'required',
                'string',
                'min:2',
                'max:60',
                'regex:/^[\p{Arabic}\s]+$/u',
            ],
            'email' => [
                'required',
                'email',
                'max:255',
                'regex:/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/',
                Rule::unique('sila_p.users', 'email')->ignore($user->id),
            ],
            'phone_number' => [
                'nullable',
                'string',
                'max:50',
                'regex:/^([0-9\s\-\+\(\)]*)$/',
            ],
            'city' => [
                'nullable',
                'string',
                'min:2',
                'max:50',
                'regex:/^[\p{Arabic}\s]+$/u',
            ],
            'business_name' => [
                'nullable',
                'string',
                'min:2',
                'max:100',
                'regex:/^[\p{Arabic}0-9\s]+$/u',
            ],
            'industry' => [
                'nullable',
                'string',
                'min:2',
                'max:100',
                'regex:/^[\p{Arabic}0-9\s\-–]+$/u',
            ],
            'company_description' => ['nullable', 'string', 'max:3000'],
            'avatar' => 'nullable|image|mimes:jpeg,png,jpg,webp|max:5120',
        ], [
            'user_name.regex' => 'الاسم يجب أن يحتوي على أحرف عربية فقط.',
            'city.regex' => 'اسم المدينة يجب أن يحتوي على أحرف عربية فقط.',
            'business_name.regex' => 'اسم الشركة يجب أن يحتوي على أحرف عربية وأرقام فقط.',
            'industry.regex' => 'المجال يجب أن يحتوي على أحرف عربية وأرقام فقط.',
            'email.regex' => 'صيغة البريد الإلكتروني غير صحيحة.',
            'phone_number.regex' => 'صيغة رقم الهاتف غير صحيحة.',
        ]);

        if ($request->hasFile('avatar')) {
            $avatarFile = $request->file('avatar');
            $ext = strtolower($avatarFile->getClientOriginalExtension());
            $fileName = "{$user->id}-" . now()->timestamp . ".{$ext}";
            $storagePath = "{$user->id}";

            try {
                $uploaded = Storage::disk('avatars')->putFileAs($storagePath, $avatarFile, $fileName);

                if (! $uploaded) {
                    throw new \RuntimeException('لم يتم تأكيد رفع الصورة إلى مخزن الصور.');
                }

                $filePath = "{$storagePath}/{$fileName}";
                $user->avatar_path = rtrim(env('SUPABASE_URL'), '/')
                    . '/storage/v1/object/public/avatars/'
                    . $filePath;
                $user->save();
            } catch (\Exception $e) {
                return back()->withErrors(['avatar' => 'فشل رفع الصورة الشخصية: ' . $e->getMessage()]);
            }
        }

        $cleanDescription = isset($validated['company_description'])
            ? trim(strip_tags((string) $validated['company_description']))
            : null;

        $user->update([
            'user_name' => $validated['user_name'],
            'email' => $validated['email'],
            'phone_number' => $validated['phone_number'] ?? null,
            'city' => $validated['city'] ?? null,
            'avatar_path' => $user->avatar_path,
        ]);

        if ($user->clientCompany) {
            $user->clientCompany()->update([
                'business_name' => $validated['business_name'] ?? $user->clientCompany->business_name,
                'industry' => $validated['industry'] ?? $user->clientCompany->industry,
                'company_description' => $cleanDescription ?? $user->clientCompany->company_description,
            ]);
        } else {
            $user->clientCompany()->create([
                'business_name' => $validated['business_name'] ?? $user->user_name,
                'industry' => $validated['industry'] ?? '',
                'company_description' => $cleanDescription ?? '',
            ]);
        }

        Cache::forget("user_client_company_{$user->id}");

        return redirect()->back()->with('success', 'تم تحديث الملف الشخصي للشركة بنجاح.');
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

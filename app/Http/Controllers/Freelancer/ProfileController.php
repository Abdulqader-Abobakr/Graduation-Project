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
        $freelancer = $user->freelancer()
            ->with(['portfolios' => function ($query) {
                $query->orderBy('created_at', 'desc');
            }])
            ->first();

        $avatarUrl = $user->avatar_path; // avatar_path now stores the full public URL

        $portfolios = $freelancer && $freelancer->portfolios
            ? $freelancer->portfolios->map(function ($portfolio) {
                return [
                    'id' => (string) $portfolio->id,
                    'title' => $portfolio->title,
                    'marketing_domain' => $portfolio->marketing_domain,
                    'images' => $portfolio->images ?? [],
                ];
            })->values()->all()
            : [];

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
                'job_title'              => $freelancer?->job_title ?? '',
                'bio'                    => $freelancer?->bio ?? '',
                'marketing_specialties'  => $freelancer?->marketing_specialties ?? [],
                'experienced_sectors'    => $freelancer?->experienced_sectors ?? [],
            ],
            'portfolios' => $portfolios,
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
                'max:70',
                'regex:/^[\x{0600}-\x{06FF}a-zA-Z\s\.\-\']+$/u',
            ],
            'email' => [
                'required',
                'email',
                'max:255',
                Rule::unique(
                    ($user->getConnectionName() ?: config('database.default')) . '.' . $user->getTable(),
                    'email'
                )->ignore($user->getKey(), $user->getKeyName()),
            ],
            'phone_number' => [
                'required',
                'string',
                'min:7',
                'max:20',
                'regex:/^(\+?[0-9\s\-()]{7,20})$/',
            ],
            'city' => [
                'required',
                'string',
                'min:2',
                'max:60',
                'regex:/^[\x{0600}-\x{06FF}a-zA-Z\s\-]+$/u',
            ],
            'job_title' => [
                'required',
                'string',
                'min:2',
                'max:100',
                'regex:/^[\x{0600}-\x{06FF}a-zA-Z0-9\s\.\,\-\/\&]+$/u',
            ],
            'bio' => [
                'nullable',
                'string',
                'max:1000',
            ],
            'marketing_specialties' => [
                'required',
                'array',
                'min:1',
            ],
            'marketing_specialties.*' => [
                'required',
                'string',
                'min:2',
                'max:50',
                'regex:/^[\x{0600}-\x{06FF}a-zA-Z0-9\s\.\,\-\/\&]+$/u',
            ],
            'experienced_sectors' => [
                'required',
                'array',
                'min:1',
            ],
            'experienced_sectors.*' => [
                'required',
                'string',
                'min:2',
                'max:50',
                'regex:/^[\x{0600}-\x{06FF}a-zA-Z0-9\s\.\,\-\/\&]+$/u',
            ],
            'avatar' => [
                'nullable',
                'image',
                'mimes:jpeg,png,jpg,webp',
                'max:5120',
            ],
        ], [
            'user_name.required' => 'حقل الاسم الكامل مطلوب ولا يمكن تركه فارغاً.',
            'user_name.min' => 'يجب ألا يقل الاسم عن حرفين.',
            'user_name.max' => 'يجب ألا يتجاوز الاسم 70 حرفاً.',
            'user_name.regex' => 'الاسم يجب أن يحتوي على حروف ومسافات فقط.',
            'email.required' => 'حقل البريد الإلكتروني مطلوب.',
            'email.email' => 'يرجى إدخال بريد إلكتروني صالح.',
            'email.unique' => 'البريد الإلكتروني مستخدم بالفعل.',
            'phone_number.required' => 'حقل رقم الهاتف مطلوب ولا يمكن تركه فارغاً.',
            'phone_number.min' => 'رقم الهاتف قصير جداً (7 أرقام على الأقل).',
            'phone_number.regex' => 'يرجى إدخال رقم هاتف صالح بالأرقام فقط.',
            'city.required' => 'حقل المدينة مطلوب ولا يمكن تركه فارغاً.',
            'city.min' => 'اسم المدينة قصير جداً.',
            'city.regex' => 'اسم المدينة يجب أن يحتوي على حروف فقط.',
            'job_title.required' => 'حقل المسمى الوظيفي مطلوب ولا يمكن تركه فارغاً.',
            'job_title.min' => 'يجب ألا يقل المسمى الوظيفي عن حرفين.',
            'job_title.regex' => 'المسمى الوظيفي يحتوي على رموز غير مسموح بها.',
            'bio.max' => 'النبذة التعريفية يجب ألا تتجاوز 1000 حرف.',
            'marketing_specialties.required' => 'يرجى إضافة مهارة أو خدمة واحدة على الأقل قبل الحفظ.',
            'marketing_specialties.min' => 'يرجى إضافة مهارة أو خدمة واحدة على الأقل قبل الحفظ.',
            'marketing_specialties.*.regex' => 'المهارة أو الخدمة تحتوي على رموز غير مسموح بها.',
            'experienced_sectors.required' => 'يرجى إضافة قطاع أو مجال خبرة واحد على الأقل قبل الحفظ.',
            'experienced_sectors.min' => 'يرجى إضافة قطاع أو مجال خبرة واحد على الأقل قبل الحفظ.',
            'experienced_sectors.*.regex' => 'اسم القطاع يحتوي على رموز غير مسموح بها.',
            'avatar.image' => 'يجب أن يكون الملف المرفق صورة صالحة.',
            'avatar.mimes' => 'صيغ الصور المسموح بها هي jpeg, png, jpg, webp.',
            'avatar.max' => 'الحد الأقصى لحجم الصورة هو 5 ميجابايت.',
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
            'user_name'    => trim($validated['user_name']),
            'email'        => trim($validated['email']),
            'phone_number' => trim($validated['phone_number']),
            'city'         => trim($validated['city']),
            'avatar_path'  => $user->avatar_path,
        ]);

        // Create the freelancer profile record if it doesn't exist yet
        $freelancer = $user->freelancer;
        if (! $freelancer) {
            $freelancer = $user->freelancer()->create();
        }

        $cleanBio = isset($validated['bio']) ? strip_tags(trim($validated['bio'])) : null;

        $cleanSpecialties = array_values(array_filter(array_map('trim', $validated['marketing_specialties'] ?? [])));
        $cleanSectors = array_values(array_filter(array_map('trim', $validated['experienced_sectors'] ?? [])));

        $freelancer->update([
            'job_title'             => trim($validated['job_title']),
            'bio'                   => $cleanBio,
            'marketing_specialties' => $cleanSpecialties,
            'experienced_sectors'   => $cleanSectors,
        ]);

        return redirect()->back()->with('success', 'تم حفظ وتحديث الملف الشخصي بنجاح.');
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

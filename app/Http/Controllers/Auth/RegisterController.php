<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\ClientCompany;
use App\Models\Freelancer;
use App\Models\User;
use App\Services\SupabaseService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Inertia\Inertia;

class RegisterController extends Controller
{
    protected SupabaseService $supabase;

    public function __construct(SupabaseService $supabase)
    {
        $this->supabase = $supabase;
    }

    public function create()
    {
        return Inertia::render('Auth/Register');
    }

    public function store(Request $request)
    {
        // Normalize phone number (strip whitespace, dashes, +967, 00967, 967)
        $rawPhone = (string) $request->input('phone');
        $cleanPhone = preg_replace('/[^\d]/', '', $rawPhone);
        if (str_starts_with($cleanPhone, '00967')) {
            $cleanPhone = substr($cleanPhone, 5);
        } elseif (str_starts_with($cleanPhone, '967')) {
            $cleanPhone = substr($cleanPhone, 3);
        }
        $request->merge(['phone' => $cleanPhone]);

        // Normalize sector if custom was selected
        if (in_array($request->input('sector'), ['custom', 'اكتب يدويًا'], true) && $request->filled('customSector')) {
            $request->merge(['sector' => trim((string) $request->input('customSector'))]);
        }

        // Fast-fail if email already exists in local DB
        $email = strtolower(trim((string) $request->input('email')));
        if (User::whereRaw('LOWER(email) = ?', [$email])->exists()) {
            return back()->withErrors([
                'email' => 'البريد الإلكتروني مسجل بالفعل لدينا. يرجى تسجيل الدخول أو استعادة كلمة المرور.',
            ])->withInput();
        }

        $validated = $request->validate([
            'role' => 'required|in:freelancer,company',
            'name' => [
                'required_if:role,freelancer',
                'nullable',
                'string',
                'min:2',
                'max:60',
                'regex:/^[\p{Arabic}\s]+$/u',
            ],
            'companyName' => [
                'required_if:role,company',
                'nullable',
                'string',
                'min:2',
                'max:100',
                'regex:/^[\p{Arabic}0-9\s]+$/u',
            ],
            'email' => [
                'required',
                'string',
                'email',
                'max:255',
                'regex:/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/',
            ],
            'phone' => [
                'required',
                'string',
                'regex:/^7\d{8}$/',
            ],
            'city' => [
                'required',
                'string',
                'min:2',
                'max:50',
                'regex:/^[\p{Arabic}\s]+$/u',
            ],
            'sector' => [
                'required',
                'string',
                'min:2',
                'max:100',
                'regex:/^[\p{Arabic}0-9\s\-–]+$/u',
            ],
            'idDocument' => 'required|file|mimes:jpg,jpeg,png,webp,pdf|max:10240',
            'password' => [
                'required',
                'string',
                'min:8',
                'max:100',
                'confirmed',
                'regex:/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};\':"\\\\|,.<>\/?]).{8,}$/',
            ],
        ], [
            'role.required' => 'نوع الحساب مطلوب.',
            'role.in' => 'نوع الحساب المحدد غير صالح.',
            'name.required_if' => 'اسم الخبير مطلوب.',
            'name.min' => 'الاسم يجب أن يتكون من حرفين على الأقل.',
            'name.max' => 'الاسم طويل جداً.',
            'name.regex' => 'الاسم يجب أن يحتوي على أحرف عربية فقط.',
            'companyName.required_if' => 'اسم رائد الأعمال أو المشروع/الشركة مطلوب.',
            'companyName.min' => 'الاسم يجب أن يتكون من حرفين على الأقل.',
            'companyName.max' => 'الاسم طويل جداً.',
            'companyName.regex' => 'الاسم يجب أن يحتوي على أحرف عربية وأرقام فقط.',
            'email.required' => 'البريد الإلكتروني مطلوب.',
            'email.email' => 'البريد الإلكتروني غير صحيح.',
            'email.regex' => 'صيغة البريد الإلكتروني غير صحيحة.',
            'phone.required' => 'رقم الهاتف مطلوب.',
            'phone.regex' => 'رقم الهاتف يجب أن يبدأ بـ 7 ويتكون من 9 أرقام (مثال: 771234567).',
            'city.required' => 'المدينة مطلوبة.',
            'city.min' => 'اسم المدينة يجب أن يتكون من حرفين على الأقل.',
            'city.regex' => 'اسم المدينة يجب أن يحتوي على أحرف عربية فقط.',
            'sector.required' => 'المجال / القطاع مطلوب.',
            'sector.min' => 'المجال يجب أن يتكون من حرفين على الأقل.',
            'sector.regex' => 'المجال يجب أن يحتوي على أحرف عربية فقط.',
            'idDocument.required' => 'وثيقة إثبات الهوية / السجل التجاري أو البطاقة الشخصية مطلوبة.',
            'idDocument.uploaded' => 'حجم الملف يتجاوز الحد المسموح به في السيرفر، أو حدث خطأ أثناء الرفع.',
            'idDocument.max' => 'يجب ألا يتجاوز حجم الملف 10 ميجابايت.',
            'idDocument.mimes' => 'يجب أن يكون الملف بصيغة: jpg, jpeg, png, webp, pdf.',
            'password.required' => 'كلمة المرور مطلوبة.',
            'password.min' => 'يجب ألا تقل كلمة المرور عن 8 خانات.',
            'password.regex' => 'كلمة المرور يجب أن تتضمن أحرفاً كبيرة وصغيرة وأرقاماً ورموزاً خاصة (!@#$...).',
            'password.confirmed' => 'تأكيد كلمة المرور غير متطابق.',
        ]);

        $userName = $validated['name'] ?? $validated['companyName'];
        $databaseRole = $validated['role'] === 'company'
            ? 'client_company'
            : $validated['role'];

        // 1. Create user in Supabase Auth (auth.users)
        $response = $this->supabase->signUp(
            $validated['email'],
            $validated['password'],
            ['role' => $databaseRole, 'user_name' => $userName]
        );

        if (isset($response['error']) || isset($response['error_code']) || empty($response['user']['id'])) {
            return back()->withErrors([
                'email' => $response['error_description'] ?? $response['msg'] ?? 'تعذر إنشاء الحساب.',
            ])->withInput();
        }

        $userId = $response['user']['id'];
        $document = $validated['idDocument'];
        $documentName = Str::uuid() . '.' . $document->getClientOriginalExtension();
        $documentPath = $documentName;

        try {
            $uploaded = Storage::disk('verification-docs')->putFileAs(
                '',
                $document,
                $documentName
            );

            if (! $uploaded) {
                throw new \RuntimeException('Identity document upload failed.');
            }
        } catch (\Throwable $exception) {
            return back()->withErrors([
                'idDocument' => 'تعذر رفع الوثيقة. يرجى المحاولة مرة أخرى.',
            ])->withInput();
        }

        DB::transaction(function () use ($validated, $userId, $userName, $documentPath, $databaseRole) {
            $user = User::updateOrCreate(
                ['id' => $userId],
                [
                    'user_name' => $userName,
                    'email' => $validated['email'],
                    'password' => \Illuminate\Support\Facades\Hash::make($validated['password']),
                    'role' => $databaseRole,
                    'phone_number' => $validated['phone'],
                    'city' => $validated['city'],
                    'id_document_path' => $documentPath,
                ]
            );

            if ($validated['role'] === 'freelancer') {
                Freelancer::firstOrCreate(
                    ['user_id' => $user->id],
                    ['marketing_specialties' => [$validated['sector']]]
                );
            } else {
                ClientCompany::updateOrCreate(
                    ['user_id' => $user->id],
                    [
                        'business_name' => $userName,
                        'industry' => $validated['sector'],
                        'commercial_register_path' => $documentPath,
                    ]
                );
            }
        });

        return redirect('/login');
    }
}

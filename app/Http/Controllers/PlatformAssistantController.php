<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\Log;

class PlatformAssistantController extends Controller
{
    public function ask(Request $request)
    {
        $request->validate([
            'message' => 'required|string|max:1000',
            'history' => 'nullable|array',
        ]);

        $user = $request->user();
        $userMessage = trim($request->input('message'));
        $chatHistory = $request->input('history', []);
        $role = $user ? ($user->role ?? '') : '';

        // 1. قراءة الدليل الهيكلي للمنصة
        $guidePath = resource_path('markdown/sila_guide.md');
        $guideContent = File::exists($guidePath) ? File::get($guidePath) : '';

        // 2. تزويد الذكاء الاصطناعي ببيانات المستخدم الحالي لتخصيص الإجابة
        $roleName = ($user && ($user->role === 'client_company' || $user->role === 'company'))
            ? 'شركة / صاحب مشروع'
            : 'مستقل / مسوق';
        $verifiedName = ($user && $user->account_state === 'verified') ? 'موثق' : 'غير موثق';

        $userContext = "بيانات المستخدم الحالي:\n"
            . "- الاسم: " . ($user->user_name ?? 'مستخدم') . "\n"
            . "- الدور: " . $roleName . "\n"
            . "- حالة التوثيق: " . $verifiedName . "\n\n"
            . "تعليمات صارمة للرد:\n"
            . "1. ابدأ إجابتك فوراً بذكر اسم الواجهة المحددة في القائمة الجانبية (مثال: 'اذهب إلى واجهة **العروض والطلبات** من القائمة الجانبية...').\n"
            . "2. قدّم الخطوات العملية المتبقية على شكل نقاط مرقمة وواضحة (1، 2، 3...).\n"
            . "3. التزم تماماً بدور المستخدم الحالي ولا تذكر واجهات الدور الآخر.\n\n";

        $systemInstruction = $guideContent . "\n\n" . $userContext;

        // 3. تجهيز تاريخ المحادثة بشكل يتوافق بدقة مع شروط Gemini API
        $contents = [];
        $lastRole = null;

        foreach ($chatHistory as $msg) {
            $text = trim($msg['text'] ?? '');
            if (empty($text)) continue;

            $msgRole = ($msg['sender'] === 'user') ? 'user' : 'model';

            // الشرط 1: محادثة Gemini يجب أن تبدأ دائماً بـ user
            if (empty($contents) && $msgRole !== 'user') {
                continue; // تجاهل أي ترحيب افتراضي من الموديل في البداية
            }

            // الشرط 2: عدم تكرار نفس الـ role مرتين متتاليتين
            if ($msgRole === $lastRole) {
                $lastIndex = count($contents) - 1;
                $contents[$lastIndex]['parts'][0]['text'] .= "\n" . $text;
                continue;
            }

            $contents[] = [
                'role' => $msgRole,
                'parts' => [['text' => $text]]
            ];
            $lastRole = $msgRole;
        }

        // إضافة رسالة المستخدم الحالية
        if ($lastRole === 'user' && !empty($contents)) {
            $lastIndex = count($contents) - 1;
            $contents[$lastIndex]['parts'][0]['text'] .= "\n" . $userMessage;
        } else {
            $contents[] = [
                'role' => 'user',
                'parts' => [['text' => $userMessage]]
            ];
        }

        // 4. قراءة مفتاح الـ API
        $apiKey = config('services.gemini.key') ?: env('GEMINI_API_KEY');

        // إذا كان المفتاح متوفراً، نحاول الاتصال بـ Gemini
        if (!empty($apiKey)) {
            $modelsToTry = array_unique(array_filter([
                config('services.gemini.model'),
                'gemini-2.5-flash',
                'gemini-2.0-flash',
                'gemini-1.5-flash',
                'gemini-1.5-flash-8b',
            ]));

            $payload = [
                'system_instruction' => [
                    'parts' => [['text' => $systemInstruction]]
                ],
                'contents' => $contents,
                'generationConfig' => [
                    'temperature' => 0.2,
                    'maxOutputTokens' => 700,
                ],
            ];

            foreach ($modelsToTry as $model) {
                $endpoint = "https://generativelanguage.googleapis.com/v1beta/models/{$model}:generateContent?key={$apiKey}";
                try {
                    $response = Http::timeout(15)->post($endpoint, $payload);

                    if ($response->successful()) {
                        $data = $response->json();
                        $reply = $data['candidates'][0]['content']['parts'][0]['text'] ?? null;

                        if ($reply) {
                            return response()->json([
                                'success' => true,
                                'reply' => $reply
                            ]);
                        }
                    }

                    $errorBody = $response->json();
                    $lastErrorMessage = $errorBody['error']['message'] ?? $response->body();
                    Log::warning("PlatformAssistant: Model [{$model}] failed (HTTP {$response->status()}): {$lastErrorMessage}");
                } catch (\Exception $e) {
                    Log::error("PlatformAssistant exception with model [{$model}]: " . $e->getMessage());
                }
            }
        }

        // 5. في حال عدم وجود مفتاح أو تعذر الاتصال بـ Gemini، نستخدم الدليل المباشر الذكي كبديل فوري مضمون
        $fallbackReply = $this->getFallbackReply($userMessage, $role);

        return response()->json([
            'success' => true,
            'reply' => $fallbackReply
        ]);
    }

    /**
     * إجابة فورية ذكية مستخرجة مباشرة من دليل منصة صلة
     */
    protected function getFallbackReply(string $query, string $role): string
    {
        $q = mb_strtolower(trim($query));
        $isCompany = ($role === 'client_company' || $role === 'company');

        if (str_contains($q, 'طرح') || str_contains($q, 'مشروع جديد') || str_contains($q, 'طلب جديد') || str_contains($q, 'انشاء طلب') || str_contains($q, 'إنشاء طلب')) {
            return "اذهب إلى واجهة **طلباتي** (`/company/requests`) من القائمة الجانبية:\n1. اضغط على زر **'طلب جديد'** في أعلى الواجهة.\n2. املأ عنوان الطلب، نوع الخدمة المطلوبة، الميزانية المتوقعة، والوصف الدقيق.\n3. اضغط على **'حفظ ونشر'** وسيظهر طلبك فوراً للخبراء لتقديم عروضهم.\n(ملاحظة: يمكنك تعديل أو حذف الطلب طالما لم يستلم أي عرض سعر بعد).";
        }

        if (str_contains($q, 'ضمان') || str_contains($q, 'حجز') || str_contains($q, 'دفع') || str_contains($q, 'تحويل') || str_contains($q, 'إيصال') || str_contains($q, 'ايصال')) {
            return "بخصوص الضمان المالي وإيداع الميزانية:\n1. فور قبولك لعرض الخبير المناسب، ينقلك النظام تلقائياً لصفحة الدفع (`/company/projects/.../pay`).\n2. قم بالتحويل البنكي ثم ارفع إيصال التحويل (حتى 50MB بصيغة PDF أو صورة).\n3. بعد توثيق المشرف للإيصال، يتفعل المشروع ويُحجز المبلغ في **'الرصيد المعلق'** لمحفظة الخبير كضمان آمن ومقفل، ولا يتحرر لرصيده المتاح إلا بعد موافقتك النهائية واكتمال المشروع 100%.";
        }

        if (str_contains($q, 'تسليم') || str_contains($q, 'مراجعة') || str_contains($q, 'تعديل') || str_contains($q, 'متابعة')) {
            if ($isCompany) {
                return "اذهب إلى واجهة **مشاريعي** (`/company/projects`) من القائمة الجانبية:\n1. اضغط على المشروع النشط للدخول إلى **'مساحة العمل' (Workspace)**.\n2. استعرض تسليمات المراحل المرفوعة وعاين الملفات أو حمّلها مباشرة.\n3. اضغط **'اعتماد التسليم'** (وعند اعتماد آخر تسليم يكتمل المشروع بنسبة 100% ويتحرر المبلغ فوراً لرصيد الخبير المتاح)، أو اضغط **'طلب تعديل'** لإرسال ملاحظاتك؛ حيث ينقص عداد التعديلات المتبقية بمقدار (1) حتى يصل للصفر.";
            } else {
                return "اذهب إلى واجهة **مشاريعي** (`/freelancer/projects`) من القائمة الجانبية:\n1. اضغط على المشروع النشط للدخول إلى **'مساحة العمل' (Workspace)**.\n2. في المرحلة الحالية، اضغط على **'رفع تسليم'**.\n3. أرفق ملفات التسليم (حتى 50MB) وروابط العمل واكتب تقرير المرحلة واضغط **'إرسال التسليم'** لمراجعة رائد الأعمال.";
            }
        }

        if (str_contains($q, 'عرض') || str_contains($q, 'تقديم') || str_contains($q, 'عروض')) {
            if ($isCompany) {
                return "اذهب إلى واجهة **طلباتي** (`/company/requests`) من القائمة الجانبية:\n1. اضغط على عنوان الطلب لمشاهدة جميع العروض المستلمة من الخبراء.\n2. ستظهر تفاصيل العرض: السعر الإجمالي، المدة، سقف التعديلات، والمراحل.\n3. يمكنك الضغط على **'بدء محادثة'** للتفاوض، أو **'قبول العرض'** للانتقال لصفحة الضمان، أو **'رفض العرض'**.";
            } else {
                return "اذهب إلى واجهة **العروض والطلبات** (`/freelancer/proposals`) من القائمة الجانبية:\n1. استعرض المشاريع المتاحة التي تناسب تخصصك واضغط **'تقديم عرض'**.\n2. حدد السعر الإجمالي، المدة بالأيام، سقف التعديلات، وقسّم العمل لمراحل مرتبة (Milestones) بنسبة إجمالية 100%.\n3. اضغط **'إرسال العرض'** ليصل فوراً إلى رائد الأعمال.";
            }
        }

        if (str_contains($q, 'نزاع') || str_contains($q, 'خلاف') || str_contains($q, 'مشكلة') || str_contains($q, 'شكوى')) {
            return "محرك فض النزاعات الثلاثي المبني على الأدلة بالمنصة:\n1. عند نشوء خلاف، يفحص مشرف المنصة المستقل سجل الطلب والمحادثات والتسليمات المرفوعة.\n2. يصدر حكماً ملزماً وفق الحالة:\n- **استرداد 100% لرائد الأعمال:** في حال إخلال الخبير بالمواصفات أو عدم التسليم.\n- **صرف 100% للخبير:** عند التزامه الكامل بالمواصفات ورفض رائد الأعمال غير المبرر للاعتماد.\n- **تسوية منصفة 50% لكل طرف:** في حالات المسؤولية المشتركة أو الإنجاز الجزئي المنتفع به.";
        }

        if (str_contains($q, 'سحب') || str_contains($q, 'أرباح') || str_contains($q, 'معلق') || str_contains($q, 'متاح') || str_contains($q, 'محفظة')) {
            return "بخصوص الأرباح وسحب الرصيد:\n1. يُحجز كامل مبلغ المشروع في **'الرصيد المعلق'** عند بدء العمل كضمان لحقوقك.\n2. فور اعتماد رائد الأعمال للتسليم النهائي واكتمال المشروع 100%، ينتقل المبلغ تلقائياً وفوراً إلى **'الرصيد المتاح'**.\n3. لسحب رصيدك: اذهب إلى واجهة **الأرباح** (`/freelancer/earnings`) من القائمة الجانبية، واضغط **'طلب سحب رصيد'** واختر وسيلة السحب المفضلة:\n- تحويل بنكي محلي (Bank Transfer).\n- محفظة 'جيب' الإلكترونية (Jeeb Wallet).\n- حوالات مالية محلية (Local Remittance).";
        }

        if (str_contains($q, 'توثيق') || str_contains($q, 'سجل') || str_contains($q, 'هوية') || str_contains($q, 'بطاقة') || str_contains($q, 'جواز')) {
            return "لتوثيق الحساب والحصول على شارة موثق:\n1. اذهب إلى **الملف التعريفي** أو **الإعدادات** من القائمة الجانبية.\n2. ارفع صورة الهوية الوطنية/جواز السفر (للخبراء) أو السجل التجاري (للشركات) بحجم حتى 10MB.\n3. تُحفظ الوثائق في حاوية سحابية معزولة ومحمية ويراجعها المشرف لاعتماد التوثيق.";
        }

        if (str_contains($q, 'معرض') || str_contains($q, 'أعمال') || str_contains($q, 'خدمات')) {
            return "اذهب إلى واجهة **خدماتي** (`/freelancer/services`) من القائمة الجانبية:\n1. حدد مجالات تخصصك الدقيقة من بين الـ 16 تخصصاً المعتمدة.\n2. اضغط على **'إضافة عمل إلى المعرض'** لرفع نماذج وصور أعمالك السابقة مع الوصف والروابط.\n3. يساعدك ذلك في جذب العملاء وقبول عروضك بسرعة.";
        }

        if (str_contains($q, 'استكشف') || str_contains($q, 'مستقل') || str_contains($q, 'خبير')) {
            return "اذهب إلى واجهة **استكشف** (`/company/explore`) من القائمة الجانبية:\n1. استعرض تخصصات التسويق والبرمجة والتصميم.\n2. استخدم شريط البحث والفلترة لتصفح ملفات الخبراء وتقييماتهم ومعارض أعمالهم.\n3. يمكنك بدء محادثة مباشرة أو دعوة الخبير لتقديم عرض على مشروعك.";
        }

        if ($isCompany) {
            return "أهلاً بك! يمكنك إدارة مشاريعك في منصة صِلة بسهولة:\n1. **طرح طلبات:** من واجهة **طلباتي** (`/company/requests`).\n2. **استكشاف الخبراء:** من واجهة **استكشف** (`/company/explore`).\n3. **متابعة التنفيذ والتسليمات:** من واجهة **مشاريعي** (`/company/projects`).\n4. **المحادثات:** من واجهة **المحادثات** (`/company/chat`).\n\nتفضل بطرح أي سؤال تود إرشادك فيه!";
        }

        return "أهلاً بك! يمكنك كخبير في منصة صِلة تحقيق أقصى استفادة:\n1. **تقديم العروض:** من واجهة **العروض والطلبات** (`/freelancer/proposals`).\n2. **تنفيذ المشاريع ورفع التسليمات:** من واجهة **مشاريعي** (`/freelancer/projects`).\n3. **إدارة معرض الأعمال:** من واجهة **خدماتي** (`/freelancer/services`).\n4. **متابعة الأرباح والسحب:** من واجهة **الأرباح** (`/freelancer/earnings`).\n\nتفضل بطرح أي سؤال تود إرشادك فيه!";
    }
}

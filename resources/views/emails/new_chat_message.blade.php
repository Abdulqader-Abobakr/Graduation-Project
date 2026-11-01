<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>رسالة جديدة على منصة صِلة</title>
    <style>
        body {
            margin: 0;
            padding: 0;
            background-color: #f8fafc;
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            color: #1e293b;
            direction: rtl;
            text-align: right;
            -webkit-font-smoothing: antialiased;
        }
        .wrapper {
            width: 100%;
            background-color: #f8fafc;
            padding: 40px 15px;
        }
        .container {
            max-width: 560px;
            margin: 0 auto;
            background-color: #ffffff;
            border-radius: 16px;
            overflow: hidden;
            border: 1px solid #e2e8f0;
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
        }
        .header {
            background: linear-gradient(135deg, #1f6fd4 0%, #2a7de1 100%);
            padding: 26px 24px;
            text-align: center;
            color: #ffffff;
        }
        .header h1 {
            margin: 0;
            font-size: 22px;
            font-weight: 800;
        }
        .header p {
            margin: 4px 0 0 0;
            font-size: 13px;
            color: #e0f2fe;
            opacity: 0.9;
        }
        .content {
            padding: 30px 24px;
        }
        .greeting {
            font-size: 17px;
            font-weight: bold;
            color: #0f172a;
            margin-bottom: 12px;
        }
        .lead-text {
            font-size: 14px;
            line-height: 1.8;
            color: #475569;
            margin-bottom: 20px;
        }
        .info-card {
            background-color: #f8fafc;
            border: 1px solid #e2e8f0;
            border-radius: 12px;
            padding: 18px;
            margin-bottom: 24px;
        }
        .info-item {
            font-size: 13px;
            color: #334155;
            line-height: 1.7;
        }
        .footer {
            background-color: #f1f5f9;
            padding: 18px 24px;
            text-align: center;
            font-size: 12px;
            color: #64748b;
            border-top: 1px solid #e2e8f0;
            line-height: 1.6;
        }
    </style>
</head>
<body>
    <div class="wrapper">
        <div class="container">
            <div class="header">
                <h1>منصة صِلة | SILA</h1>
                <p>إشعار محادثة جديدة</p>
            </div>

            <div class="content">
                <div class="greeting">مرحباً بك، {{ $recipientName }} 👋</div>
                <p class="lead-text">
                    نود إعلامك بأن لديك رسالة جديدة واردة من <strong>{{ $senderName }}</strong> بخصوص: <em>{{ $subjectTitle }}</em>.
                </p>

                <div class="info-card">
                    <div class="info-item">
                        💬 <strong>تنبيه:</strong> يرجى تسجيل الدخول إلى منصة صِلة وتفقد قسم <strong>المحادثات</strong> للاطلاع على الرسالة ومتابعة التواصل مع الطرف الآخر.
                    </div>
                </div>
            </div>

            <div class="footer">
                <p style="margin: 0 0 6px 0;">
                    تم إرسال هذا الإشعار تلقائياً وفقاً لتفضيلات الإشعارات المحددة في حسابك.
                </p>
                <p style="margin: 0; font-size: 11px; color: #94a3b8;">
                    جميع الحقوق محفوظة © {{ date('Y') }} منصة صِلة لربط الخبراء برواد الأعمال.
                </p>
            </div>
        </div>
    </div>
</body>
</html>

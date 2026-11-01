<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>طلب خدمة جديد على منصة صِلة</title>
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
        .details-card {
            background-color: #f8fafc;
            border: 1px solid #e2e8f0;
            border-radius: 12px;
            padding: 18px;
            margin-bottom: 24px;
        }
        .detail-row {
            margin-bottom: 12px;
        }
        .detail-row:last-child {
            margin-bottom: 0;
        }
        .detail-label {
            font-size: 12px;
            font-weight: bold;
            color: #64748b;
            display: block;
            margin-bottom: 3px;
        }
        .detail-value {
            font-size: 14px;
            font-weight: 600;
            color: #1e293b;
        }
        .badge {
            display: inline-block;
            background-color: #eff6ff;
            color: #2563eb;
            font-size: 12px;
            font-weight: bold;
            padding: 3px 10px;
            border-radius: 6px;
            border: 1px solid #bfdbfe;
        }
        .info-box {
            background-color: #f0fdf4;
            border: 1px solid #bbf7d0;
            border-radius: 10px;
            padding: 14px 16px;
            font-size: 13px;
            color: #166534;
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
                <p>إشعار طلب خدمة مباشر جديد</p>
            </div>

            <div class="content">
                <div class="greeting">مرحباً بك، {{ $freelancerName }} 👋</div>
                <p class="lead-text">
                    نود إعلامك بأن العميل <strong>{{ $clientName }}</strong> قد أرسل إليك طلب خدمة مباشر جديد وموجهاً لخبرتك عبر منصة صِلة.
                </p>

                <div class="details-card">
                    <div class="detail-row">
                        <span class="detail-label">عنوان الطلب</span>
                        <div class="detail-value" style="font-size: 15px; color: #0f172a;">{{ $briefTitle }}</div>
                    </div>

                    <div class="detail-row">
                        <span class="detail-label">تصنيف الخدمة</span>
                        <span class="badge">{{ $category }}</span>
                    </div>
                </div>

                <div class="info-box">
                    📋 <strong>تنبيه:</strong> يرجى تسجيل الدخول إلى حسابك في منصة صِلة وتفقد صفحة <strong>الطلبات والعروض</strong> للاطلاع على كافة التفاصيل والمتطلبات والبدء في تقديم عرضك.
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

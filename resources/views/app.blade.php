<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta name="csrf-token" content="{{ csrf_token() }}">
     <link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;500;600;700;800&display=swap" rel="stylesheet">
    @viteReactRefresh
    @vite(['resources/css/app.css', 'resources/js/app.jsx'])
    @inertiaHead
</head>
<body class="antialiased">
    @inertia

    

    <style>
        @keyframes silaPulse {
            0% {
                box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.7);
            }
            70% {
                box-shadow: 0 0 0 8px rgba(16, 185, 129, 0);
            }
            100% {
                box-shadow: 0 0 0 0 rgba(16, 185, 129, 0);
            }
        }
        #sila-chatbot-container:hover #sila-chatbot-tooltip {
            opacity: 1 !important;
            transform: translateY(0) !important;
        }
    </style>

    <!-- Botpress Webchat Scripts -->
    <script src="https://cdn.botpress.cloud/webchat/v5.0/inject.js"></script>
    <script src="https://files.bpcontent.cloud/2026/09/10/15/20260910152638-XUU306JQ.js" defer></script>

    <script>
        function toggleSilaChatbot() {
            if (window.botpress && typeof window.botpress.toggle === 'function') {
                window.botpress.toggle();
            } else if (window.botpress && typeof window.botpress.open === 'function') {
                window.botpress.open();
            } else {
                var attempts = 0;
                var interval = setInterval(function() {
                    attempts++;
                    if (window.botpress && (window.botpress.toggle || window.botpress.open)) {
                        clearInterval(interval);
                        if (typeof window.botpress.toggle === 'function') {
                            window.botpress.toggle();
                        } else {
                            window.botpress.open();
                        }
                    } else if (attempts > 30) {
                        clearInterval(interval);
                    }
                }, 100);
            }
        }
    </script>
</body>
</html>
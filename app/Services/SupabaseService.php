<?php

namespace App\Services;

use Illuminate\Http\Client\ConnectionException;
use Illuminate\Http\Client\PendingRequest;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class SupabaseService
{
    protected string $url;
    protected string $key;

    public function __construct()
    {
        $this->url = rtrim((string) config('services.supabase.url'), '/');
        $this->key = (string) config('services.supabase.key');
    }

    /**
     * Build a resilient HTTP client configured for IPv4 DNS resolution and retries.
     */
    protected function client(array $extraHeaders = []): PendingRequest
    {
        $curlOptions = [
            CURLOPT_DNS_CACHE_TIMEOUT => 300,
        ];

        if (defined('CURLOPT_IPRESOLVE') && defined('CURL_IPRESOLVE_V4')) {
            $curlOptions[CURLOPT_IPRESOLVE] = CURL_IPRESOLVE_V4;
        }

        return Http::connectTimeout(15)
            ->timeout(25)
            ->withOptions([
                'curl' => $curlOptions,
            ])
            ->retry(2, 400, function (\Exception $exception) {
                return $exception instanceof ConnectionException;
            }, throw: false)
            ->withHeaders(array_merge([
                'apikey' => $this->key,
                'Content-Type' => 'application/json',
            ], $extraHeaders));
    }

    /**
     * Standardized fallback payload when Supabase HTTP endpoint cannot be reached.
     */
    protected function connectionErrorResponse(string $operation, \Throwable $e): array
    {
        Log::warning("Supabase {$operation} connection failed", [
            'message' => $e->getMessage(),
        ]);

        $msg = 'تعذر الاتصال بخادم المصادقة بسبب بطء أو انقطاع الإنترنت. يرجى المحاولة مرة أخرى.';

        return [
            'error' => 'connection_timeout',
            'error_code' => 'connection_timeout',
            'error_description' => $msg,
            'msg' => $msg,
        ];
    }

    public function signUp(string $email, string $password, array $profileData)
    {
        try {
            return $this->client()->post("{$this->url}/auth/v1/signup", [
                'email' => $email,
                'password' => $password,
                'data' => $profileData,
            ])->json() ?? [];
        } catch (\Throwable $e) {
            return $this->connectionErrorResponse('signUp', $e);
        }
    }

    public function signIn(string $email, string $password)
    {
        try {
            return $this->client()->post("{$this->url}/auth/v1/token?grant_type=password", [
                'email' => $email,
                'password' => $password,
            ])->json() ?? [];
        } catch (\Throwable $e) {
            return $this->connectionErrorResponse('signIn', $e);
        }
    }

    public function updateUserPassword(string $accessToken, string $newPassword)
    {
        try {
            return $this->client([
                'Authorization' => "Bearer {$accessToken}",
            ])->put("{$this->url}/auth/v1/user", [
                'password' => $newPassword,
            ])->json() ?? [];
        } catch (\Throwable $e) {
            return $this->connectionErrorResponse('updateUserPassword', $e);
        }
    }

    public function sendPasswordResetEmail(string $email, ?string $redirectTo = null)
    {
        $payload = ['email' => $email];
        $url = "{$this->url}/auth/v1/recover";
        if ($redirectTo) {
            $url .= '?redirect_to=' . urlencode($redirectTo);
        }

        try {
            return $this->client()->post($url, $payload)->json() ?? [];
        } catch (\Throwable $e) {
            return $this->connectionErrorResponse('sendPasswordResetEmail', $e);
        }
    }
}

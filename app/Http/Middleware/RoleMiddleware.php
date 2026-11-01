<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class RoleMiddleware
{
    /**
     * Handle an incoming request.
     *
     * @param  Closure(Request): (Response)  $next
     */
    public function handle(Request $request, Closure $next, string $role): Response
    {
        if (! $request->user()) {
            return redirect()->guest(route('login'));
        }

        $userRole = $request->user()->role;
        $requiredRole = ($role === 'company' || $role === 'client_company') ? 'client_company' : $role;

        if ($userRole !== $requiredRole) {
            if ($userRole === 'freelancer') {
                return redirect()->route('freelancer.dashboard')->with('error', 'تم تحويلك إلى لوحة تحكم المستقل الخاصة بحسابك.');
            }
            if ($userRole === 'client_company' || $userRole === 'company') {
                return redirect()->route('company.dashboard')->with('error', 'تم تحويلك إلى لوحة تحكم ريادي الأعمال الخاصة بحسابك.');
            }

            abort(403, 'غير مصرح لك بالوصول إلى هذه الصفحة.');
        }

        return $next($request);
    }
}

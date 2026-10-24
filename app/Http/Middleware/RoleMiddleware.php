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
        $requiredRole = $role === 'company' ? 'client_company' : $role;

        abort_unless($request->user() && $request->user()->role === $requiredRole, 403);

        return $next($request);
    }
}

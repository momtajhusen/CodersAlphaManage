<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Symfony\Component\HttpFoundation\Response;

class LogRequestMetrics
{
    public function handle(Request $request, Closure $next): Response
    {
        $start = microtime(true);
        /** @var \Symfony\Component\HttpFoundation\Response $response */
        $response = $next($request);
        $durationMs = (microtime(true) - $start) * 1000;

        $size = strlen($response->getContent());
        Log::info('API Request', [
            'method' => $request->method(),
            'path' => $request->path(),
            'status' => $response->getStatusCode(),
            'duration_ms' => round($durationMs, 2),
            'response_bytes' => $size,
            'user_id' => optional($request->user())->id,
        ]);

        return $response;
    }
}

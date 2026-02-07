<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class CompressResponse
{
    public function handle(Request $request, Closure $next): Response
    {
        /** @var \Symfony\Component\HttpFoundation\Response $response */
        $response = $next($request);

        $path = $request->path();
        if (str_contains($path, 'attendance')) {
            return $response;
        }

        $acceptsGzip = str_contains($request->header('Accept-Encoding', ''), 'gzip');
        $alreadyEncoded = $response->headers->get('Content-Encoding');
        $contentType = $response->headers->get('Content-Type', '');
        $isCompressible = str_contains($contentType, 'application/json') || str_contains($contentType, 'text/');
        $size = strlen($response->getContent());

        if ($acceptsGzip && !$alreadyEncoded && $isCompressible && $size > 1024) {
            $compressed = gzencode($response->getContent(), 6);
            $response->setContent($compressed);
            $response->headers->set('Content-Encoding', 'gzip');
            $response->headers->set('Vary', 'Accept-Encoding');
            $response->headers->set('Content-Length', strlen($compressed));
        }

        return $response;
    }
}

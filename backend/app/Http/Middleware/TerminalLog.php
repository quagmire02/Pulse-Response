<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Symfony\Component\HttpFoundation\Response;

class TerminalLog
{
       public function handle(Request $request, Closure $next): Response
    {
        $response = $next($request);

        Log::info('Server Response', [
            'method' => $request->method(),
            'url' => $request->fullUrl(),
            'status' => $response->getStatusCode(),
        ]);

        return $response;
    }

        public function terminate(Request $request, Response $response)
    {
        Log::info('Server Response', [
            'method' => $request->method(),
            'url' => $request->fullUrl(),
            'status' => $response->getStatusCode(),
        ]);
    }
}

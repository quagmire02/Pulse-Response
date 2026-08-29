<?php

namespace App\Http\Controllers\Misc;

use App\Http\Controllers\Controller;
use App\Services\ChatbotService;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Log;

class ChatbotController extends Controller
{
    public function __construct(private ChatbotService $chatbot)
    {
        $this->middleware('auth:sanctum');
    }

    public function message(Request $request): JsonResponse
    {
        try {
            $validated = $request->validate([
                'message' => ['required', 'string', 'max:1000'],
            ]);

            return response()->json($this->chatbot->handle($validated['message']), 200);
        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json(['errors' => $e->errors()], 422);
        } catch (\Exception $e) {
            Log::error($e->getMessage());
            return response()->json(['errors' => 'The assistant is unavailable right now.'], 500);
        }
    }
}

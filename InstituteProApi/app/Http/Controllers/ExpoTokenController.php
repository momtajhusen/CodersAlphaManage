<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use YieldStudio\LaravelExpoNotifier\Models\ExpoToken;

class ExpoTokenController extends Controller
{
    public function status(Request $request)
    {
        /** @var \App\Models\User $user */
        $user = Auth::user();
        $tokens = $user->expoTokens()->pluck('value')->all();

        return response()->json([
            'success' => true,
            'data' => [
                'has_token' => count($tokens) > 0,
                'tokens' => $tokens,
            ],
        ]);
    }

    public function store(Request $request)
    {
        $request->validate([
            'token' => 'required|string',
        ]);

        /** @var \App\Models\User $user */
        $user = Auth::user();

        $tokenValue = $request->input('token');

        $token = ExpoToken::firstOrCreate([
            'value' => $tokenValue,
            'owner_type' => get_class($user),
            'owner_id' => $user->id,
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Expo token registered',
            'data' => $token
        ]);
    }
}

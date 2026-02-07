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
            'device_model' => 'nullable|string',
        ]);

        /** @var \App\Models\User $user */
        $user = Auth::user();

        $tokenValue = $request->input('token');
        $deviceModel = $request->input('device_model');

        if ($deviceModel) {
            // Logic to prevent duplicates for same device
            $token = ExpoToken::where('owner_type', get_class($user))
                ->where('owner_id', $user->id)
                ->where('device_model', $deviceModel)
                ->first();

            if ($token) {
                // Update existing token if different
                if ($token->value !== $tokenValue) {
                    $token->value = $tokenValue;
                    $token->save();
                }
            } else {
                // Create new token for this device
                $token = new ExpoToken();
                $token->value = $tokenValue;
                $token->owner_type = get_class($user);
                $token->owner_id = $user->id;
                $token->forceFill(['device_model' => $deviceModel])->save();
            }
        } else {
            // Fallback for legacy calls without device_model
            // Try to find if this token already exists for this user
            $token = ExpoToken::where('owner_type', get_class($user))
                ->where('owner_id', $user->id)
                ->where('value', $tokenValue)
                ->first();

            if (!$token) {
                $token = new ExpoToken();
                $token->value = $tokenValue;
                $token->owner_type = get_class($user);
                $token->owner_id = $user->id;
                $token->save();
            }
        }

        // Also update the user's push_token field for easier access if it exists
        $user->forceFill(['push_token' => $tokenValue])->save();

        return response()->json([
            'success' => true,
            'message' => 'Expo token registered',
            'data' => $token
        ]);
    }
}

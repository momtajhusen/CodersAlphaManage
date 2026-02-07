<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Models\Employee;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Str;
use Tymon\JWTAuth\Facades\JWTAuth;
use Tymon\JWTAuth\Exceptions\JWTException;
use App\Traits\LogsActivity;
use Illuminate\Support\Facades\Mail;
use App\Mail\WelcomeEmail;
use Illuminate\Support\Facades\Log;

use App\Models\Otp;
use App\Mail\OtpEmail;

class AuthController extends Controller
{
    use LogsActivity;

    /**
     * Send OTP for Registration
     */
    public function sendRegistrationOtp(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'email' => 'required|email|unique:users',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            $this->generateAndSendOtp($request->email, 'Registration Verification', 'registration');
            
            return response()->json([
                'success' => true,
                'message' => 'OTP sent successfully to your email.',
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to send OTP: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Register new user with OTP
     */
    public function register(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'email' => 'required|email|unique:users',
            'password' => 'required|min:8|confirmed',
            'full_name' => 'required|string',
            'mobile_number' => 'required|string',
            'role' => 'required|string',
            'monthly_salary' => 'required|numeric',
            'otp' => 'required|string|size:6',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors()
            ], 422);
        }

        // Verify OTP
        if (!$this->verifyOtp($request->email, $request->otp, 'registration')) {
            return response()->json([
                'success' => false,
                'message' => 'Invalid or expired OTP.'
            ], 400);
        }

        try {
            // Create user
            $user = User::create([
                'name' => $request->full_name,
                'email' => $request->email,
                'password' => Hash::make($request->password),
                'email_verified_at' => now(), // Auto verify since OTP is correct
            ]);

            // Check if employee exists
            $employee = Employee::where('email', $request->email)->first();

            if ($employee) {
                // Link existing employee
                $employee->update([
                    'user_id' => $user->id,
                    'full_name' => $request->full_name, // Update name if needed
                    'mobile_number' => $request->mobile_number,
                    'role' => $request->role, // Update role?? Maybe careful here. But for registration, usually we trust input or existing?
                    // Let's assume registration updates the profile or keeps existing important data.
                    // For now, I will update basic info but maybe keep salary/join_date if set?
                    // Actually, if it's a new registration, we might want to respect the input.
                    // But if employee exists, it might have valid data.
                    // Safest is to link and update only missing or user-provided fields.
                    'monthly_salary' => $request->monthly_salary ?? $employee->monthly_salary,
                ]);
            } else {
                // Create employee record
                $employee = Employee::create([
                    'user_id' => $user->id,
                    'employee_code' => 'EMP-' . strtoupper(uniqid()),
                    'full_name' => $request->full_name,
                    'email' => $request->email,
                    'mobile_number' => $request->mobile_number,
                    'role' => $request->role,
                    'monthly_salary' => $request->monthly_salary,
                    'salary_type' => $request->salary_type ?? 'fixed',
                    'join_date' => now(),
                    'status' => 'active',
                ]);
            }

            // Log activity
            $this->logActivity('create', 'employee', $employee->id, 
                null, 
                ['name' => $request->full_name, 'role' => $request->role]
            );

            // Send Welcome Email
            try {
                $details = [
                    'name' => $request->full_name,
                    'email' => $request->email,
                    'password' => $request->password,
                    'role' => $request->role,
                ];
                Mail::to($request->email)->send(new WelcomeEmail($details));
            } catch (\Exception $e) {
                Log::error('Email sending failed: ' . $e->getMessage());
            }

            $token = JWTAuth::fromUser($user);

            return response()->json([
                'success' => true,
                'message' => 'User registered successfully',
                'data' => [
                    'user' => $user,
                    'employee' => $employee,
                    'token' => $token
                ]
            ], 201);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Registration failed: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Send OTP for Forgot Password
     */
    public function forgotPassword(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'email' => 'required|email|exists:users,email',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            $this->generateAndSendOtp($request->email, 'Reset Password OTP', 'reset_password');
            
            return response()->json([
                'success' => true,
                'message' => 'OTP sent successfully to your email.',
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to send OTP: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Reset Password with OTP
     */
    public function resetPassword(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'email' => 'required|email|exists:users,email',
            'otp' => 'required|string|size:6',
            'password' => 'required|min:8|confirmed',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors()
            ], 422);
        }

        if (!$this->verifyOtp($request->email, $request->otp, 'reset_password')) {
            return response()->json([
                'success' => false,
                'message' => 'Invalid or expired OTP.'
            ], 400);
        }

        try {
            $user = User::where('email', $request->email)->first();
            $user->update([
                'password' => Hash::make($request->password)
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Password reset successfully. You can now login.',
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Password reset failed: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Helper: Generate and Send OTP
     */
    private function generateAndSendOtp($email, $subject, $type = 'general')
    {
        // Generate 6 digit OTP
        $otpCode = (string) rand(100000, 999999);
        
        // Store in DB
        Otp::updateOrCreate(
            [
                'email' => $email,
                'type' => $type
            ],
            [
                'otp' => $otpCode,
                'expires_at' => now()->addMinutes(10)
            ]
        );

        // Send Email
        $details = [
            'otp' => $otpCode,
            'subject' => $subject,
            'message' => 'Your One Time Password (OTP) for ' . $subject . ' is:'
        ];
        
        Mail::to($email)->send(new OtpEmail($details));
    }

    /**
     * Helper: Verify OTP
     */
    private function verifyOtp($email, $otp, $type = 'general')
    {
        $record = Otp::where('email', $email)
                    ->where('otp', $otp)
                    ->where('type', $type)
                    ->where('expires_at', '>', now())
                    ->first();

        if ($record) {
            // Optional: Delete OTP after use? Or keep until expiry?
            // Deleting prevents replay attacks
            $record->delete();
            return true;
        }
        return false;
    }


    /**
     * Login user
     */
    public function login(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'email' => 'required|email',
            'password' => 'required|min:8',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            $credentials = $request->only('email', 'password');

            /** @var \Tymon\JWTAuth\JWTGuard $guard */
            $guard = Auth::guard('api');

            if (!$token = $guard->attempt($credentials)) {
                return response()->json([
                    'success' => false,
                    'message' => 'Invalid credentials'
                ], 401);
            }

            /** @var \App\Models\User $user */
            $user = $guard->user();
            
            // Auto-link employee if not linked but email matches
            if (!$user->employee) {
                $matchingEmployee = Employee::where('email', $user->email)->first();
                if ($matchingEmployee) {
                    $matchingEmployee->update(['user_id' => $user->id]);
                    $user->load('employee'); // Reload relation
                } else {
                    // Auto-create employee profile for the user
                    $employee = Employee::create([
                        'user_id' => $user->id,
                        'full_name' => $user->name,
                        'email' => $user->email,
                        'employee_code' => 'EMP-' . strtoupper(uniqid()),
                        'role' => 'Staff', // Default role
                        'status' => 'active',
                        'join_date' => now(),
                        'monthly_salary' => 0,
                    ]);
                    $user->load('employee');
                }
            }
            
            $employee = $user->employee;

            // Log login activity
            $this->logActivity('login', 'auth', $user->id, null, ['ip' => $request->ip()]);

            return response()->json([
                'success' => true,
                'message' => 'Login successful',
                'data' => [
                    'user' => $user,
                    'employee' => $employee,
                    'token' => $token
                ]
            ]);

        } catch (JWTException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Could not create token'
            ], 500);
        }
    }

    /**
     * Google OAuth callback
     */
    public function googleCallback(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'email' => 'required|email',
            'google_id' => 'required|string',
            'google_avatar' => 'nullable|url',
            'full_name' => 'required|string',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            // Find or create user
            $user = User::firstOrCreate(
                ['email' => $request->email],
                [
                    'google_id' => $request->google_id,
                    'google_avatar' => $request->google_avatar,
                    'password' => Hash::make(Str::random(32)),
                ]
            );

            // Create employee if not exists
            if (!$user->employee) {
                $existingEmployee = Employee::where('email', $request->email)->first();
                
                if ($existingEmployee) {
                    $existingEmployee->update(['user_id' => $user->id]);
                } else {
                    Employee::create([
                        'user_id' => $user->id,
                        'employee_code' => 'EMP-' . strtoupper(uniqid()),
                        'full_name' => $request->full_name,
                        'email' => $request->email,
                        'mobile_number' => $request->mobile_number ?? '',
                        'role' => $request->role ?? 'employee',
                        'monthly_salary' => 0,
                        'join_date' => now(),
                        'status' => 'active',
                    ]);
                }
            }

            $token = JWTAuth::fromUser($user);

            return response()->json([
                'success' => true,
                'message' => 'Google login successful',
                'data' => [
                    'user' => $user,
                    'employee' => $user->employee,
                    'token' => $token
                ]
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Google login failed: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Update user profile
     */
    public function updateProfile(Request $request)
    {
        /** @var \App\Models\User|null $user */
        $user = Auth::guard('api')->user();
        if (!$user) {
            return response()->json(['success' => false, 'message' => 'User not found'], 404);
        }

        /** @var \App\Models\Employee|null $employee */
        $employee = $user->employee;
        if (!$employee) {
            return response()->json(['success' => false, 'message' => 'Employee record not found'], 404);
        }

        $validator = Validator::make($request->all(), [
            'full_name' => 'required|string|max:255',
            'email' => 'required|email|unique:users,email,' . $user->id,
            'mobile_number' => 'required|string|max:20',
            'address' => 'nullable|string|max:500',
            'profile_photo' => 'nullable|image|max:2048', // Max 2MB
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            // Update User
            $user->update([
                'name' => $request->full_name,
                'email' => $request->email,
            ]);

            // Update Employee
            // Note: Employee model has a mutator for profile_photo that handles upload
            $employeeData = [
                'full_name' => $request->full_name,
                'email' => $request->email,
                'mobile_number' => $request->mobile_number,
                'address' => $request->address,
            ];

            if ($request->hasFile('profile_photo')) {
                // Delete old photo if exists
                if ($employee->profile_photo && \Illuminate\Support\Facades\Storage::disk('public')->exists($employee->profile_photo)) {
                    \Illuminate\Support\Facades\Storage::disk('public')->delete($employee->profile_photo);
                }
                // Trigger mutator by setting a dummy value, or rely on model handling
                $employeeData['profile_photo'] = $request->file('profile_photo');
            }

            $employee->update($employeeData);

            // Log activity
            $this->logActivity('update', 'profile', $user->id, null, ['fields' => array_keys($request->all())]);

            return response()->json([
                'success' => true,
                'message' => 'Profile updated successfully',
                'data' => [
                    'user' => $user->fresh(),
                    'employee' => $employee->fresh(),
                ]
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Profile update failed: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Change password
     */
    public function changePassword(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'current_password' => 'required',
            'new_password' => 'required|min:8|confirmed',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            /** @var \App\Models\User $user */
            $user = Auth::user();

            if (!Hash::check($request->current_password, $user->password)) {
                return response()->json([
                    'success' => false,
                    'message' => 'Current password does not match'
                ], 400);
            }

            $user->update([
                'password' => Hash::make($request->new_password)
            ]);

            // Log activity
            $this->logActivity('change_password', 'auth', $user->id);

            return response()->json([
                'success' => true,
                'message' => 'Password changed successfully'
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Password change failed: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get current user
     */
    public function getUser()
    {
        try {
            /** @var \App\Models\User|null $user */
            $user = Auth::user();
            
            if (!$user) {
                return response()->json([
                    'success' => false,
                    'message' => 'User not authenticated'
                ], 401);
            }

            // Auto-link employee if not linked but email matches
            if (!$user->employee) {
                $matchingEmployee = Employee::where('email', $user->email)->first();
                if ($matchingEmployee) {
                    $matchingEmployee->update(['user_id' => $user->id]);
                    $user->load('employee'); // Reload relation
                } else {
                    // Auto-create employee profile for the user
                    $employee = Employee::create([
                        'user_id' => $user->id,
                        'full_name' => $user->name,
                        'email' => $user->email,
                        'employee_code' => 'EMP-' . strtoupper(uniqid()),
                        'role' => 'Staff', // Default role
                        'status' => 'active',
                        'join_date' => now(),
                        'monthly_salary' => 0,
                    ]);
                    $user->load('employee');
                }
            }

            return response()->json([
                'success' => true,
                'data' => [
                    'user' => $user,
                    'employee' => $user->employee
                ]
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Logout user
     */
    public function logout()
    {
        try {
            /** @var \App\Models\User|null $user */
            $user = Auth::user();
            if ($user) {
                $this->logActivity('logout', 'auth', $user->id);
            }

            Auth::logout();

            return response()->json([
                'success' => true,
                'message' => 'Logout successful'
            ]);

        } catch (JWTException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Logout failed'
            ], 500);
        }
    }
}

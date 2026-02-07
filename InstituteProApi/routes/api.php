<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

use App\Http\Controllers\AuthController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\EmployeeController;
use App\Http\Controllers\AttendanceController;
use App\Http\Controllers\IncomeController;
use App\Http\Controllers\ExpenseController;
use App\Http\Controllers\TaskController;
use App\Http\Controllers\TaskAssignmentController;
use App\Http\Controllers\SelfLoggedWorkController;
use App\Http\Controllers\NotificationController;
use App\Http\Controllers\ActivityLogController;
use App\Http\Controllers\CashTransferController;
use App\Http\Controllers\NoticeController;
use App\Http\Controllers\ExpoTokenController;

// Public Routes
Route::post('/auth/send-registration-otp', [AuthController::class, 'sendRegistrationOtp']);
Route::post('/auth/register', [AuthController::class, 'register']);
Route::post('/auth/login', [AuthController::class, 'login']);
Route::post('/auth/forgot-password', [AuthController::class, 'forgotPassword']);
Route::post('/auth/reset-password', [AuthController::class, 'resetPassword']);
Route::get('/auth/login', function () {
    return response()->json(['message' => 'Unauthenticated.'], 401);
})->name('login');
Route::post('/auth/google-callback', [AuthController::class, 'googleCallback']);


// Protected Routes
Route::middleware(['auth:api','compress','metrics'])->group(function () {
    
    // Auth
    Route::post('/auth/logout', [AuthController::class, 'logout']);
    Route::get('/auth/user', [AuthController::class, 'getUser']);
    Route::post('/auth/update-profile', [AuthController::class, 'updateProfile']);
    Route::post('/auth/change-password', [AuthController::class, 'changePassword']);

    // Dashboard
    Route::get('/dashboard', [DashboardController::class, 'index']);
    
    // Employees
    Route::apiResource('employees', EmployeeController::class);
    Route::get('employees/{id}/history', [EmployeeController::class, 'history']);
    
    // Attendance
    Route::post('/attendance/check-in', [AttendanceController::class, 'checkIn']);
    Route::post('/attendance/check-out', [AttendanceController::class, 'checkOut']);
    Route::get('/attendance/monthly-report', [AttendanceController::class, 'monthlyReport']);
    Route::get('/attendance/annual-report', [AttendanceController::class, 'annualReport']);
    Route::get('/attendance/master-report', [AttendanceController::class, 'masterReport']);
    Route::apiResource('attendance', AttendanceController::class);
    
    // Income
    Route::put('/income/{id}/confirm', [IncomeController::class, 'confirm']);
    Route::put('/income/{id}/reject', [IncomeController::class, 'reject']);
    Route::get('/income/report', [IncomeController::class, 'report']);
    Route::apiResource('income', IncomeController::class);
    
    // Expenses
    Route::put('/expenses/{id}/approve', [ExpenseController::class, 'approve']);
    Route::put('/expenses/{id}/reject', [ExpenseController::class, 'reject']);
    Route::put('/expenses/{id}/reimburse', [ExpenseController::class, 'reimburse']);
    Route::get('/expenses/pending-reimbursement', [ExpenseController::class, 'pendingReimbursements']);
    Route::get('/expenses/report', [ExpenseController::class, 'report']);
    Route::apiResource('expenses', ExpenseController::class);

    // Cash Transfers
    Route::get('/cash-transfers', [CashTransferController::class, 'index']);
    Route::post('/cash-transfers', [CashTransferController::class, 'store']);
    Route::put('/cash-transfers/{id}', [CashTransferController::class, 'update']);
    Route::delete('/cash-transfers/{id}', [CashTransferController::class, 'destroy']);
    
    // Tasks
    Route::apiResource('tasks', TaskController::class);
    Route::post('/tasks/{id}/assign', [TaskController::class, 'assign']);
    Route::put('/tasks/{id}/progress', [TaskController::class, 'updateProgress']);
    Route::put('/tasks/{id}/complete', [TaskController::class, 'complete']);
    
    // Task Assignments
    Route::get('/assignments', [TaskAssignmentController::class, 'index']);
    Route::get('/my-assignments', [TaskAssignmentController::class, 'myAssignments']);
    Route::put('/assignments/{id}/accept', [TaskAssignmentController::class, 'accept']);
    Route::put('/assignments/{id}/reject', [TaskAssignmentController::class, 'reject']);
    Route::put('/assignments/{id}/time', [TaskAssignmentController::class, 'updateTime']);
    
    // Self-logged Work
    Route::get('/my-work', [SelfLoggedWorkController::class, 'myWork']);
    Route::apiResource('self-logged-work', SelfLoggedWorkController::class);
    Route::put('/self-logged-work/{id}/approve', [SelfLoggedWorkController::class, 'approve']);
    Route::put('/self-logged-work/{id}/reject', [SelfLoggedWorkController::class, 'reject']);
    
    // Notifications
    Route::get('/notifications', [NotificationController::class, 'index']);
    Route::get('/notifications/unread-count', [NotificationController::class, 'unreadCount']);
    Route::put('/notifications/mark-all-read', [NotificationController::class, 'markAllAsRead']);
    Route::put('/notifications/{id}/read', [NotificationController::class, 'markAsRead']);
    Route::delete('/notifications/clear-all', [NotificationController::class, 'clearAll']);
    Route::delete('/notifications/{id}', [NotificationController::class, 'destroy']);
    
    // Notices
    Route::apiResource('notices', NoticeController::class);

    // Activity Log
    Route::get('/activity-log', [ActivityLogController::class, 'index']);
    Route::get('/activity-log/summary', [ActivityLogController::class, 'summary']);
    Route::get('/activity-log/entity/{entity_type}/{entity_id}', [ActivityLogController::class, 'entityHistory']);
    Route::get('/activity-log/user/{user_id}', [ActivityLogController::class, 'userActivities']);
    Route::get('/activity-log/export', [ActivityLogController::class, 'export']);

    // Expo Push Tokens
    Route::post('/expo/token', [ExpoTokenController::class, 'store']);
    Route::get('/expo/token/status', [ExpoTokenController::class, 'status']);
});

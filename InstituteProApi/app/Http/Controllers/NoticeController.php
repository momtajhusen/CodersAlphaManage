<?php

namespace App\Http\Controllers;

use App\Models\Notice;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class NoticeController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {
        try {
            $query = Notice::query();

            // Filter by audience (all + user role specific)
            // Assuming current user has a role, we can filter. 
            // For now, we return 'all' and notices targeting specific audience if logic exists.
            // Simplified: return all for now or filter by request
            if ($request->audience) {
                $query->where('audience', $request->audience);
            }

            if ($request->is_important) {
                $query->where('is_important', true);
            }
            
            if ($request->search) {
                $query->where(function($q) use ($request) {
                    $q->where('title', 'like', "%{$request->search}%")
                      ->orWhere('content', 'like', "%{$request->search}%");
                });
            }

            $query->orderBy('date', 'desc')->orderBy('created_at', 'desc');

            $notices = $query->paginate($request->per_page ?? 20);

            return response()->json([
                'success' => true,
                'data' => $notices
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        try {
            $validated = $request->validate([
                'title' => 'required|string|max:255',
                'content' => 'required|string',
                'type' => 'nullable|string',
                'is_important' => 'boolean',
                'audience' => 'nullable|string',
                'date' => 'nullable|date',
            ]);

            $notice = Notice::create([
                ...$validated,
                'created_by' => Auth::id(),
                'date' => $validated['date'] ?? now(),
                'audience' => $validated['audience'] ?? 'all',
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Notice created successfully',
                'data' => $notice
            ], 201);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Display the specified resource.
     */
    public function show($id)
    {
        try {
            $notice = Notice::findOrFail($id);
            return response()->json([
                'success' => true,
                'data' => $notice
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Notice not found'
            ], 404);
        }
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, $id)
    {
        try {
            $notice = Notice::findOrFail($id);
            
            // Authorization: Only creator or admin
            // if ($notice->created_by !== Auth::id()) ...

            $notice->update($request->all());

            return response()->json([
                'success' => true,
                'message' => 'Notice updated successfully',
                'data' => $notice
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy($id)
    {
        try {
            $notice = Notice::findOrFail($id);
            $notice->delete();

            return response()->json([
                'success' => true,
                'message' => 'Notice deleted successfully'
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage()
            ], 500);
        }
    }
}

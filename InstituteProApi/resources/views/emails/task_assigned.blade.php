<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>New Task Assignment - EduManage</title>
    <style>
        /* Modern Reset */
        body { margin: 0; padding: 0; background-color: #f4f7fa; font-family: 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; -webkit-font-smoothing: antialiased; color: #333333; }
        table { border-spacing: 0; width: 100%; }
        td { padding: 0; }
        img { border: 0; }
        
        /* Layout */
        .wrapper { width: 100%; table-layout: fixed; background-color: #f4f7fa; padding: 40px 0; }
        .main-container { background-color: #ffffff; margin: 0 auto; width: 100%; max-width: 600px; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.08); }
        
        /* Header */
        .header { background: linear-gradient(135deg, #1A2332 0%, #2C3E50 100%); padding: 40px 30px; text-align: center; position: relative; }
        .header::after { content: ''; position: absolute; bottom: 0; left: 0; right: 0; height: 6px; background: #FF8C00; }
        .brand-name { color: #ffffff; font-size: 28px; font-weight: 800; letter-spacing: 1px; margin: 0; }
        .brand-subtitle { color: #cbd5e0; font-size: 14px; margin-top: 5px; font-weight: 500; text-transform: uppercase; letter-spacing: 2px; }
        
        /* Content */
        .content { padding: 40px 30px; }
        .greeting { font-size: 24px; color: #1A2332; font-weight: 700; margin-bottom: 15px; }
        .message { font-size: 16px; color: #555555; line-height: 1.6; margin-bottom: 30px; }
        
        /* Task Card */
        .task-card { background-color: #f8fafc; border-left: 5px solid #FF8C00; border-radius: 8px; padding: 25px; margin-bottom: 30px; box-shadow: 0 2px 5px rgba(0,0,0,0.05); }
        .task-title { font-size: 18px; font-weight: 700; color: #1A2332; margin-bottom: 10px; display: block; }
        
        .meta-row { display: flex; margin-bottom: 12px; align-items: center; }
        .meta-label { font-size: 12px; text-transform: uppercase; color: #64748b; font-weight: 700; width: 80px; flex-shrink: 0; }
        .meta-value { font-size: 14px; color: #334155; font-weight: 600; }
        
        .priority-badge { display: inline-block; padding: 4px 10px; border-radius: 4px; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; }
        .priority-high { background-color: #fee2e2; color: #ef4444; }
        .priority-medium { background-color: #fef3c7; color: #f59e0b; }
        .priority-low { background-color: #dcfce7; color: #22c55e; }
        
        .description-box { margin-top: 15px; padding-top: 15px; border-top: 1px dashed #cbd5e0; }
        .description-text { font-size: 14px; color: #475569; line-height: 1.5; font-style: italic; }
        
        /* Action Button */
        .btn-wrapper { text-align: center; margin: 35px 0; }
        .btn { display: inline-block; background-color: #1A2332; color: #ffffff; text-decoration: none; padding: 14px 36px; border-radius: 8px; font-weight: 700; font-size: 16px; box-shadow: 0 4px 12px rgba(26, 35, 50, 0.3); transition: all 0.3s ease; }
        .btn:hover { background-color: #2c3e50; transform: translateY(-2px); }
        
        /* Footer */
        .footer { background-color: #f1f5f9; padding: 25px; text-align: center; border-top: 1px solid #e2e8f0; }
        .footer p { color: #64748b; font-size: 12px; margin: 5px 0; }
        .footer-link { color: #FF8C00; text-decoration: none; }
        
        @media screen and (max-width: 600px) {
            .wrapper { padding: 0; }
            .main-container { border-radius: 0; box-shadow: none; }
        }
    </style>
</head>
<body>
    <div class="wrapper">
        <table class="main-container" role="presentation">
            <!-- Header -->
            <tr>
                <td class="header">
                    <h1 class="brand-name">EduManage</h1>
                    <p class="brand-subtitle">Task Management</p>
                </td>
            </tr>
            
            <!-- Content -->
            <tr>
                <td class="content">
                    <h2 class="greeting">Hi, {{ $details['name'] }}!</h2>
                    <p class="message">
                        You have been assigned a new task. Please review the details below and ensure timely completion.
                    </p>
                    
                    <!-- Task Card -->
                    <div class="task-card">
                        <span class="task-title">{{ $details['title'] }}</span>
                        
                        <div class="meta-row">
                            <span class="meta-label">Priority</span>
                            <span class="meta-value">
                                <span class="priority-badge priority-{{ strtolower($details['priority']) }}">
                                    {{ ucfirst($details['priority']) }}
                                </span>
                            </span>
                        </div>
                        
                        <div class="meta-row">
                            <span class="meta-label">Deadline</span>
                            <span class="meta-value">{{ $details['deadline'] }}</span>
                        </div>
                        
                        <div class="description-box">
                            <p class="description-text">"{{ $details['description'] }}"</p>
                        </div>
                    </div>
                    
                    <div class="btn-wrapper">
                        <a href="#" class="btn">View Task Details</a>
                    </div>
                    
                    <p style="text-align: center; font-size: 14px; color: #94a3b8;">
                        Log in to the app to update progress or mark as complete.
                    </p>
                </td>
            </tr>
            
            <!-- Footer -->
            <tr>
                <td class="footer">
                    <p>&copy; {{ date('Y') }} EduManage. All rights reserved.</p>
                    <p>Need assistance? <a href="mailto:support@codersalpha.com" class="footer-link">Contact Support</a></p>
                </td>
            </tr>
        </table>
    </div>
</body>
</html>
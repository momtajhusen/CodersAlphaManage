<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Leave Request Update - EduManage</title>
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
        
        /* Status Badge */
        .status-badge { display: inline-block; padding: 8px 16px; border-radius: 50px; color: white; font-weight: bold; text-transform: uppercase; font-size: 14px; letter-spacing: 1px; margin-bottom: 20px; }
        .status-approved { background-color: #22c55e; box-shadow: 0 4px 10px rgba(34, 197, 94, 0.3); }
        .status-rejected { background-color: #ef4444; box-shadow: 0 4px 10px rgba(239, 68, 68, 0.3); }
        .status-pending { background-color: #f59e0b; box-shadow: 0 4px 10px rgba(245, 158, 11, 0.3); }
        
        /* Details Card */
        .card { background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 25px; margin-bottom: 30px; position: relative; overflow: hidden; }
        .card::before { content: ''; position: absolute; top: 0; left: 0; width: 4px; height: 100%; background-color: #FF8C00; }
        
        .field-group { display: flex; justify-content: space-between; margin-bottom: 15px; border-bottom: 1px dashed #cbd5e0; padding-bottom: 15px; }
        .field-group:last-child { margin-bottom: 0; border-bottom: none; padding-bottom: 0; }
        .field-label { font-size: 14px; color: #64748b; font-weight: 600; }
        .field-value { font-size: 14px; color: #1A2332; font-weight: 600; text-align: right; }
        
        .remarks-box { background-color: #fff7ed; border-left: 4px solid #FF8C00; padding: 15px; margin-top: 20px; border-radius: 0 8px 8px 0; }
        .remarks-label { display: block; font-size: 12px; color: #9a3412; font-weight: 700; text-transform: uppercase; margin-bottom: 5px; }
        .remarks-text { font-size: 14px; color: #431407; font-style: italic; }
        
        /* Footer */
        .footer { background-color: #1A2332; padding: 25px; text-align: center; }
        .footer p { color: #718096; font-size: 12px; margin: 5px 0; }
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
                    <p class="brand-subtitle">Institute Management System</p>
                </td>
            </tr>
            
            <!-- Content -->
            <tr>
                <td class="content">
                    <h2 class="greeting">Hello, {{ $details['name'] }}!</h2>
                    <p class="message">
                        Your leave request status has been updated.
                    </p>
                    
                    <div style="text-align: center;">
                        <span class="status-badge status-{{ strtolower($details['status']) }}">
                            {{ ucfirst($details['status']) }}
                        </span>
                    </div>
                    
                    <!-- Details Card -->
                    <div class="card">
                        <div class="field-group">
                            <span class="field-label">Leave Type</span>
                            <span class="field-value">{{ ucfirst($details['type']) }}</span>
                        </div>
                        <div class="field-group">
                            <span class="field-label">Date</span>
                            <span class="field-value">{{ $details['date'] }}</span>
                        </div>
                        <div class="field-group">
                            <span class="field-label">Processed By</span>
                            <span class="field-value">{{ $details['approver'] ?? 'Admin' }}</span>
                        </div>
                    </div>
                    
                    @if(isset($details['remarks']) && $details['remarks'])
                    <div class="remarks-box">
                        <span class="remarks-label">Note</span>
                        <p class="remarks-text">"{{ $details['remarks'] }}"</p>
                    </div>
                    @endif
                    
                    <p style="text-align: center; margin-top: 30px; font-size: 14px; color: #64748b;">
                        Please login to the app to view more details.
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
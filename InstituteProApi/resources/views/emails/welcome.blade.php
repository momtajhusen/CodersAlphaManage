<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Welcome to EduManage</title>
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
        
        /* Credentials Card */
        .card { background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 25px; margin-bottom: 30px; position: relative; overflow: hidden; }
        .card::before { content: ''; position: absolute; top: 0; left: 0; width: 4px; height: 100%; background-color: #FF8C00; }
        .card-title { font-size: 14px; text-transform: uppercase; color: #64748b; font-weight: 700; letter-spacing: 1px; margin-bottom: 20px; display: block; border-bottom: 1px solid #e2e8f0; padding-bottom: 10px; }
        
        .field-group { margin-bottom: 15px; }
        .field-group:last-child { margin-bottom: 0; }
        .field-label { font-size: 12px; color: #64748b; margin-bottom: 4px; display: block; font-weight: 600; }
        .field-value { font-size: 16px; color: #1A2332; font-weight: 600; font-family: 'Consolas', 'Monaco', monospace; background: #ffffff; padding: 8px 12px; border-radius: 6px; border: 1px solid #edf2f7; display: inline-block; min-width: 200px; }
        
        /* Action Button */
        .btn-wrapper { text-align: center; margin: 35px 0; }
        .btn { display: inline-block; background-color: #FF8C00; color: #ffffff; text-decoration: none; padding: 14px 36px; border-radius: 8px; font-weight: 700; font-size: 16px; box-shadow: 0 4px 12px rgba(255, 140, 0, 0.3); transition: all 0.3s ease; }
        .btn:hover { background-color: #e67e00; box-shadow: 0 6px 16px rgba(255, 140, 0, 0.4); transform: translateY(-2px); }
        
        /* Next Steps */
        .steps { margin-top: 30px; border-top: 1px solid #edf2f7; padding-top: 30px; }
        .step-item { display: flex; align-items: start; margin-bottom: 15px; }
        .step-icon { background-color: #fff7ed; color: #FF8C00; width: 24px; height: 24px; border-radius: 50%; text-align: center; line-height: 24px; font-weight: bold; font-size: 12px; margin-right: 12px; flex-shrink: 0; }
        .step-text { font-size: 14px; color: #555555; line-height: 1.5; }
        
        /* Footer */
        .footer { background-color: #1A2332; padding: 25px; text-align: center; }
        .footer p { color: #718096; font-size: 12px; margin: 5px 0; }
        .footer-link { color: #FF8C00; text-decoration: none; }
        
        @media screen and (max-width: 600px) {
            .wrapper { padding: 0; }
            .main-container { border-radius: 0; box-shadow: none; }
            .field-value { width: 100%; box-sizing: border-box; }
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
                    <h2 class="greeting">Hello, {{ $details['name'] }}! 👋</h2>
                    <p class="message">
                        Welcome to the team! Your account has been successfully created. We've set up a secure dashboard for you to manage your activities, tasks, and more.
                    </p>
                    
                    <!-- Credentials Card -->
                    <div class="card">
                        <span class="card-title">Your Access Credentials</span>
                        
                        <div class="field-group">
                            <span class="field-label">Email Address</span>
                            <span class="field-value">{{ $details['email'] }}</span>
                        </div>
                        
                        <div class="field-group">
                            <span class="field-label">Temporary Password</span>
                            <span class="field-value">{{ $details['password'] }}</span>
                        </div>
                        
                        <div class="field-group">
                            <span class="field-label">Role</span>
                            <span class="field-value" style="color: #FF8C00;">{{ ucfirst($details['role']) }}</span>
                        </div>
                    </div>
                    
                    <div class="btn-wrapper">
                        <a href="#" class="btn">Access Dashboard</a>
                    </div>
                    
                    <!-- Quick Guide -->
                    <div class="steps">
                        <div class="step-item">
                            <div class="step-icon">1</div>
                            <div class="step-text">Download the EduManage App from your store.</div>
                        </div>
                        <div class="step-item">
                            <div class="step-icon">2</div>
                            <div class="step-text">Login using the credentials provided above.</div>
                        </div>
                        <div class="step-item">
                            <div class="step-icon">3</div>
                            <div class="step-text"><strong>Important:</strong> Change your password immediately for security.</div>
                        </div>
                    </div>
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
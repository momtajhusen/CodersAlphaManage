<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>OTP Verification - EduManage</title>
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
        .content { padding: 50px 30px; text-align: center; }
        .icon-circle { width: 60px; height: 60px; background-color: #fff7ed; border-radius: 50%; margin: 0 auto 20px auto; display: flex; align-items: center; justify-content: center; color: #FF8C00; font-size: 30px; }
        .greeting { font-size: 24px; color: #1A2332; font-weight: 700; margin-bottom: 15px; }
        .message { font-size: 16px; color: #555555; line-height: 1.6; margin-bottom: 30px; max-width: 400px; margin-left: auto; margin-right: auto; }
        
        /* OTP Display */
        .otp-container { background: #f8fafc; border: 2px dashed #FF8C00; border-radius: 12px; padding: 25px; margin: 30px auto; max-width: 320px; position: relative; }
        .otp-code { font-size: 42px; font-weight: 800; color: #1A2332; letter-spacing: 12px; font-family: 'Consolas', 'Monaco', monospace; display: block; line-height: 1; }
        .otp-label { display: block; font-size: 12px; color: #64748b; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 10px; font-weight: 600; }
        
        /* Expiry Warning */
        .expiry-note { font-size: 14px; color: #64748b; margin-top: 25px; display: inline-block; background: #f1f5f9; padding: 8px 16px; border-radius: 20px; }
        .expiry-note strong { color: #FF8C00; }
        
        .security-note { font-size: 13px; color: #94a3b8; margin-top: 30px; font-style: italic; }
        
        /* Footer */
        .footer { background-color: #1A2332; padding: 25px; text-align: center; }
        .footer p { color: #718096; font-size: 12px; margin: 5px 0; }
        .footer-link { color: #FF8C00; text-decoration: none; }
        
        @media screen and (max-width: 600px) {
            .wrapper { padding: 0; }
            .main-container { border-radius: 0; box-shadow: none; }
            .otp-code { font-size: 32px; letter-spacing: 6px; }
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
                    <p class="brand-subtitle">Secure Verification</p>
                </td>
            </tr>
            
            <!-- Content -->
            <tr>
                <td class="content">
                    <div class="icon-circle">🔒</div>
                    <h2 class="greeting">Verify Your Identity</h2>
                    <p class="message">
                        {{ $details['message'] ?? 'Use the code below to complete your verification request. For security, do not share this code with anyone.' }}
                    </p>
                    
                    <!-- OTP Display -->
                    <div class="otp-container">
                        <span class="otp-label">Verification Code</span>
                        <span class="otp-code">{{ $details['otp'] }}</span>
                    </div>
                    
                    <div class="expiry-note">
                        ⏰ Valid for <strong>10 minutes</strong> only
                    </div>
                    
                    <p class="security-note">
                        If you didn't request this code, you can safely ignore this email.
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
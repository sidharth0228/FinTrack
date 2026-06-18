const EmailService = require('./EmailService');
const User = require('../models/User');

class EmergencyAlertEmailService {
    async sendEmergencyAlertEmail(userId, alertDoc) {
        try {
            const user = await User.findById(userId);
            if (!user) throw new Error('User not found');

            // Check if emergency alert emails are enabled for the user
            if (!user.emergencyAlertsEnabled) {
                console.log(`Emergency alert email is disabled for user: ${user.email}`);
                return false;
            }

            const recipientEmail = user.newspaperEmailAddress || user.email;
            console.log(`Sending emergency alert email to: ${recipientEmail} for alert: ${alertDoc.text}`);

            // Generate HTML template for the emergency email
            const html = this.generateEmergencyHtml(user, alertDoc);

            // Send Email
            const subject = `🚨 FinTrack Alert: Critical News Detected`;
            const success = await EmailService.sendEmailWithRetry(userId, recipientEmail, subject, html, 'emergency');
            return success;
        } catch (error) {
            console.error('Error in sendEmergencyAlertEmail:', error);
            return false;
        }
    }

    generateEmergencyHtml(user, alertDoc) {
        const dateStr = new Date(alertDoc.date || Date.now()).toLocaleString('en-US', {
            weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
            hour: '2-digit', minute: '2-digit', hour12: true
        });

        return `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Emergency Alerts - FinTrack</title>
        </head>
        <body style="background-color: #FEE2E2; margin: 0; padding: 20px; font-family: Georgia, serif; -webkit-font-smoothing: antialiased;">
            <table align="center" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 600px; background-color: #ffffff; border: 2px solid #DC2626; box-shadow: 0 10px 15px -3px rgba(0,0,0,0.1); padding: 25px; border-radius: 8px;">
                <tr>
                    <td>
                        <!-- Header Banner -->
                        <table border="0" cellpadding="0" cellspacing="0" width="100%" style="border-bottom: 2px solid #DC2626; padding-bottom: 12px; margin-bottom: 20px; text-align: center;">
                            <tr>
                                <td>
                                    <div style="font-family: 'Times New Roman', Times, serif; font-size: 1.5rem; font-weight: bold; color: #DC2626; letter-spacing: 1px; text-transform: uppercase;">🚨 CRITICAL EMERGENCY ALERT</div>
                                    <div style="font-family: monospace; font-size: 0.75rem; color: #666666; margin-top: 4px;">FinTrack Institutional Portfolio Desk • ${dateStr}</div>
                                </td>
                            </tr>
                        </table>

                        <!-- Alert Details Section -->
                        <div style="font-size: 1.05rem; line-height: 1.6; color: #111111; text-align: justify; margin-bottom: 25px; font-family: Georgia, serif;">
                            <p style="margin: 0 0 12px 0;">Hello <strong>${user.name}</strong>,</p>
                            <p style="margin: 0 0 15px 0;">
                                We have detected high-impact, critical financial news directly affecting assets in your portfolio or watchlist. 
                                In accordance with your settings, this alert has bypassed the daily newspaper schedule for immediate delivery.
                            </p>
                            <div style="background-color: #FEF2F2; border-left: 4px solid #DC2626; padding: 15px; margin: 15px 0; border-radius: 4px;">
                                <span style="font-size: 1.15rem; font-weight: bold; color: #B91C1C; display: block; margin-bottom: 6px;">BREAKING DEVELOPMENTS</span>
                                <span style="font-size: 1.05rem; color: #111111; font-style: italic; display: block; line-height: 1.5;">"${alertDoc.text}"</span>
                            </div>
                        </div>

                        <!-- Recommendations and Next Steps -->
                        <div style="margin-bottom: 25px; font-size: 0.9rem; line-height: 1.5; color: #4b5563;">
                            <span style="font-weight: bold; color: #111111; display: block; margin-bottom: 4px;">Next Steps:</span>
                            <ul style="margin: 0; padding-left: 20px;">
                                <li style="margin-bottom: 4px;">Review associated holdings weighting in your portfolio page.</li>
                                <li style="margin-bottom: 4px;">Access the personalized AI advisor for a real-time portfolio risk analysis report.</li>
                                <li style="margin-bottom: 4px;">Set limit order prices if necessary to hedge against near-term volatility.</li>
                            </ul>
                        </div>

                        <!-- Quick Link Buttons -->
                        <table border="0" cellpadding="0" cellspacing="0" width="100%" style="text-align: center; margin-bottom: 20px;">
                            <tr>
                                <td>
                                    <a href="http://localhost:5000/newspaper.html" style="background-color: #DC2626; color: #ffffff; padding: 10px 20px; font-family: Georgia, serif; font-weight: bold; font-size: 0.9rem; text-decoration: none; border-radius: 4px; display: inline-block; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">Open Newspaper Desk</a>
                                </td>
                            </tr>
                        </table>

                        <!-- Footer -->
                        <table border="0" cellpadding="0" cellspacing="0" width="100%" style="border-top: 1px solid #e5e7eb; padding-top: 15px; text-align: center; font-size: 0.75rem; color: #6b7280; line-height: 1.4;">
                            <tr>
                                <td>
                                    <div>You received this because you enabled Emergency Alerts for your portfolio assets.</div>
                                    <div style="margin-top: 4px;">To update your preferences, visit <a href="http://localhost:5000/profile.html" style="color: #DC2626; text-decoration: underline;">Settings → Notifications</a>.</div>
                                    <div style="margin-top: 8px;">© 2026 FinTrack Inc. • CONFIDENTIAL PORTFOLIO REPORT</div>
                                </td>
                            </tr>
                        </table>
                    </td>
                </tr>
            </table>
        </body>
        </html>
        `;
    }
}

module.exports = new EmergencyAlertEmailService();

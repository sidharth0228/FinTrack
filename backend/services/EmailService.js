const nodemailer = require('nodemailer');
const NewspaperEmailLog = require('../models/NewspaperEmailLog');
require('dotenv').config();

class EmailService {
    constructor() {
        const host = process.env.EMAIL_HOST || 'smtp.gmail.com';
        const port = parseInt(process.env.EMAIL_PORT) || 587;
        const secure = port === 465;
        const username = process.env.EMAIL_USERNAME || process.env.EMAIL_USER;
        const password = process.env.EMAIL_PASSWORD || process.env.EMAIL_PASS;
        this.from = process.env.EMAIL_FROM || `"FinTrack Advisor" <${username}>`;
        this.enabled = process.env.EMAIL_ENABLED === undefined ? true : process.env.EMAIL_ENABLED === 'true';

        this.transporter = nodemailer.createTransport(
            process.env.EMAIL_HOST 
                ? {
                    host,
                    port,
                    secure,
                    auth: {
                        user: username,
                        pass: password
                    }
                  }
                : {
                    service: 'gmail',
                    auth: {
                        user: username,
                        pass: password
                    }
                  }
        );
    }

    async sendEmailWithRetry(userId, to, subject, htmlContent, emailType, maxRetries = 3) {
        if (!this.enabled) {
            console.log(`Email sending is disabled via EMAIL_ENABLED config. Skipping email to: ${to}`);
            return false;
        }

        let attempts = 0;
        let success = false;
        let lastError = null;

        while (attempts < maxRetries && !success) {
            attempts++;
            try {
                const info = await this.transporter.sendMail({
                    from: this.from,
                    to,
                    subject,
                    html: htmlContent,
                });
                console.log(`Email (${emailType}) sent successfully to ${to} on attempt ${attempts}: ${info.messageId}`);
                success = true;
            } catch (error) {
                console.error(`Attempt ${attempts} failed to send email to ${to}:`, error);
                lastError = error;
                if (attempts < maxRetries) {
                    // Wait for 1 second before retrying
                    await new Promise(resolve => setTimeout(resolve, 1000));
                }
            }
        }

        // Log the result to the database
        try {
            const logEntry = new NewspaperEmailLog({
                userId,
                recipient: to,
                emailType,
                deliveryStatus: success ? 'success' : 'failed',
                errorMessage: success ? null : lastError?.message || 'Unknown error',
                attempts
            });
            await logEntry.save();
        } catch (logErr) {
            console.error('Failed to log email status to Database:', logErr);
        }

        return success;
    }
}

module.exports = new EmailService();

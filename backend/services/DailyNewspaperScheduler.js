import cron from 'node-cron';
import User from '../models/User.js';
import NewspaperEmailService from './NewspaperEmailService.js';

class DailyNewspaperScheduler {
    constructor() {
        this.job = null;
    }

    start() {
        console.log('Initializing Daily Newspaper Email Scheduler...');
        
        // Schedule job to run daily at 09:00 AM ('0 9 * * *')
        this.job = cron.schedule('0 9 * * *', async () => {
            console.log('--- Running Daily Newspaper Email Dispatch ---');
            try {
                // Get all users who have daily newspaper emails enabled
                const users = await User.find({ dailyNewspaperEnabled: true });
                console.log(`Found ${users.length} users with daily newspaper enabled. Starting delivery...`);

                for (const user of users) {
                    try {
                        await NewspaperEmailService.sendDailyNewspaperForUser(user._id);
                    } catch (userErr) {
                        console.error(`Failed to send daily newspaper to user ${user.email}:`, userErr);
                    }
                }
            } catch (error) {
                console.error('Error in Daily Newspaper Email Dispatch Scheduler:', error);
            }
        });
        
        console.log('Daily Newspaper Email Scheduler started successfully (runs at 09:00 AM daily).');
    }
}

export default new DailyNewspaperScheduler();

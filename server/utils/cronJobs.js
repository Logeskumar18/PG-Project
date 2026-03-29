import cron from 'node-cron';
import { sendDeadlineReminders } from '../utils/notificationService.js';

/**
 * Schedules all the cron jobs for the application.
 */
const scheduleJobs = () => {
  // Schedule a job to run once every day at 1:00 AM to check for upcoming deadlines.
  // The cron pattern '0 1 * * *' means it runs at minute 0 of hour 1, every day, every month, every day of the week.
  cron.schedule('0 1 * * *', async () => {
    console.log('Running daily deadline reminder job at 1:00 AM...');
    try {
      await sendDeadlineReminders();
      console.log('Successfully completed the deadline reminder job.');
    } catch (error) {
      console.error('Error running the deadline reminder job:', error);
    }
  }, {
    scheduled: true,
    timezone: "Asia/Kolkata" // IMPORTANT: Set this to your server's timezone.
  });

  console.log('✅ Cron jobs have been scheduled.');
};

export default scheduleJobs;
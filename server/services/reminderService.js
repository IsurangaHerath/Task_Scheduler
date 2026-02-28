const cron = require('node-cron');
const Task = require('../models/Task');
const User = require('../models/User');
const { sendTaskReminder } = require('./emailService');

/**
 * Reminder Service
 * Handles scheduled task reminders via email and browser notifications
 */

// Store active reminder jobs
const activeJobs = new Map();

/**
 * Initialize the reminder service
 * Starts cron job to check for due tasks every minute
 */
const initReminderService = () => {
    console.log('🔄 Initializing reminder service...');

    // Run every minute to check for due tasks
    cron.schedule('* * * * *', async () => {
        await checkDueTasks();
    });

    console.log('✅ Reminder service initialized (checking every minute)');
};

/**
 * Check for tasks that need reminders
 */
const checkDueTasks = async () => {
    try {
        const now = new Date();

        // Get current time components
        const currentHour = now.getHours();
        const currentMinute = now.getMinutes();

        // Format current time as HH:MM
        const currentTime = `${String(currentHour).padStart(2, '0')}:${String(currentMinute).padStart(2, '0')}`;

        // Calculate reminder window (tasks due in the next 15 minutes by default)
        const reminderWindowMinutes = 15;

        // Get all tasks from SQLite
        const allTasks = Task.getTasksNeedingReminders();

        for (const task of allTasks) {
            // Get user for this task
            const user = User.findById(task.userId);
            
            if (!user) continue;

            // Parse task time
            const [taskHour, taskMinute] = task.time.split(':').map(Number);

            // Calculate minutes until task
            const taskMinutes = taskHour * 60 + taskMinute;
            const nowMinutes = currentHour * 60 + currentMinute;
            const minutesUntilTask = taskMinutes - nowMinutes;

            // Get user's reminder preference (default 15 minutes)
            const reminderTime = user.settings?.reminderTime || 15;

            // Check if we should send reminder now
            if (minutesUntilTask > 0 && minutesUntilTask <= reminderTime) {
                await sendReminder(task, user);
            }
        }
    } catch (error) {
        console.error('❌ Error checking due tasks:', error.message);
    }
};

/**
 * Send reminder for a task
 * @param {Object} task - Task object
 * @param {Object} user - User object
 */
const sendReminder = async (task, user) => {
    try {
        if (!user) {
            console.warn(`⚠️ No user found for task ${task.id}`);
            return;
        }

        console.log(`🔔 Sending reminder for task "${task.title}" to ${user.email}`);

        // Send email reminder if enabled
        if (user.settings?.notifications?.email) {
            await sendTaskReminder(user, task);
        }

        // Mark reminder as sent
        Task.markReminderSent(task.id);

        console.log(`✅ Reminder sent for task "${task.title}"`);
    } catch (error) {
        console.error(`❌ Error sending reminder for task ${task.id}:`, error.message);
    }
};

/**
 * Schedule a specific reminder for a task
 * @param {Object} task - Task object
 * @param {Object} user - User object
 */
const scheduleTaskReminder = (task, user) => {
    // Cancel existing reminder if any
    cancelTaskReminder(task.id);

    if (!task.reminderEnabled || task.status === 'completed') {
        return;
    }

    // Calculate reminder time
    const [hour, minute] = task.time.split(':').map(Number);
    const reminderTime = user.settings?.reminderTime || 15;

    const reminderDate = new Date(task.dueDate);
    reminderDate.setHours(hour, minute, 0, 0);
    reminderDate.setMinutes(reminderDate.getMinutes() - reminderTime);

    const now = new Date();

    // Don't schedule if reminder time has passed
    if (reminderDate <= now) {
        return;
    }

    // Create cron expression for the reminder time
    const cronExpression = `${reminderDate.getMinutes()} ${reminderDate.getHours()} ${reminderDate.getDate()} ${reminderDate.getMonth() + 1} *`;

    const job = cron.schedule(cronExpression, async () => {
        await sendReminder(task, user);
        cancelTaskReminder(task.id);
    });

    activeJobs.set(task.id.toString(), job);
    console.log(`📅 Scheduled reminder for task "${task.title}" at ${reminderDate.toISOString()}`);
};

/**
 * Cancel a task's reminder
 * @param {string} taskId - Task ID
 */
const cancelTaskReminder = (taskId) => {
    const jobId = taskId.toString();

    if (activeJobs.has(jobId)) {
        const job = activeJobs.get(jobId);
        job.stop();
        activeJobs.delete(jobId);
        console.log(`🚫 Cancelled reminder for task ${taskId}`);
    }
};

/**
 * Reschedule reminder when task is updated
 * @param {Object} task - Updated task object
 * @param {Object} user - User object
 */
const rescheduleTaskReminder = (task, user) => {
    // Reset reminder sent flag if task is updated
    if (task.reminderSent) {
        task.reminderSent = false;
    }

    scheduleTaskReminder(task, user);
};

/**
 * Get pending reminders count
 * @returns {number} - Number of active scheduled reminders
 */
const getPendingRemindersCount = () => {
    return activeJobs.size;
};

/**
 * Stop all reminder jobs (for graceful shutdown)
 */
const stopAllReminders = () => {
    for (const [id, job] of activeJobs) {
        job.stop();
    }
    activeJobs.clear();
    console.log('🛑 All reminder jobs stopped');
};

module.exports = {
    initReminderService,
    checkDueTasks,
    sendReminder,
    scheduleTaskReminder,
    cancelTaskReminder,
    rescheduleTaskReminder,
    getPendingRemindersCount,
    stopAllReminders
};

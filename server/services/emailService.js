const nodemailer = require('nodemailer');

/**
 * Email Service
 * Handles sending emails for reminders and notifications
 */

// Create transporter based on environment
const createTransporter = () => {
    // Check if email is configured
    if (!process.env.SMTP_HOST || !process.env.SMTP_USER) {
        console.warn('⚠️ Email service not configured. Email reminders will be disabled.');
        return null;
    }

    return nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: parseInt(process.env.SMTP_PORT || '587'),
        secure: process.env.SMTP_PORT === '465', // true for 465, false for other ports
        auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS
        }
    });
};

const transporter = createTransporter();

/**
 * Send task reminder email
 * @param {Object} user - User object with email and name
 * @param {Object} task - Task object with details
 * @returns {Promise<boolean>} - Success status
 */
const sendTaskReminder = async (user, task) => {
    if (!transporter) {
        console.log(`📧 Email skipped (not configured): Task reminder for "${task.title}"`);
        return false;
    }

    try {
        const formattedDate = new Date(task.dueDate).toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });

        const mailOptions = {
            from: `"Task Scheduler" <${process.env.SMTP_USER}>`,
            to: user.email,
            subject: `⏰ Reminder: ${task.title}`,
            html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Task Reminder</title>
        </head>
        <body style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f5fbf7; margin: 0; padding: 20px;">
          <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); overflow: hidden;">
            
            <!-- Header -->
            <div style="background: linear-gradient(135deg, #A8E6CF 0%, #6BCB77 100%); padding: 30px; text-align: center;">
              <h1 style="color: #1b4332; margin: 0; font-size: 24px;">⏰ Task Reminder</h1>
            </div>
            
            <!-- Content -->
            <div style="padding: 30px;">
              <p style="color: #40916c; font-size: 16px; margin-bottom: 20px;">
                Hi ${user.name},
              </p>
              <p style="color: #1b4332; font-size: 16px; margin-bottom: 20px;">
                This is a friendly reminder about your upcoming task:
              </p>
              
              <!-- Task Card -->
              <div style="background-color: #f5fbf7; border-radius: 8px; padding: 20px; margin-bottom: 20px; border-left: 4px solid ${getPriorityColor(task.priority)};">
                <h2 style="color: #1b4332; margin: 0 0 15px 0; font-size: 20px;">${task.title}</h2>
                ${task.description ? `<p style="color: #40916c; margin: 0 0 15px 0;">${task.description}</p>` : ''}
                <div style="display: flex; flex-wrap: wrap; gap: 15px;">
                  <div style="display: flex; align-items: center;">
                    <span style="margin-right: 5px;">📅</span>
                    <span style="color: #1b4332;">${formattedDate}</span>
                  </div>
                  <div style="display: flex; align-items: center;">
                    <span style="margin-right: 5px;">🕐</span>
                    <span style="color: #1b4332;">${task.time}</span>
                  </div>
                  <div style="display: flex; align-items: center;">
                    <span style="margin-right: 5px;">${getPriorityEmoji(task.priority)}</span>
                    <span style="color: ${getPriorityColor(task.priority)}; text-transform: capitalize;">${task.priority} priority</span>
                  </div>
                </div>
              </div>
              
              <p style="color: #74c69d; font-size: 14px; margin-top: 20px;">
                Stay productive! 🌱
              </p>
            </div>
            
            <!-- Footer -->
            <div style="background-color: #f5fbf7; padding: 20px; text-align: center; border-top: 1px solid #e8f5e9;">
              <p style="color: #74c69d; font-size: 12px; margin: 0;">
                This is an automated reminder from Task Scheduler.
              </p>
            </div>
          </div>
        </body>
        </html>
      `
        };

        await transporter.sendMail(mailOptions);
        console.log(`📧 Email sent: Task reminder for "${task.title}" to ${user.email}`);
        return true;
    } catch (error) {
        console.error('❌ Email sending error:', error.message);
        return false;
    }
};

/**
 * Send welcome email to new users
 * @param {Object} user - User object with email and name
 * @returns {Promise<boolean>} - Success status
 */
const sendWelcomeEmail = async (user) => {
    if (!transporter) {
        return false;
    }

    try {
        const mailOptions = {
            from: `"Task Scheduler" <${process.env.SMTP_USER}>`,
            to: user.email,
            subject: '🌱 Welcome to Task Scheduler!',
            html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Welcome</title>
        </head>
        <body style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f5fbf7; margin: 0; padding: 20px;">
          <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); overflow: hidden;">
            
            <!-- Header -->
            <div style="background: linear-gradient(135deg, #A8E6CF 0%, #6BCB77 100%); padding: 40px; text-align: center;">
              <h1 style="color: #1b4332; margin: 0; font-size: 28px;">🌱 Welcome!</h1>
            </div>
            
            <!-- Content -->
            <div style="padding: 30px;">
              <p style="color: #40916c; font-size: 16px; margin-bottom: 20px;">
                Hi ${user.name},
              </p>
              <p style="color: #1b4332; font-size: 16px; margin-bottom: 20px;">
                Welcome to Task Scheduler! We're excited to help you stay organized and productive.
              </p>
              <p style="color: #1b4332; font-size: 16px; margin-bottom: 20px;">
                Here's what you can do:
              </p>
              <ul style="color: #40916c; font-size: 16px; margin-bottom: 20px;">
                <li>✅ Create and manage tasks</li>
                <li>📅 View your schedule in calendar</li>
                <li>🔔 Set reminders for important tasks</li>
                <li>📊 Track your productivity</li>
              </ul>
              <p style="color: #74c69d; font-size: 14px; margin-top: 20px;">
                Let's get productive together! 🚀
              </p>
            </div>
            
            <!-- Footer -->
            <div style="background-color: #f5fbf7; padding: 20px; text-align: center; border-top: 1px solid #e8f5e9;">
              <p style="color: #74c69d; font-size: 12px; margin: 0;">
                Task Scheduler - Your productivity companion
              </p>
            </div>
          </div>
        </body>
        </html>
      `
        };

        await transporter.sendMail(mailOptions);
        console.log(`📧 Welcome email sent to ${user.email}`);
        return true;
    } catch (error) {
        console.error('❌ Welcome email error:', error.message);
        return false;
    }
};

/**
 * Get priority color for email
 * @param {string} priority - Task priority
 * @returns {string} - Color hex code
 */
function getPriorityColor(priority) {
    const colors = {
        low: '#A8E6CF',
        medium: '#FFD93D',
        high: '#FF6B6B'
    };
    return colors[priority] || colors.medium;
}

/**
 * Get priority emoji for email
 * @param {string} priority - Task priority
 * @returns {string} - Emoji
 */
function getPriorityEmoji(priority) {
    const emojis = {
        low: '🟢',
        medium: '🟡',
        high: '🔴'
    };
    return emojis[priority] || emojis.medium;
}

/**
 * Verify email configuration
 * @returns {Promise<boolean>} - Configuration status
 */
const verifyEmailConfig = async () => {
    if (!transporter) {
        return false;
    }

    try {
        await transporter.verify();
        console.log('✅ Email service configured and ready');
        return true;
    } catch (error) {
        console.error('❌ Email configuration error:', error.message);
        return false;
    }
};

module.exports = {
    sendTaskReminder,
    sendWelcomeEmail,
    verifyEmailConfig
};

const nodemailer = require('nodemailer');

/**
 * Email Service
 * Handles sending emails for reminders and notifications
 */

// Create transporter based on environment
// Function: createTransporter
// Triggered by: Module load (once) to build the nodemailer transport for the app
// Purpose: Create a nodemailer transporter from SMTP env vars, or null if email is not configured
// Input: process.env SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS
// Database: None
// Output: nodemailer Transport object or null (email features then disabled)
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

// Function: sendTaskReminder
// Triggered by: reminderService.sendReminder (cron job every minute) when a due task is in the reminder window
// Purpose: Email the user a styled reminder about an upcoming task
// Input: user (with email/name), task (with title, description, dueDate, time, priority)
// Database: None (reads task/user data passed by caller)
// Output: Promise<boolean> - true if email sent, false if skipped/failed
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

// Function: sendWelcomeEmail
// Triggered by: No current caller (exported but not invoked anywhere; register does not call it)
// Purpose: Send a welcome email to newly registered users
// Input: user (with email, name)
// Database: None
// Output: Promise<boolean> - true if sent, false otherwise
// NOTE: Unused service function - no backend flow triggers this email
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
// Function: getPriorityColor
// Triggered by: sendTaskReminder (internal helper) while building the reminder email
// Purpose: Map a task priority to its theme color hex code
// Input: priority ('low' | 'medium' | 'high')
// Database: None
// Output: Color hex string (defaults to medium color)
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
// Function: getPriorityEmoji
// Triggered by: sendTaskReminder (internal helper) while building the reminder email
// Purpose: Map a task priority to a display emoji
// Input: priority ('low' | 'medium' | 'high')
// Database: None
// Output: Emoji string (defaults to medium emoji)
function getPriorityEmoji(priority) {
    const emojis = {
        low: '🟢',
        medium: '🟡',
        high: '🔴'
    };
    return emojis[priority] || emojis.medium;
}

// Function: sendPasswordResetEmail
// Triggered by: authController.forgotPassword (POST /api/auth/forgot-password)
// Purpose: Email the user a password reset link containing a one-time token
// Input: user (with email, name), resetUrl (frontend reset link with token)
// Database: None (token already stored by the controller)
// Output: Promise<boolean> - true if sent, false if skipped/failed; logs reset URL in dev when SMTP unset
/**
 * Send password reset email
 * @param {Object} user - User object with email and name
 * @param {string} resetUrl - Password reset URL
 * @returns {Promise<boolean>} - Success status
 */
const sendPasswordResetEmail = async (user, resetUrl) => {
    if (!transporter) {
        console.log(`📧 Email skipped (not configured): Password reset for "${user.email}"`);
        // In development, log the reset URL so it can be tested
        console.log(`🔗 Password reset URL: ${resetUrl}`);
        return false;
    }

    try {
        const mailOptions = {
            from: `"Task Scheduler" <${process.env.SMTP_USER}>`,
            to: user.email,
            subject: '🔐 Password Reset Request - Task Scheduler',
            html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Password Reset</title>
        </head>
        <body style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f5fbf7; margin: 0; padding: 20px;">
          <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); overflow: hidden;">
            
            <!-- Header -->
            <div style="background: linear-gradient(135deg, #A8E6CF 0%, #6BCB77 100%); padding: 40px; text-align: center;">
              <h1 style="color: #1b4332; margin: 0; font-size: 28px;">🔐 Password Reset</h1>
            </div>
            
            <!-- Content -->
            <div style="padding: 30px;">
              <p style="color: #40916c; font-size: 16px; margin-bottom: 20px;
                <p>Hi ${user.name},</p>
              </p>
              <p style="color: #1b4332; font-size: 16px; margin-bottom: 20px;
                <p>We received a request to reset your password. Click the button below to create a new password:</p>
              </p>
              
              <!-- Reset Button -->
              <div style="text-align: center; margin: 30px 0;">
                <a href="${resetUrl}" style="display: inline-block; background: linear-gradient(135deg, #A8E6CF 0%, #6BCB77 100%); color: #1b4332; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px;">
                  Reset Password
                </a>
              </div>
              
              <!-- Warning -->
              <div style="background-color: #FFF3CD; border-left: 4px solid #FFD93D; padding: 15px; margin: 20px 0; border-radius: 4px;">
                <p style="color: #856404; margin: 0; font-size: 14px;">
                  <strong>⚠️ Important:</strong> This link will expire in 15 minutes. If you didn't request a password reset, please ignore this email.
                </p>
              </div>
              
              <!-- Direct Link -->
              <p style="color: #74c69d; font-size: 12px; margin-top: 20px;">
                If the button doesn't work, copy and paste this link into your browser:<br>
                <a href="${resetUrl}" style="color: #6BCB77;">${resetUrl}</a>
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
        console.log(`📧 Password reset email sent to ${user.email}`);
        return true;
    } catch (error) {
        console.error('❌ Password reset email error:', error.message);
        return false;
    }
};

/**
 * Verify email configuration
 * @returns {Promise<boolean>} - Configuration status
 */
// Function: verifyEmailConfig
// Triggered by: server.js startServer during startup (verifyEmailConfig())
// Purpose: Validate the SMTP transporter connection at boot time
// Input: None (reads module-level transporter)
// Database: None
// Output: Promise<boolean> - true if transporter verifies, false if not configured or connection fails
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
    sendPasswordResetEmail,
    verifyEmailConfig
};

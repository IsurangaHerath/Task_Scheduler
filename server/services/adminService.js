const bcrypt = require('bcryptjs');
const { db } = require('../config/db');
const User = require('../models/User');

const DEFAULT_ADMIN_EMAIL = 'admin@taskflow.com';
const DEFAULT_ADMIN_PASSWORD = 'admin123';

/**
 * Create default admin account if no admin exists
 */
const createDefaultAdmin = async () => {
    try {
        // Check if any admin exists
        const adminExists = db.prepare(
            "SELECT COUNT(*) as count FROM users WHERE role = 'admin'"
        ).get().count;
        
        if (adminExists > 0) {
            console.log('✅ Admin account already exists');
            return;
        }
        
        // Check if default admin email already exists as regular user
        const existingUser = User.findByEmail(DEFAULT_ADMIN_EMAIL);
        
        if (existingUser) {
            // Upgrade to admin
            await User.update(existingUser.id, { role: 'admin', status: 'active' });
            console.log('✅ Existing user upgraded to admin');
            return;
        }
        
        // Create new admin account
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(DEFAULT_ADMIN_PASSWORD, salt);
        
        db.prepare(`
            INSERT INTO users (name, email, password, role, status)
            VALUES (?, ?, ?, 'admin', 'active')
        `).run('Admin', DEFAULT_ADMIN_EMAIL.toLowerCase(), hashedPassword);
        
        console.log('✅ Default admin account created');
        console.log(`   Email: ${DEFAULT_ADMIN_EMAIL}`);
        console.log(`   Password: ${DEFAULT_ADMIN_PASSWORD}`);
        console.log('   ⚠️  Please change the default password after first login!');
        
    } catch (error) {
        console.error('❌ Error creating default admin:', error.message);
    }
};

module.exports = { createDefaultAdmin };

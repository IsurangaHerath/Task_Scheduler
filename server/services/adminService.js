const bcrypt = require('bcryptjs');
const { pool } = require('../config/db');
const User = require('../models/User');

const DEFAULT_ADMIN_EMAIL = 'admin@taskflow.com';
const DEFAULT_ADMIN_PASSWORD = 'admin123';

const createDefaultAdmin = async () => {
    try {
        const result = await pool.query("SELECT COUNT(*) as count FROM users WHERE role = 'admin'");
        const adminExists = parseInt(result.rows[0].count);

        if (adminExists > 0) {
            console.log('✅ Admin account already exists');
            return;
        }

        const existingUser = await User.findByEmail(DEFAULT_ADMIN_EMAIL);

        if (existingUser) {
            await User.update(existingUser.id, { role: 'admin', status: 'active' });
            console.log('✅ Existing user upgraded to admin');
            return;
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(DEFAULT_ADMIN_PASSWORD, salt);

        await pool.query(
            `INSERT INTO users (name, email, password, role, status)
             VALUES ($1, $2, $3, 'admin', 'active')`,
            ['Admin', DEFAULT_ADMIN_EMAIL.toLowerCase(), hashedPassword]
        );

        console.log('✅ Default admin account created');
        console.log(`   Email: ${DEFAULT_ADMIN_EMAIL}`);
        console.log(`   Password: ${DEFAULT_ADMIN_PASSWORD}`);
        console.log('   ⚠️  Please change the default password after first login!');

    } catch (error) {
        console.error('❌ Error creating default admin:', error.message);
    }
};

module.exports = { createDefaultAdmin };

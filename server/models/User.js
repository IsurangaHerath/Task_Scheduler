const bcrypt = require('bcryptjs');
const { db } = require('../config/db');

/**
 * User Model for SQLite
 * Provides Mongoose-like interface for user operations
 */
class User {
    /**
     * Create a new user
     * @param {Object} userData - User data
     * @returns {Object} Created user
     */
    static async create(userData) {
        const { name, email, password } = userData;
        
        // Hash password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);
        
        const stmt = db.prepare(`
            INSERT INTO users (name, email, password)
            VALUES (?, ?, ?)
        `);
        
        const result = stmt.run(name, email.toLowerCase(), hashedPassword);
        return this.findById(result.lastInsertRowid);
    }

    /**
     * Find user by ID
     * @param {number} id - User ID
     * @returns {Object|null} User object
     */
    static findById(id) {
        const stmt = db.prepare('SELECT * FROM users WHERE id = ?');
        const user = stmt.get(id);
        if (user) {
            return this._parseUser(user);
        }
        return null;
    }

    /**
     * Find user by ID with password (for password operations)
     * @param {number} id - User ID
     * @returns {Object|null} User object with password
     */
    static findByIdWithPassword(id) {
        const stmt = db.prepare('SELECT * FROM users WHERE id = ?');
        const user = stmt.get(id);
        if (user) {
            return this._parseUser(user, true);
        }
        return null;
    }

    /**
     * Find user by email
     * @param {string} email - User email
     * @returns {Object|null} User object
     */
    static findByEmail(email) {
        const stmt = db.prepare('SELECT * FROM users WHERE email = ?');
        const user = stmt.get(email.toLowerCase());
        if (user) {
            return this._parseUser(user);
        }
        return null;
    }

    /**
     * Find user by email with password (for login)
     * @param {string} email - User email
     * @returns {Object|null} User object with password
     */
    static findByEmailWithPassword(email) {
        const stmt = db.prepare('SELECT * FROM users WHERE email = ?');
        const user = stmt.get(email.toLowerCase());
        if (user) {
            return this._parseUser(user, true);
        }
        return null;
    }

    /**
     * Update user
     * @param {number} id - User ID
     * @param {Object} updateData - Data to update
     * @returns {Object|null} Updated user
     */
    static async update(id, updateData) {
        const allowedFields = ['name', 'email', 'avatar', 'settings'];
        const updates = [];
        const values = [];

        for (const field of allowedFields) {
            if (updateData[field] !== undefined) {
                if (field === 'settings') {
                    updates.push(`${field} = ?`);
                    values.push(JSON.stringify(updateData[field]));
                } else {
                    updates.push(`${field} = ?`);
                    values.push(field === 'email' ? updateData[field].toLowerCase() : updateData[field]);
                }
            }
        }

        if (updates.length === 0) return this.findById(id);

        updates.push(`updatedAt = datetime('now')`);
        values.push(id);

        const stmt = db.prepare(`
            UPDATE users SET ${updates.join(', ')} WHERE id = ?
        `);
        
        stmt.run(...values);
        return this.findById(id);
    }

    /**
     * Update password
     * @param {number} id - User ID
     * @param {string} newPassword - New password
     * @returns {boolean} Success
     */
    static async updatePassword(id, newPassword) {
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(newPassword, salt);
        
        const stmt = db.prepare(`
            UPDATE users SET password = ?, updatedAt = datetime('now') WHERE id = ?
        `);
        
        stmt.run(hashedPassword, id);
        return true;
    }

    /**
     * Compare password
     * @param {string} candidatePassword - Candidate password
     * @param {string} hashedPassword - Hashed password
     * @returns {boolean} Match result
     */
    static async comparePassword(candidatePassword, hashedPassword) {
        return await bcrypt.compare(candidatePassword, hashedPassword);
    }

    /**
     * Delete user
     * @param {number} id - User ID
     * @returns {boolean} Success
     */
    static delete(id) {
        const stmt = db.prepare('DELETE FROM users WHERE id = ?');
        const result = stmt.run(id);
        return result.changes > 0;
    }

    /**
     * Parse user object and convert settings JSON
     * @private
     */
    static _parseUser(user, includePassword = false) {
        const parsed = { ...user };
        
        // Parse settings JSON
        if (parsed.settings) {
            try {
                parsed.settings = JSON.parse(parsed.settings);
            } catch (e) {
                parsed.settings = {
                    notifications: { email: true, browser: true },
                    theme: 'light',
                    reminderTime: 15
                };
            }
        }

        // Remove password if not requested
        if (!includePassword) {
            delete parsed.password;
        }

        // Convert to Mongoose-like format
        return parsed;
    }
}

module.exports = User;

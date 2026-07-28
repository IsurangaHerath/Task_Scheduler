const bcrypt = require('bcryptjs');
const { pool } = require('../config/db');

class User {
  static async create(userData) {
    const { name, email, password, role, status, settings } = userData;
    
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    
    const defaultSettings = '{"notifications":{"email":true,"browser":true},"theme":"light","reminderTime":15}';
    
    const result = await pool.query(
      `INSERT INTO users (name, email, password, role, status, settings) 
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [name, email.toLowerCase(), hashedPassword, role || 'user', status || 'active', settings || defaultSettings]
    );
    
    return this._parseUser(result.rows[0]);
  }

  static async findById(id) {
    const result = await pool.query('SELECT * FROM users WHERE id = $1', [id]);
    if (result.rows.length) {
      return this._parseUser(result.rows[0]);
    }
    return null;
  }

  static async findByIdWithPassword(id) {
    const result = await pool.query('SELECT * FROM users WHERE id = $1', [id]);
    if (result.rows.length) {
      return this._parseUser(result.rows[0], true);
    }
    return null;
  }

  static async findByEmail(email) {
    const result = await pool.query('SELECT * FROM users WHERE email = $1', [email.toLowerCase()]);
    if (result.rows.length) {
      return this._parseUser(result.rows[0]);
    }
    return null;
  }

  static async findByEmailWithPassword(email) {
    const result = await pool.query('SELECT * FROM users WHERE email = $1', [email.toLowerCase()]);
    if (result.rows.length) {
      return this._parseUser(result.rows[0], true);
    }
    return null;
  }

  static async update(id, updateData) {
    const allowedFields = ['name', 'email', 'avatar', 'settings', 'role', 'status'];
    const updates = [];
    const values = [];
    let valueIndex = 1;

    for (const field of allowedFields) {
      if (updateData[field] !== undefined) {
        if (field === 'settings') {
          updates.push(`"${field}" = $${valueIndex}`);
          values.push(JSON.stringify(updateData[field]));
        } else {
          updates.push(`${field} = $${valueIndex}`);
          values.push(field === 'email' ? updateData[field].toLowerCase() : updateData[field]);
        }
        valueIndex++;
      }
    }

    if (updates.length === 0) return this.findById(id);

    updates.push(`"updatedAt" = CURRENT_TIMESTAMP`);
    values.push(id);

    const result = await pool.query(
      `UPDATE users SET ${updates.join(', ')} WHERE id = $${valueIndex} RETURNING *`,
      values
    );
    
    return this._parseUser(result.rows[0]);
  }

  static async updatePassword(id, newPassword) {
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);
    
    await pool.query(
      'UPDATE users SET password = $1, "updatedAt" = CURRENT_TIMESTAMP WHERE id = $2',
      [hashedPassword, id]
    );
    return true;
  }

  static async comparePassword(candidatePassword, hashedPassword) {
    return await bcrypt.compare(candidatePassword, hashedPassword);
  }

  static async delete(id) {
    const result = await pool.query('DELETE FROM users WHERE id = $1', [id]);
    return result.rowCount > 0;
  }

  static _parseUser(user, includePassword = false) {
    const parsed = { ...user };
    
    if (parsed.settings && typeof parsed.settings === 'string') {
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

    if (!includePassword) {
      delete parsed.password;
    }

    return parsed;
  }
}

module.exports = User;
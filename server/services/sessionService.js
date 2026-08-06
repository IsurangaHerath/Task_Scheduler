const { pool } = require('../config/db');

const activeSessions = new Map();

// Function: trackSession
// Triggered by: authController.login (after successful login, with the generated JWT)
// Purpose: Record a user's active session in the in-memory map for admin session management
// Input: userId, token, expiresAt (JWT exp as ISO string)
// Database: None (in-memory Map)
// Output: None
const trackSession = (userId, token, expiresAt) => {
    activeSessions.set(userId, {
        userId,
        token,
        expiresAt,
        lastActive: new Date().toISOString()
    });
};

// Function: removeSession
// Triggered by: authController.logout (POST /api/auth/logout)
// Purpose: Remove a user's session when they log out
// Input: userId
// Database: None (in-memory Map)
// Output: None
const removeSession = (userId) => {
    activeSessions.delete(userId);
};

// Function: getActiveSessions
// Triggered by: adminController.getActiveSessions (GET /api/admin/sessions, from AdminSessions.jsx)
// Purpose: Return all unexpired active sessions joined with user details
// Input: None
// Database: SELECTs user info (id, name, email, role) from users for each active session
// Output: Array of { userId, token, expiresAt, lastActive, user }
const getActiveSessions = async () => {
    const sessions = [];
    const now = new Date();

    for (const [userId, session] of activeSessions) {
        if (new Date(session.expiresAt) > now) {
            const result = await pool.query(
                'SELECT id, name, email, role FROM users WHERE id = $1',
                [userId]
            );
            const user = result.rows[0] || null;

            sessions.push({
                ...session,
                user
            });
        }
    }

    return sessions;
};

// Function: forceLogoutUser
// Triggered by: adminController.forceLogoutUser (DELETE /api/admin/sessions/:userId, from AdminSessions.jsx)
// Purpose: Terminate a user's active session server-side
// Input: userId
// Database: None (in-memory Map)
// Output: boolean - true if the session existed and was removed, false otherwise
const forceLogoutUser = (userId) => {
    const existed = activeSessions.has(userId);
    activeSessions.delete(userId);
    return existed;
};

// Function: isUserLoggedIn
// Triggered by: No current caller (exported but never invoked)
// Purpose: Check whether a user has an active, unexpired session
// Input: userId
// Database: None (in-memory Map)
// Output: boolean
// NOTE: Unused service function - no backend flow triggers this
const isUserLoggedIn = (userId) => {
    const session = activeSessions.get(userId);
    if (!session) return false;
    return new Date(session.expiresAt) > new Date();
};

// Function: updateLastActive
// Triggered by: No current caller (exported but never invoked)
// Purpose: Refresh the lastActive timestamp of a user's session
// Input: userId
// Database: None (in-memory Map)
// Output: None
// NOTE: Unused service function - no backend flow triggers this
const updateLastActive = (userId) => {
    const session = activeSessions.get(userId);
    if (session) {
        session.lastActive = new Date().toISOString();
    }
};

module.exports = {
    trackSession,
    removeSession,
    getActiveSessions,
    forceLogoutUser,
    isUserLoggedIn,
    updateLastActive
};

const { db } = require('../config/db');

// In-memory session store
const activeSessions = new Map();

/**
 * Track a user login session
 */
const trackSession = (userId, token, expiresAt) => {
    activeSessions.set(userId, {
        userId,
        token,
        expiresAt,
        lastActive: new Date().toISOString()
    });
};

/**
 * Remove a user session (logout)
 */
const removeSession = (userId) => {
    activeSessions.delete(userId);
};

/**
 * Get all active sessions with user info
 */
const getActiveSessions = () => {
    const sessions = [];
    const now = new Date();
    
    for (const [userId, session] of activeSessions) {
        if (new Date(session.expiresAt) > now) {
            // Get user basic info
            const user = db.prepare(`
                SELECT id, name, email, role FROM users WHERE id = ?
            `).get(userId);
            
            sessions.push({
                ...session,
                user: user || null
            });
        }
    }
    
    return sessions;
};

/**
 * Force logout a specific user (admin action)
 */
const forceLogoutUser = (userId) => {
    const existed = activeSessions.has(userId);
    activeSessions.delete(userId);
    return existed;
};

/**
 * Check if user has active session
 */
const isUserLoggedIn = (userId) => {
    const session = activeSessions.get(userId);
    if (!session) return false;
    return new Date(session.expiresAt) > new Date();
};

/**
 * Update last active time for a user
 */
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

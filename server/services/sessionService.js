const { pool } = require('../config/db');

const activeSessions = new Map();

const trackSession = (userId, token, expiresAt) => {
    activeSessions.set(userId, {
        userId,
        token,
        expiresAt,
        lastActive: new Date().toISOString()
    });
};

const removeSession = (userId) => {
    activeSessions.delete(userId);
};

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

const forceLogoutUser = (userId) => {
    const existed = activeSessions.has(userId);
    activeSessions.delete(userId);
    return existed;
};

const isUserLoggedIn = (userId) => {
    const session = activeSessions.get(userId);
    if (!session) return false;
    return new Date(session.expiresAt) > new Date();
};

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

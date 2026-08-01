const bcrypt = require('bcryptjs');
const crypto = require('crypto');

function hashPassword(password) {
  return bcrypt.hashSync(password, 10);
}

function verifyPassword(password, hash) {
  return bcrypt.compareSync(password, hash);
}

function generateToken() {
  return crypto.randomBytes(32).toString('hex');
}

function requireAuth(db) {
  return (req, res, next) => {
    const header = req.get('authorization') || '';
    const token = header.startsWith('Bearer ') ? header.slice(7) : null;
    if (!token) return res.status(401).json({ error: 'Not authenticated' });

    const session = db.prepare('SELECT user_id FROM sessions WHERE token = ?').get(token);
    if (!session) return res.status(401).json({ error: 'Not authenticated' });

    req.userId = session.user_id;
    next();
  };
}

module.exports = { hashPassword, verifyPassword, generateToken, requireAuth };

const jwt = require('jsonwebtoken')
const User = require('../models/User')

async function authenticateRequest(req, res, next) {
  try {
    const header = req.headers.authorization

    if (!header || !header.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'Authentication required.' })
    }

    const token = header.slice(7)
    const secret = process.env.JWT_SECRET

    if (!secret) {
      return res.status(500).json({ message: 'JWT_SECRET is missing from the environment.' })
    }

    const payload = jwt.verify(token, secret)
    const user = await User.findById(payload.userId)

    if (!user) {
      return res.status(401).json({ message: 'Invalid token.' })
    }

    req.user = user
    return next()
  } catch (error) {
    return res.status(401).json({ message: 'Authentication failed.' })
  }
}

function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ message: 'You do not have access to this resource.' })
    }

    return next()
  }
}

module.exports = {
  authenticateRequest,
  requireRole,
}

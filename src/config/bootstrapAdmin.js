const bcrypt = require('bcryptjs')
const User = require('../models/User')

async function bootstrapAdmin() {
  const adminEmail = process.env.ADMIN_EMAIL
  const adminPassword = process.env.ADMIN_PASSWORD
  const adminName = process.env.ADMIN_NAME || 'Admin'

  if (!adminEmail || !adminPassword) {
    return
  }

  const existingAdmin = await User.findOne({ email: adminEmail.toLowerCase() })

  if (existingAdmin) {
    if (existingAdmin.role !== 'admin') {
      existingAdmin.role = 'admin'
      await existingAdmin.save()
    }

    return
  }

  const hashedPassword = await bcrypt.hash(adminPassword, 10)

  await User.create({
    name: adminName,
    email: adminEmail.toLowerCase(),
    password: hashedPassword,
    role: 'admin',
  })
}

module.exports = bootstrapAdmin

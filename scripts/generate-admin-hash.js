#!/usr/bin/env node
// Run: node scripts/generate-admin-hash.js yourpassword
const bcrypt = require('bcryptjs')

const password = process.argv[2]
if (!password) {
  console.error('Usage: node scripts/generate-admin-hash.js <password>')
  process.exit(1)
}

bcrypt.hash(password, 12).then((hash) => {
  console.log('\nAdd this to your .env.local:\n')
  console.log(`ADMIN_PASSWORD_HASH=${hash}`)
  console.log('\nKeep this hash secret and never commit it to git.')
})

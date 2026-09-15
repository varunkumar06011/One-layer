// Generates an Argon2id hash for ADMIN_PASSWORD_HASH.
// Usage: npm run hash-password -- 'your-strong-password'
import { hashPassword } from '../security/adminCredentials.js'

const password = process.argv[2]
if (!password || password.length < 12) {
  console.error('Provide a password of at least 12 characters:\n  npm run hash-password -- \'…\'')
  process.exit(1)
}

console.log(await hashPassword(password))

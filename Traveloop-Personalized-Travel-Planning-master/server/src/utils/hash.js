const bcrypt = require('bcryptjs');

const SALT_ROUNDS = 12; // guideline requirement

/**
 * Hash a plain-text password.
 * Salt rounds 12 — computationally heavy enough to resist brute-force
 * while still completing in ~300ms on modern hardware.
 */
const hashPassword = (plain) => bcrypt.hash(plain, SALT_ROUNDS);

/**
 * Compare a plain-text password against a stored hash.
 */
const comparePassword = (plain, hash) => bcrypt.compare(plain, hash);

module.exports = { hashPassword, comparePassword };

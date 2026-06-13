import { authenticate } from './auth.js';
import { requireRole } from './requireRole.js';

export const requireAuth = authenticate;
export { requireRole };

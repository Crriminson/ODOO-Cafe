import {
  getCurrentOpenSession,
  openSession as dbOpenSession,
  closeSession as dbCloseSession,
  getLastClosedSession,
} from '../db/queries/sessions.queries.js';

/**
 * GET /sessions/current
 * Returns the current open session or null.
 */
export const getCurrentSession = async (req, res, next) => {
  try {
    const employeeId = req.user.userId || req.user.id;
    const session = await getCurrentOpenSession(employeeId);
    return res.status(200).json({ session });
  } catch (err) {
    next(err);
  }
};

/**
 * POST /sessions/open
 * Opens a new session for the current employee.
 */
export const openSession = async (req, res, next) => {
  try {
    const employeeId = req.user.userId || req.user.id;

    // Pre-emptively check if a session is already open
    const activeSession = await getCurrentOpenSession(employeeId);
    if (activeSession) {
      return res.status(409).json({
        error: {
          message: 'Session already open',
          code: 'SESSION_ALREADY_OPEN',
        },
      });
    }

    try {
      const session = await dbOpenSession(employeeId);
      return res.status(201).json({ session });
    } catch (dbErr) {
      // Catch PostgreSQL unique constraint violation (code 23505)
      if (dbErr.code === '23505') {
        return res.status(409).json({
          error: {
            message: 'Session already open',
            code: 'SESSION_ALREADY_OPEN',
          },
        });
      }
      throw dbErr;
    }
  } catch (err) {
    next(err);
  }
};

/**
 * POST /sessions/close
 * Closes the currently open session.
 */
export const closeSession = async (req, res, next) => {
  try {
    const employeeId = req.user.userId || req.user.id;

    // Check if there is an active session
    const activeSession = await getCurrentOpenSession(employeeId);
    if (!activeSession) {
      return res.status(404).json({
        error: {
          message: 'No open session',
          code: 'NO_OPEN_SESSION',
        },
      });
    }

    const closedSession = await dbCloseSession(activeSession.id);
    if (!closedSession) {
      return res.status(404).json({
        error: {
          message: 'No open session',
          code: 'NO_OPEN_SESSION',
        },
      });
    }

    return res.status(200).json({ session: closedSession });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /sessions/last-closed
 * Returns the last closed session or null.
 */
export const getLastClosed = async (req, res, next) => {
  try {
    const employeeId = req.user.userId || req.user.id;
    const session = await getLastClosedSession(employeeId);
    return res.status(200).json({ session });
  } catch (err) {
    next(err);
  }
};

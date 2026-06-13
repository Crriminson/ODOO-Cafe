import { Server } from 'socket.io';
import { env } from '../config/env.js';

/** @type {import('socket.io').Server | null} */
let io = null;

/**
 * Attach Socket.IO to the existing HTTP server.
 * Call this ONCE from server.js before httpServer.listen().
 *
 * @param {import('http').Server} httpServer
 * @returns {import('socket.io').Server}
 */
export const initSocket = (httpServer) => {
  io = new Server(httpServer, {
    cors: {
      origin:  env.CLIENT_URL,
      methods: ['GET', 'POST'],
    },
  });

  io.on('connection', (socket) => {
    console.log(`[socket] connected    ${socket.id}`);

    socket.on('disconnect', (reason) => {
      console.log(`[socket] disconnected  ${socket.id}  (${reason})`);
    });
  });

  console.log('[socket] Socket.IO initialized');
  return io;
};

/**
 * Returns the initialized Socket.IO instance.
 * Throws if called before initSocket().
 *
 * @returns {import('socket.io').Server}
 */
export const getIO = () => {
  if (!io) throw new Error('Socket.IO not initialized — call initSocket(httpServer) first');
  return io;
};

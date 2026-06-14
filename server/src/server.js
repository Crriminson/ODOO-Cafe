import { createServer } from 'http';
import app              from './app.js';
import { initSocket }   from './websocket/index.js';
import { env }          from './config/env.js';


const httpServer = createServer(app);

// Attach Socket.IO before listen so upgrade requests are handled
initSocket(httpServer);

httpServer.listen(env.PORT, () => {
  console.log(`[server] Running on http://localhost:${env.PORT}  (${env.NODE_ENV})`);
});

const { createServer } = require('http');
const { parse } = require('url');
const next = require('next');
const { Server } = require('socket.io');

const dev = process.env.NODE_ENV !== 'production';
const app = next({ dev });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  const server = createServer((req, res) => {
    const parsedUrl = parse(req.url, true);
    handle(req, res, parsedUrl);
  });

  const io = new Server(server, {
    cors: { origin: '*', methods: ['GET', 'POST'] },
  });

  globalThis.__io = io;

  io.on('connection', (socket) => {
    console.log('Client connected:', socket.id);

    socket.on('join-role', (role) => {
      socket.join(role);
      console.log(`Socket ${socket.id} joined: ${role}`);
    });

    socket.on('join-order', (orderId) => {
      socket.join(`order-${orderId}`);
      console.log(`Socket ${socket.id} joined order-${orderId}`);
    });

    socket.on('disconnect', () => {
      console.log('Client disconnected:', socket.id);
    });
  });

  const port = parseInt(process.env.PORT || '3000', 10);
  server.listen(port, () => {
    console.log(`> Ready on http://localhost:${port}`);
  });
});

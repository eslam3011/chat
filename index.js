const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http);
const PORT = 3000;

app.use(express.static('public'));

const roomStates = {};

io.on('connection', (socket) => {
  socket.on('join-room', ({ room, videoUrl }) => {
    socket.join(room);
    socket.room = room;

    if (videoUrl) {
      roomStates[room] = {
        videoUrl,
        currentTime: 0,
        isPlaying: false,
      };
    }

    const state = roomStates[room];
    if (state) {
      socket.emit('init-video', state);
    }

    socket.to(room).emit('user-joined', socket.id);
  });

  socket.on('play', (time) => {
    const room = socket.room;
    if (roomStates[room]) {
      roomStates[room].currentTime = time;
      roomStates[room].isPlaying = true;
    }
    socket.to(room).emit('play', time);
  });

  socket.on('pause', (time) => {
    const room = socket.room;
    if (roomStates[room]) {
      roomStates[room].currentTime = time;
      roomStates[room].isPlaying = false;
    }
    socket.to(room).emit('pause', time);
  });

  socket.on('seek', (time) => {
    const room = socket.room;
    if (roomStates[room]) {
      roomStates[room].currentTime = time;
    }
    socket.to(room).emit('seek', time);
  });

  // WebRTC signaling handlers:
  socket.on('start-voice', (room) => {
    socket.to(room).emit('start-voice', socket.id);
  });

  socket.on('offer', ({ to, offer }) => {
    io.to(to).emit('offer', { from: socket.id, offer });
  });

  socket.on('answer', ({ to, answer }) => {
    io.to(to).emit('answer', { from: socket.id, answer });
  });

  socket.on('ice-candidate', ({ to, candidate }) => {
    io.to(to).emit('ice-candidate', { from: socket.id, candidate });
  });
});

http.listen(PORT, () => {
  console.log(`🚀 السيرفر يعمل على http://localhost:${PORT}`);
});

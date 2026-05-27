import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import { Server } from 'socket.io';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import assignmentRoutes from './routes/assignments';
import paperRoutes from './routes/papers';

// Load env vars
dotenv.config();

const app = express();
const httpServer = createServer(app);
export const io = new Server(httpServer, {
  cors: { origin: '*' }
});

app.use(cors());
app.use(express.json());

app.use('/api/assignments', assignmentRoutes);
app.use('/api/papers', paperRoutes);

const PORT = process.env.PORT || 5000;

mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/vedaai')
  .then(() => {
    console.log('Connected to MongoDB');
    
    // Import worker only after DB connects so it can access DB properly
    require('./queue/worker');
    
    httpServer.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  })
  .catch(err => console.error('MongoDB connection error:', err));

io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);
  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

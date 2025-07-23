const express = require('express');
const http = require('http');
const cors = require('cors');
const { Server } = require('socket.io');
const mongoose = require('mongoose');

const app = express();
app.use(cors());
app.use(express.json());

const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: '*' }
});

const PORT = 3000;

// Connection to mongoose
mongoose.connect('mongodb+srv://aviv0205:zSSJpMuhz3QvW7Md@cluster0.asuumnp.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0')
  .then(() => console.log('MongoDB connected'))
  .catch((err) => console.error('Error connecting to MongoDB:', err));

// Message Model
const messageSchema = new mongoose.Schema({
  senderId: { type: String, required: true },
  receiverId: { type: String, required: true },
  content: { type: String, required: true },
  timestamp: { type: Date, default: Date.now },
  read: { type: Boolean, default: false }  
});
const Message = mongoose.model('Message', messageSchema);

// Post Model
const postSchema = new mongoose.Schema({
  userId: String,
  firstName: String,
  lastName: String,
  title: String,
  content: String,
  media: [
    {
      url: { type: String, required: true },
      type: { type: String, required: true }
    }
  ],
  stampDate: {
    type: Date,
    default: Date.now
  }
});
const Post = mongoose.model('Post', postSchema);

// Trip Model
const tripSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  points: [
    {
      pos: { type: [Number], required: true }, // [lat, lng]
      country: { type: String, required: true }
    }
  ],
  startDate: { type: String, required: true },
  endDate: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
});
const Trip = mongoose.model('Trip', tripSchema);

// Creation post
app.post("/api/posts", async (req, res) => {
  const { command, data } = req.body;

  if (!command || !data) {
    return res.status(400).json({ message: "Missing command or data" });
  }

  try {
    switch (command) {
      case 'post': {
        const newPost = new Post({
          userId: data.userId,
          firstName: data.firstName,
          lastName: data.lastName,
          title: data.title,
          content: data.content,
          media: Array.isArray(data.media) ? data.media : [],
          stampDate: data.createdAt ? new Date(data.createdAt) : new Date(),
        });

        await newPost.save();
        io.emit("stats-changed");  // UPDATE GRAFHS REALTIME
        return res.json({ message: 'Posted successfully', post: newPost.toJSON() });
      }

      case "delete": {
        const { postId } = data;
        const deleted = await Post.findByIdAndDelete(postId);
        if (!deleted) return res.status(404).json({ message: "Post not found" });
        io.emit("stats-changed");  // UPDATE GRAFHS REALTIME
        return res.json({ message: "Post deleted" });
      }

      case "update": {
        const { postId, title, content } = data;
        const post = await Post.findById(postId);
        if (!post) return res.status(404).json({ message: "Post not found" });

        post.title = title;
        post.content = content;
        await post.save();
        io.emit("stats-changed");  // UPDATE GRAFHS REALTIME
        return res.json({ message: "Post updated", post });
      }

      default:
        return res.status(400).json({ message: "Unknown command" });
    }
  } catch (err) {
    console.error("Command failed:", err);
    res.status(500).json({ message: "Command failed", error: err.message });
  }
});

// Get all posts descending order by date
app.get('/api/posts', async (req, res) => {
  try {
    const posts = await Post.find().sort({ stampDate: -1 });
    res.json({ posts });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error fetching posts', error: err.message });
  }
});

// Update posts
app.put('/api/posts/:id', async (req, res) => {
  try {
    const { title, content } = req.body;
    const postId = req.params.id;

    const updatedPost = await Post.findByIdAndUpdate(
      postId,
      { title, content },
      { new: true }
    );

    if (!updatedPost) return res.status(404).json({ message: "Post not found" });

    io.emit("stats-changed"); // UPDATE GRAFHS REALTIME
    res.json({ message: "Post updated", post: updatedPost });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to update post", error: err.message });
  }
});

// Delete Posts
app.delete('/api/posts/:id', async (req, res) => {
  try {
    const postId = req.params.id;

    const deletedPost = await Post.findByIdAndDelete(postId);

    if (!deletedPost) return res.status(404).json({ message: "Post not found" });

    io.emit("stats-changed"); // UPDATE GRAFHS REALTIME
    res.json({ message: "Post deleted" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to delete post", error: err.message });
  }
});

// Chat messages between two users
app.get('/messages/:user1/:user2', async (req, res) => {
  const { user1, user2 } = req.params;
  try {
    const messages = await Message.find({
      $or: [
        { senderId: user1, receiverId: user2 },
        { senderId: user2, receiverId: user1 }
      ]
    }).sort({ timestamp: 1 });
    res.json(messages);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// Save a new Trip
app.post('/api/trips', async (req, res) => {
  const { userId, points, startDate, endDate } = req.body;
  if (!userId || !points || points.length === 0 || !startDate || !endDate) {
    return res.status(400).json({ message: "Missing required trip data" });
  }
  try {
    const newTrip = new Trip({
      userId,
      points,
      startDate,
      endDate,
      createdAt: new Date()
    });
    await newTrip.save();
    res.status(201).json({ message: 'Trip saved successfully', trip: newTrip });
  } catch (err) {
    console.error('Error saving trip:', err);
    res.status(500).json({ message: 'Failed to save trip', error: err.message });
  }
});

// Get trip by USERID
app.get('/api/trips', async (req, res) => {
  const { userId } = req.query;
  if (!userId) return res.status(400).json({ message: 'Missing userId query param' });
  try {
    const trips = await Trip.find({ userId }).sort({ createdAt: -1 });
    res.json({ trips });
  } catch (err) {
    console.error('Error fetching trips:', err);
    res.status(500).json({ message: 'Failed to fetch trips', error: err.message });
  }
});

// Delete trip by TripID
app.delete('/api/trips/:id', async (req, res) => {
  try {
    const tripId = req.params.id;
    const deletedTrip = await Trip.findByIdAndDelete(tripId);
    if (!deletedTrip) return res.status(404).json({ message: "Trip not found" });

    res.json({ message: "Trip deleted" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to delete trip", error: err.message });
  }
});

// statistics by months
app.get('/api/statistics/posts-per-month', async (req, res) => {
  try {
    const earliest = new Date();
    earliest.setMonth(earliest.getMonth() - 11);

    const data = await Post.aggregate([
      { $match: { stampDate: { $gte: earliest } } },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m", date: "$stampDate" } },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    res.json(data);
  } catch (err) {
    res.status(500).json({ message: "Aggregate failed", error: err.message });
  }
});

// statistics top users
app.get('/api/statistics/top-users', async (req, res) => {
  try {
    const data = await Post.aggregate([
      {
        $group: {
          _id: '$userId',
          firstName: { $first: '$firstName' },
          lastName: { $first: '$lastName' },
          count: { $sum: 1 },
        },
      },
      { $sort: { count: -1 } },
      { $limit: 10 },
    ]);

    res.json(data);
  } catch (err) {
    res.status(500).json({ message: "Aggregate failed", error: err.message });
  }
});

// Marking messages as read
app.post('/messages/read', async (req, res) => {
  const { userId, otherUserId } = req.body;
  try {
    await Message.updateMany(
      { senderId: otherUserId, receiverId: userId, read: false },
      { $set: { read: true } }
    );
    res.json({ message: "Messages marked as read" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// Returns messages between user1 and user2 sorted by time
app.get('/messages/:user1/:user2', async (req, res) => {
  const { user1, user2 } = req.params;
  try {
    const messages = await Message.find({
      $or: [
        { senderId: user1, receiverId: user2 },
        { senderId: user2, receiverId: user1 }
      ]
    }).sort({ timestamp: 1 });
    res.json(messages);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// Get chat list for user (with unread counts and last message time)
app.get('/chatlist/:userId', async (req, res) => {
  const userId = req.params.userId;
  try {
    const chats = await Message.aggregate([
      {
        $match: {
          $or: [{ senderId: userId }, { receiverId: userId }]
        }
      },
      {
        $project: {
          otherUser: {
            $cond: [{ $eq: ["$senderId", userId] }, "$receiverId", "$senderId"]
          },
          receiverId: 1,
          read: 1,
          timestamp: 1
        }
      },
      {
        $group: {
          _id: "$otherUser",
          lastMessageTime: { $max: "$timestamp" },
          unreadCount: {
            $sum: {
              $cond: [
                { $and: [{ $eq: ["$receiverId", userId] }, { $eq: ["$read", false] }] },
                1,
                0
              ]
            }
          }
        }
      },
      { $sort: { lastMessageTime: -1 } }
    ]);

    res.json(chats);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// Socket.IO realtime
io.on('connection', socket => {
  console.log('User connected:', socket.id);

  socket.on('join', (userId) => {
    socket.join(userId);
    console.log(`User ${userId} joined room ${userId}`);
  });

  socket.on('private message', async (msg) => {
    try {
      const message = new Message(msg);
      await message.save();
      io.to(message.receiverId).emit('private message', message); // send to receiver
      io.to(message.senderId).emit('private message', message);   // send to sender
    } catch (err) {
      console.error(err);
    }
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

// Get participants chat list for user
app.get('/messages/participants/:userId', async (req, res) => {
  const { userId } = req.params;
  try {
    const messages = await Message.find({
      $or: [{ senderId: userId }, { receiverId: userId }]
    });

    const participants = new Set();
    messages.forEach((msg) => {
      if (msg.senderId !== userId) participants.add(msg.senderId);
      if (msg.receiverId !== userId) participants.add(msg.receiverId);
    });

    res.json([...participants]);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch participants', error: err.message });
  }
});

server.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});

// Create web server

const express = require('express');
const bodyParser = require('body-parser');
const { randomBytes } = require('crypto');
const cors = require('cors');
// const { default: axios } = require('axios');

const app = express();
app.use(bodyParser.json());
app.use(cors());

// Store comments in memory
const commentsByPostId = {};

// Get all comments for a post
app.get('/posts/:id/comments', (req, res) => {
  res.send(commentsByPostId[req.params.id] || []);
});

// Add a comment to a post
app.post('/posts/:id/comments', (req, res) => {
  const commentId = randomBytes(4).toString('hex');
  // Get comments for post
  const { content } = req.body;
  const comments = commentsByPostId[req.params.id] || [];

  // Add new comment
  comments.push({ id: commentId, content, status: 'pending' });
  // Update comments for post
  commentsByPostId[req.params.id] = comments;

  // Emit event to event bus
  // axios.post('http://localhost:4005/events', {
  //   type: 'CommentCreated',
  //   data: {
  //     id: commentId,
  //     content,
  //     postId: req.params.id,
  //     status: 'pending',
  //   },
  // });

  // Emit event to event bus
  axios.post('http://event-bus-srv:4005/events', {
    type: 'CommentCreated',
    data: {
      id: commentId,
      content,
      postId: req.params.id,
      status: 'pending',
    },
  });

  res.status(201).send(comments);
});

// Receive events from event bus
app.post('/events', (req, res) => {
  console.log('Event Received:', req.body.type);
  const { type, data } = req.body;

  // Check if event type is comment moderated
  if (type === 'CommentModerated') {
    // Get comments for post
    const { id, postId, status, content } = data;
    const comments = commentsByPostId[postId];
    // Find comment by id
    const comment = comments.find((comment) => comment.id === id);
    // Update comment status
    comment.status = status;

    // Emit
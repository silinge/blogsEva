const express = require('express');
const router = express.Router();
const db = require('./db');
const auth = require('./auth');
const crypto = require('crypto');

// List all posts
router.get('/posts', async (req, res) => {
  try {
    const posts = await db.getAllPosts();
    res.json(posts);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Get a single post
router.get('/posts/:id', async (req, res) => {
  try {
    const post = await db.getPost(req.params.id);
    if (post) res.json(post);
    else res.status(404).json({ error: 'Not found' });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Create a post (admin only)
router.post('/posts', auth.ensureAuth, async (req, res) => {
  try {
    const id = crypto.randomUUID ? crypto.randomUUID() : crypto.randomBytes(16).toString('hex');
    const now = new Date().toISOString();
    const { title, content, status } = req.body;
    const post = { id, title, content, created_at: now, updated_at: now, status: status || 'draft' };
    await db.createPost(post);
    res.status(201).json(post);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Update a post
router.put('/posts/:id', auth.ensureAuth, async (req, res) => {
  try {
    const now = new Date().toISOString();
    const { title, content, status } = req.body;
    const updates = { updated_at: now };
    if (title !== undefined) updates.title = title;
    if (content !== undefined) updates.content = content;
    if (status !== undefined) updates.status = status;
    const changes = await db.updatePost(req.params.id, updates);
    res.json({ updated: req.params.id, changes });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Delete a post
router.delete('/posts/:id', auth.ensureAuth, async (req, res) => {
  try {
    const changes = await db.deletePost(req.params.id);
    res.json({ deleted: req.params.id, changes });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

module.exports = router;

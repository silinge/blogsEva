require('dotenv').config();
const express = require('express');
const path = require('path');
const session = require('express-session');
const db = require('./db');
const postsRouter = require('./posts');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(session({
  secret: process.env.SESSION_SECRET || 'evablog-secret',
  resave: false,
  saveUninitialized: false,
  cookie: { maxAge: 24 * 60 * 60 * 1000 }
}));

// Static assets
app.use('/public', express.static(path.join(__dirname, '../public')));
app.use(express.static(path.join(__dirname, '../views')));

db.initDB().then(() => {
  // API routes under /api
  app.use('/api', postsRouter);
  // Authentication endpoints
app.post('/api/login', (req, res) => {
    const { username, password } = req.body;
    const adminUser = process.env.ADMIN_USERNAME || 'admin';
    const adminPass = process.env.ADMIN_PASSWORD || 'password';
    console.log(`Login attempt: user=${username}, ip=${req.ip}`);
    if (username === adminUser && password === adminPass) {
      req.session.user = 'admin';
      return res.json({ success: true });
    }
    return res.status(401).json({ error: 'Invalid credentials' });
  });
  app.post('/api/logout', (req, res) => {
    req.session.destroy(() => res.json({ success: true }));
  });

  // Basic routes
  app.get('/', (req, res) => res.sendFile(path.join(__dirname, '../views/index.html')));
  app.get('/post/:id', (req, res) => res.sendFile(path.join(__dirname, '../views/post.html')));
  app.get('/admin', (req, res) => {
    if (req.session && req.session.user) {
      res.sendFile(path.join(__dirname, '../views/admin.html'));
    } else {
      res.redirect('/login');
    }
  });
  app.get('/login', (req, res) => res.sendFile(path.join(__dirname, '../views/login.html')));

  app.listen(PORT, () => console.log(`Eva Blog listening on port ${PORT}`));
}).catch(err => {
  console.error('DB initialization failed', err);
});

module.exports = app;

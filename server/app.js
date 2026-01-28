const path = require('path');
// Force git update
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const express = require('express');
const session = require('express-session');
const db = require('./db');
const postsRouter = require('./posts');
const imagesRouter = require('./images');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Debug logging for static files
app.use('/public', (req, res, next) => {
  console.log(`[static] Request: ${req.url}`);
  next();
});

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
  const adminUser = process.env.ADMIN_USERNAME || 'admin';
  const adminPass = process.env.ADMIN_PASSWORD || 'password';
  console.log(`[startup] Admin Config: Username='${adminUser}', Password Length=${adminPass ? adminPass.length : 0}`);

  // API routes under /api
  app.use('/api', postsRouter);
  app.use('/api', imagesRouter);
  // Authentication endpoints
  app.post('/api/login', (req, res) => {
    const { username, password } = req.body;
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
  app.get('/aigc', (req, res) => res.sendFile(path.join(__dirname, '../views/aigc.html')));
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

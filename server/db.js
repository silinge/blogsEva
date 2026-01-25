const sqlite3 = require('sqlite3').verbose();
// Force git update
const path = require('path');
const fs = require('fs');

// DB path: data/posts.db
const dataDir = path.join(__dirname, '../data');
const dbPath = path.join(dataDir, 'posts.db');
let db;

function initDB() {
  return new Promise((resolve, reject) => {
    // Ensure data directory exists
    if (!fs.existsSync(dataDir)) {
      console.log('Data directory does not exist. Creating:', dataDir);
      try {
        fs.mkdirSync(dataDir, { recursive: true });
      } catch (mkdirErr) {
        return reject(mkdirErr);
      }
    }

    console.log('Initializing DB at:', dbPath);
    db = new sqlite3.Database(dbPath, (err) => {
      if (err) return reject(err);
      db.run(`CREATE TABLE IF NOT EXISTS posts (
        id TEXT PRIMARY KEY,
        title TEXT,
        content TEXT,
        created_at TEXT,
        updated_at TEXT,
        status TEXT
      )`, [], (err) => {
        if (err) {
          // Handle corrupted database file
          if (err.code === 'SQLITE_NOTADB') {
            console.error('Database file is corrupted (SQLITE_NOTADB). Deleting and recreating:', dbPath);
            // Close the database connection before deleting the file
            db.close((closeErr) => {
              if (closeErr) console.error('Error closing corrupted DB:', closeErr);
              try {
                if (fs.existsSync(dbPath)) {
                  fs.unlinkSync(dbPath);
                }
                // Retry initialization recursively
                initDB().then(resolve).catch(reject);
              } catch (unlinkErr) {
                reject(unlinkErr);
              }
            });
            return;
          }
          return reject(err);
        }
        resolve(true);
      });
    });
  });
}

function getAllPosts() {
  return new Promise((resolve, reject) => {
    db.all("SELECT * FROM posts ORDER BY created_at DESC", [], (err, rows) => {
      if (err) return reject(err);
      resolve(rows);
    });
  });
}

function getPost(id) {
  return new Promise((resolve, reject) => {
    db.get("SELECT * FROM posts WHERE id = ?", [id], (err, row) => {
      if (err) return reject(err);
      resolve(row);
    });
  });
}

function createPost(post) {
  return new Promise((resolve, reject) => {
    const { id, title, content, created_at, updated_at, status } = post;
    db.run("INSERT INTO posts (id, title, content, created_at, updated_at, status) VALUES (?, ?, ?, ?, ?, ?)",
      [id, title, content, created_at, updated_at, status], function (err) {
        if (err) return reject(err);
        resolve(this.lastID);
      });
  });
}

function updatePost(id, fields) {
  return new Promise((resolve, reject) => {
    const updates = [];
    const params = [];
    if (fields.title !== undefined) { updates.push('title = ?'); params.push(fields.title); }
    if (fields.content !== undefined) { updates.push('content = ?'); params.push(fields.content); }
    if (fields.updated_at !== undefined) { updates.push('updated_at = ?'); params.push(fields.updated_at); }
    if (fields.status !== undefined) { updates.push('status = ?'); params.push(fields.status); }
    if (updates.length === 0) return resolve(0);
    params.push(id);
    const sql = `UPDATE posts SET ${updates.join(', ')} WHERE id = ?`;
    db.run(sql, params, function (err) {
      if (err) return reject(err);
      resolve(this.changes);
    });
  });
}

function deletePost(id) {
  return new Promise((resolve, reject) => {
    db.run("DELETE FROM posts WHERE id = ?", [id], function (err) {
      if (err) return reject(err);
      resolve(this.changes);
    });
  });
}

module.exports = {
  initDB,
  getAllPosts,
  getPost,
  createPost,
  updatePost,
  deletePost
};

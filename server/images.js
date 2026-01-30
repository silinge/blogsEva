const express = require('express');
const router = express.Router();
const fs = require('fs').promises;
const path = require('path');
const db = require('./db');
const sharp = require('sharp');

const PICS_DIR = path.join(__dirname, '../public/assets/pics');
const THUMBS_DIR = path.join(__dirname, '../public/assets/thumbs');

// Ensure thumbs directory exists
fs.mkdir(THUMBS_DIR, { recursive: true }).catch(console.error);

router.get('/images', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 8;
    const skip = (page - 1) * limit;

    try {
      await fs.access(PICS_DIR);
    } catch {
      await fs.mkdir(PICS_DIR, { recursive: true }).catch(() => {});
      return res.json({ images: [], hasMore: false, total: 0 });
    }

    const files = await fs.readdir(PICS_DIR);
    const imageFiles = files.filter(f => /\.(jpe?g|png|gif|webp)$/i.test(f)).sort();
    const total = imageFiles.length;
    const paginated = imageFiles.slice(skip, skip + limit);

    // Get captions from DB
    let captions = [];
    try {
      captions = await db.getCaptions(paginated);
    } catch (dbErr) {
      console.error('DB fetch captions error:', dbErr);
    }

    const images = paginated.map(file => {
      const captionEntry = captions.find(c => c.filename === file);
      const alt = captionEntry ? captionEntry.caption : ''; // Empty if no manual caption
      return { 
        url: `/public/assets/pics/${file}`, 
        thumb: `/api/images/thumb/${file}`,
        name: file, 
        alt 
      };
    });

    res.json({ images, hasMore: skip + limit < total, total });
  } catch (err) {
    console.error('Images API error:', err);
    res.status(500).json({ error: 'Failed to fetch images' });
  }
});

router.get('/images/thumb/:filename', async (req, res) => {
  const filename = req.params.filename;
  const originalPath = path.join(PICS_DIR, filename);
  const thumbPath = path.join(THUMBS_DIR, filename);

  try {
    // Check if original exists
    await fs.access(originalPath);

    // Check if thumb exists
    try {
      await fs.access(thumbPath);
      // Serve existing thumb
      return res.sendFile(thumbPath);
    } catch {
      // Generate thumb
      // Use stream to avoid saving if not needed? No, user wants traffic reduction, so caching file is good.
      // 20% width implies we need to know width. 
      // Sharp can do resize({ width: <pixels> }).
      // But "20% width" is relative. 
      // If we don't know original width, we have to read metadata first.
      
      const metadata = await sharp(originalPath).metadata();
      const newWidth = Math.round(metadata.width * 0.2);
      
      if (newWidth < 1) {
        // Too small or error, serve original
        return res.sendFile(originalPath);
      }

      await sharp(originalPath)
        .resize({ width: newWidth })
        .toFile(thumbPath);
        
      return res.sendFile(thumbPath);
    }
  } catch (err) {
    console.error('Thumbnail error:', err);
    // Fallback to original if possible, or 404
    if (err.code === 'ENOENT') return res.status(404).send('Not found');
    res.status(500).send('Error generating thumbnail');
  }
});

router.post('/images/caption', async (req, res) => {
  if (!req.session || !req.session.user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const { filename, caption } = req.body;
  if (!filename) {
    return res.status(400).json({ error: 'Filename is required' });
  }

  try {
    await db.updateCaption(filename, caption || '');
    res.json({ success: true });
  } catch (err) {
    console.error('Update caption error:', err);
    res.status(500).json({ error: 'Database error' });
  }
});

module.exports = router;

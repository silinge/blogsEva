const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');
const sharp = require('sharp');
const exifr = require('exifr');

const IMAGES_DIR = path.join(__dirname, '../public/images');

async function extractCaptionFromImage(imagePath) {
  try {
    const buffer = fs.readFileSync(imagePath);
    const exifData = await exifr.parse(buffer);
    const caption = (exifData && (exifData.ImageDescription || exifData.UserComment)) || null;
    if (typeof caption === 'string' && caption.trim()) {
      return caption.trim().replace(/\0/g, '');
    }
    // Fallback to file name
    return path.basename(imagePath);
  } catch (err) {
    console.error('[images] extractCaptionFromImage error', imagePath, err);
    return '图片';
  }
}

router.get('/images', async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 8;
  try {
    const exists = fs.existsSync(IMAGES_DIR);
    const files = exists ? fs.readdirSync(IMAGES_DIR).filter(n => /\.(jpe?g|png|gif|webp)$/i.test(n)).sort() : [];
    const slice = files.slice((page - 1) * limit, page * limit);
    const images = await Promise.all(slice.map(async (name) => {
      const imagePath = path.join(IMAGES_DIR, name);
      const url = '/public/images/' + name;
      const caption = await extractCaptionFromImage(imagePath);
      return { url, caption, alt: name };
    }));
    res.json({ images, hasMore: (page * limit) < files.length });
  } catch (e) {
    console.error('[images] fetch error', e);
    res.status(500).json({ error: e.message });
  }
});

module.exports = router;

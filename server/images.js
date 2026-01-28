const express = require('express');
const router = express.Router();
const fs = require('fs').promises;
const path = require('path');
const exifr = require('exifr');

const PICS_DIR = path.join(__dirname, '../public/assets/pics');

function decodeWindowsString(buffer) {
  if (!buffer) return null;
  if (typeof buffer === 'string') return buffer;
  if (!(buffer instanceof Uint8Array)) return null;
  let end = buffer.length;
  while (end > 0 && buffer[end - 1] === 0) end--;
  const clean = buffer.subarray(0, end);
  try {
    return new TextDecoder('utf-16le').decode(clean).replace(/\0/g, '').trim();
  } catch {
    return null;
  }
}

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

    const images = await Promise.all(paginated.map(async (file) => {
      const filePath = path.join(PICS_DIR, file);
      let alt = '';
      try {
        const tags = await exifr.parse(filePath, {
          tiff: true, ifd0: true, exif: true, xmp: true, userComment: true
        });
        if (tags) {
          const xpComment = decodeWindowsString(tags.XPComment);
          let userComment = tags.UserComment;
          if (userComment instanceof Uint8Array) {
            userComment = new TextDecoder().decode(userComment).replace(/\0/g, '').trim();
          }
          alt = xpComment ||
                (typeof userComment === 'string' ? userComment : null) ||
                tags.ImageDescription ||
                tags.description ||
                tags.title ||
                decodeWindowsString(tags.XPTitle) ||
                '';
        }
      } catch {}
      if (!alt) alt = path.parse(file).name;
      return { url: `/public/assets/pics/${file}`, name: file, alt };
    }));

    res.json({ images, hasMore: skip + limit < total, total });
  } catch (err) {
    console.error('Images API error:', err);
    res.status(500).json({ error: 'Failed to fetch images' });
  }
});

module.exports = router;

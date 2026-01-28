const express = require('express');
const router = express.Router();
const fs = require('fs').promises;
const path = require('path');
const exifr = require('exifr');

const PICS_DIR = path.join(__dirname, '../public/assets/pics');

router.get('/images', async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 8;
        const skip = (page - 1) * limit;

        // Ensure directory exists
        try {
            await fs.access(PICS_DIR);
        } catch {
            // Try to create it if it doesn't exist, though typically we expect it to exist
            try {
                await fs.mkdir(PICS_DIR, { recursive: true });
            } catch (err) {
                console.error('Failed to create pics directory', err);
            }
            return res.json({ images: [], hasMore: false });
        }

        const files = await fs.readdir(PICS_DIR);
        // Filter for image files
        const imageFiles = files.filter(file => /\.(jpg|jpeg|png|webp|gif)$/i.test(file)).sort();
        
        const total = imageFiles.length;
        const paginatedFiles = imageFiles.slice(skip, skip + limit);

        const images = await Promise.all(paginatedFiles.map(async file => {
            const filePath = path.join(PICS_DIR, file);
            let alt = '';
            
            try {
                // Read metadata
                const output = await exifr.parse(filePath, {
                    ifd0: true, // ImageDescription
                    exif: true, // UserComment
                    xmp: true,  // dc:description, etc.
                    userComment: true
                });
                
                if (output) {
                    alt = output.ImageDescription || 
                          output.UserComment || 
                          output.description || 
                          output.title ||       
                          '';
                    
                    // Decode buffer if UserComment is buffer
                    if (alt instanceof Uint8Array) {
                         alt = new TextDecoder().decode(alt).replace(/\0/g, '');
                    }
                }
            } catch (e) {
                // console.warn(`Metadata read error for ${file}:`, e.message);
                // Ignore errors, just use filename fallback
            }
            
            // Fallback to filename (without extension) if no metadata found
            if (!alt) {
                alt = path.parse(file).name;
            }

            return {
                url: `/public/assets/pics/${file}`,
                name: file,
                alt: alt
            };
        }));

        res.json({
            images,
            hasMore: skip + limit < total,
            total
        });
    } catch (err) {
        console.error('Images API error:', err);
        res.status(500).json({ error: 'Failed to fetch images' });
    }
});

module.exports = router;

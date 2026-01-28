const express = require('express');
const router = express.Router();
const fs = require('fs').promises;
const path = require('path');
const exifr = require('exifr');

const PICS_DIR = path.join(__dirname, '../public/assets/pics');

// Helper to decode Windows UCS-2 (UTF-16LE) strings
function decodeWindowsString(buffer) {
    if (!buffer) return null;
    if (typeof buffer === 'string') return buffer;
    if (!(buffer instanceof Uint8Array)) return null;
    
    // Remove trailing nulls if any
    let end = buffer.length;
    while (end > 0 && buffer[end-1] === 0) end--;
    
    const cleanBuffer = buffer.subarray(0, end);
    try {
        const decoder = new TextDecoder('utf-16le');
        return decoder.decode(cleanBuffer).replace(/\0/g, '').trim();
    } catch (e) {
        return null;
    }
}

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
                // We enable tiff to get XP tags (0x9C9C is XPComment)
                const output = await exifr.parse(filePath, {
                    ifd0: true, 
                    exif: true, 
                    xmp: true,  
                    userComment: true,
                    tiff: true,
                    mergeOutput: false // Keep distinct groups to check specific tags
                });
                
                if (output) {
                    // 1. Try Windows XP Comment (XPComment / 0x9c9c)
                    // exifr might put this in 'exif' or 'ifd0' depending on structure, usually ifd0 or top level if merged.
                    // But with mergeOutput:false, we check specific blocks.
                    // Actually, let's use mergeOutput:true (default) for simplicity, but look for specific keys.
                }
            } catch (e) {
                // console.warn(`Metadata read error for ${file}:`, e.message);
            }

            // Re-read with default merge behavior for easier access
            try {
                 const tags = await exifr.parse(filePath, {
                    tiff: true,
                    ifd0: true,
                    exif: true,
                    xmp: true,
                    userComment: true
                });

                if (tags) {
                    // Windows "Remarks" / "Comments" often stored in XPComment
                    const xpComment = decodeWindowsString(tags.XPComment);
                    
                    // UserComment often has encoding prefix (ASCII, UNICODE, etc.) or just buffer
                    let userComment = tags.UserComment;
                    if (userComment instanceof Uint8Array) {
                        // Try simple utf8 first
                        userComment = new TextDecoder().decode(userComment).replace(/\0/g, '').trim();
                        // If looks like garbage, might need logic, but exifr usually handles standard UserComment if we don't mess it up
                        // exifr.parse({userComment: true}) tries to decode it.
                    }

                    alt = xpComment || 
                          (typeof userComment === 'string' ? userComment : null) || 
                          tags.ImageDescription || 
                          tags.description || 
                          tags.title || 
                          tags.XPTitle ||
                          '';
                }
            } catch (e) {
                // ignore
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

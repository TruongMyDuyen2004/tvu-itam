const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

const OUT_DIR = path.join(__dirname, '..', 'frontend', 'assets', 'images');

function crc32(buf) {
    let c = 0xffffffff;
    const table = new Int32Array(256);
    for (let n = 0; n < 256; n++) {
        let k = n;
        for (let i = 0; i < 8; i++) k = k & 1 ? 0xedb88320 ^ (k >>> 1) : k >>> 1;
        table[n] = k;
    }
    for (let i = 0; i < buf.length; i++) c = table[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
    return (c ^ 0xffffffff) >>> 0;
}

function pngChunk(type, data) {
    const len = Buffer.alloc(4);
    len.writeUInt32BE(data.length);
    const typeB = Buffer.from(type, 'ascii');
    const crcData = Buffer.concat([typeB, data]);
    const crc = Buffer.alloc(4);
    crc.writeUInt32BE(crc32(crcData));
    return Buffer.concat([len, typeB, data, crc]);
}

function createPNG(size) {
    // Create raw pixel data (RGBA) with rounded rect background
    const rawData = Buffer.alloc(size * size * 4);
    const bgR = 220, bgG = 38, bgB = 38; // #DC2626 red
    const accentR = 252, accentG = 211, accentB = 77; // #FCD34D yellow

    for (let y = 0; y < size; y++) {
        for (let x = 0; x < size; x++) {
            const idx = (y * size + x) * 4;
            const cx = x / size - 0.5;
            const cy = y / size - 0.5;
            const r = Math.sqrt(cx * cx + cy * cy);

            // Simple rounded square (radius = 15% of size)
            const cornerRadius = 0.15;
            let inShape = true;
            const dx = Math.abs(cx) - (0.5 - cornerRadius);
            const dy = Math.abs(cy) - (0.5 - cornerRadius);
            if (dx > 0 && dy > 0) {
                inShape = (dx * dx + dy * dy) <= cornerRadius * cornerRadius;
            } else if (dx > 0 || dy > 0) {
                inShape = true;
            }

            if (inShape) {
                // Simple gradient (center brighter)
                const dist = Math.min(1, r * 1.6);
                rawData[idx] = Math.min(255, bgR + (255 - bgR) * (1 - dist) * 0.3);     // R
                rawData[idx + 1] = Math.min(255, bgG - 20 * dist);                       // G
                rawData[idx + 2] = Math.min(255, bgB - 30 * dist);                       // B
                rawData[idx + 3] = 255;                                                  // A
            } else {
                rawData[idx + 3] = 0; // transparent outside
            }
        }
    }

    // Create IDAT (filter byte + scanline data)
    const filtered = Buffer.alloc(size * size * 4 + size); // +1 filter byte per row
    for (let y = 0; y < size; y++) {
        const rowOffset = y * (size * 4 + 1);
        filtered[rowOffset] = 0; // filter type None
        rawData.copy(filtered, rowOffset + 1, y * size * 4, (y + 1) * size * 4);
    }

    const compressed = zlib.deflateSync(filtered);

    const ihdr = Buffer.alloc(13);
    ihdr.writeUInt32BE(size, 0);   // width
    ihdr.writeUInt32BE(size, 4);   // height
    ihdr[8] = 8;                    // bit depth
    ihdr[9] = 6;                    // color type RGBA
    ihdr[10] = 0;                   // compression
    ihdr[11] = 0;                   // filter
    ihdr[12] = 0;                   // interlace

    const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
    return Buffer.concat([
        signature,
        pngChunk('IHDR', ihdr),
        pngChunk('IDAT', compressed),
        pngChunk('IEND', Buffer.alloc(0))
    ]);
}

// Generate icons
[192, 512].forEach(size => {
    const png = createPNG(size);
    const filePath = path.join(OUT_DIR, `pwa-icon-${size}.png`);
    fs.writeFileSync(filePath, png);
    console.log(`Created: ${filePath} (${png.length} bytes)`);
});

console.log('PWA icons generated successfully!');

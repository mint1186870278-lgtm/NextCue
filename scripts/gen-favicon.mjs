import sharp from 'sharp';
import pngToIco from 'png-to-ico';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');
const logoPath = path.join(root, 'public', 'logo.png');
const outPath = path.join(root, 'app', 'favicon.ico');

const buf = await sharp(logoPath)
  .resize(256, 256, { fit: 'cover' })
  .png()
  .toBuffer();

const tempPath = path.join(root, '.favicon-temp.png');
fs.writeFileSync(tempPath, buf);

try {
  const ico = await pngToIco(tempPath);
  fs.writeFileSync(outPath, ico);
  console.log('favicon.ico created at app/favicon.ico');
} finally {
  fs.unlinkSync(tempPath);
}

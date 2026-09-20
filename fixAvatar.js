import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const filePath = path.join(__dirname, 'app.js');
let content = fs.readFileSync(filePath, 'utf-8');

// Fix typo in justify
content = content.replace(/avatarCircle\.style\.justify = 'center';/g, "avatarCircle.style.justifyContent = 'center';");

// Remove margin right since we use gap now
content = content.replace(/avatarCircle\.style\.marginRight = '8px';/g, "avatarCircle.style.marginRight = '0';");

fs.writeFileSync(filePath, content, 'utf-8');
console.log('Fixed avatar circle styles in app.js');

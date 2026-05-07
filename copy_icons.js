const fs = require('fs');
const path = require('path');

const src = 'C:\\Users\\admin\\.gemini\\antigravity\\brain\\af52e4fb-658d-41dc-ac7f-e372592d3102\\app_icon_1778162786837.png';
const destDir = 'c:\\Users\\admin\\Desktop\\김세진\\4. 프로그래밍\\2605 임장기록\\public';

fs.copyFileSync(src, path.join(destDir, 'apple-touch-icon.png'));
fs.copyFileSync(src, path.join(destDir, 'icon-192.png'));
fs.copyFileSync(src, path.join(destDir, 'icon-512.png'));

console.log('Icons copied successfully!');

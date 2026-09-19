const fs = require('fs');
const path = require('path');
const https = require('https');
const crypto = require('crypto');
require('dotenv').config();

const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
const apiKey = process.env.CLOUDINARY_API_KEY;
const apiSecret = process.env.CLOUDINARY_API_SECRET;

if (!cloudName || !apiKey || !apiSecret) {
  console.error('[FATAL] Missing required Cloudinary credentials in environment variables (CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET).');
  process.exit(1);
}

const filePath = path.join(__dirname, '../public/Images/ChatGPT Image Aug 7, 2026, 06_57_25 PM.png');

async function uploadToCloudinary() {
  if (!fs.existsSync(filePath)) {
    console.error('File not found:', filePath);
    process.exit(1);
  }

  const timestamp = Math.floor(Date.now() / 1000);
  // Optional: specify a folder or public_id
  const publicId = 'voltrix_logo_' + timestamp;
  
  // Signature = sha1(public_id=<publicId>&timestamp=<timestamp><api_secret>)
  const strToSign = `public_id=${publicId}&timestamp=${timestamp}${apiSecret}`;
  const signature = crypto.createHash('sha1').update(strToSign).digest('hex');

  const boundary = '----WebKitFormBoundary7MA4YWxkTrZu0gW';
  let postData = '';
  postData += `--${boundary}\r\nContent-Disposition: form-data; name="file"; filename="logo.png"\r\nContent-Type: image/png\r\n\r\n`;
  
  const fileData = fs.readFileSync(filePath);
  
  let postEnd = `\r\n--${boundary}\r\nContent-Disposition: form-data; name="api_key"\r\n\r\n${apiKey}`;
  postEnd += `\r\n--${boundary}\r\nContent-Disposition: form-data; name="timestamp"\r\n\r\n${timestamp}`;
  postEnd += `\r\n--${boundary}\r\nContent-Disposition: form-data; name="public_id"\r\n\r\n${publicId}`;
  postEnd += `\r\n--${boundary}\r\nContent-Disposition: form-data; name="signature"\r\n\r\n${signature}`;
  postEnd += `\r\n--${boundary}--\r\n`;

  const req = https.request({
    hostname: 'api.cloudinary.com',
    path: `/v1_1/${cloudName}/image/upload`,
    method: 'POST',
    headers: {
      'Content-Type': `multipart/form-data; boundary=${boundary}`,
      'Content-Length': Buffer.byteLength(postData) + fileData.length + Buffer.byteLength(postEnd)
    }
  }, (res) => {
    let data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', () => {
      try {
        const json = JSON.parse(data);
        console.log('UPLOAD_SUCCESS');
        console.log('URL: ' + json.secure_url);
      } catch(e) {
        console.error('JSON parse error:', data);
      }
    });
  });

  req.on('error', (e) => {
    console.error('Upload failed:', e);
  });

  req.write(Buffer.from(postData, 'utf8'));
  req.write(fileData);
  req.write(Buffer.from(postEnd, 'utf8'));
  req.end();
}

uploadToCloudinary();

const { S3Client, PutObjectCommand, DeleteObjectCommand, GetObjectCommand } = require('@aws-sdk/client-s3');
const fs = require('fs');

const r2 = new S3Client({
  region: 'auto',
  endpoint: process.env.R2_ENDPOINT,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
  },
});

const BUCKET = process.env.R2_BUCKET || 'fleetcontrol-fotos';

const uploadToR2 = async (localPath, key) => {
  const fileBuffer = fs.readFileSync(localPath);
  const ext = key.split('.').pop()?.toLowerCase();
  const contentType = ext === 'png' ? 'image/png' : 'image/jpeg';

  await r2.send(new PutObjectCommand({
    Bucket: BUCKET,
    Key: key,
    Body: fileBuffer,
    ContentType: contentType,
  }));

  try { fs.unlinkSync(localPath); } catch {}
  return key;
};

const deleteFromR2 = async (key) => {
  try {
    await r2.send(new DeleteObjectCommand({ Bucket: BUCKET, Key: key }));
  } catch (err) {
    console.error('Error deleting from R2:', err.message);
  }
};

// Stream photo from R2 to response
const streamFromR2 = async (key, res) => {
  const command = new GetObjectCommand({ Bucket: BUCKET, Key: key });
  const response = await r2.send(command);
  res.setHeader('Content-Type', response.ContentType || 'image/jpeg');
  res.setHeader('Cache-Control', 'public, max-age=86400');
  response.Body.pipe(res);
};

module.exports = { uploadToR2, deleteFromR2, streamFromR2, BUCKET };

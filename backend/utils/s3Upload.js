const { PutObjectCommand } = require("@aws-sdk/client-s3");
const { s3 } = require("../config/s3");

async function uploadToS3(buffer, key, mimeType = "application/pdf") {
  const bucket = process.env.AWS_S3_BUCKET;

  const command = new PutObjectCommand({
    Bucket: bucket,
    Key: key,
    Body: buffer,
    ContentType: mimeType,
  });

  await s3.send(command);

  // public URL
  return `https://${bucket}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`;
}

module.exports = { uploadToS3 };

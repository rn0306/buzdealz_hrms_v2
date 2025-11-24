const { PutObjectCommand, DeleteObjectCommand } = require("@aws-sdk/client-s3");
const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");
const { s3 } = require("../config/s3");
const crypto = require("crypto");

async function generatePresignedUrl(fileType) {
  const bucket = process.env.AWS_S3_BUCKET;
  const key = `resumes/${crypto.randomUUID()}.pdf`;

  const command = new PutObjectCommand({
    Bucket: bucket,
    Key: key,
    ContentType: fileType,
  });

  const uploadUrl = await getSignedUrl(s3, command, { expiresIn: 300 });

  const fileUrl = `https://${bucket}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`;

  return { uploadUrl, fileUrl, key };
}

async function deleteFileFromS3(fileUrl) {
  if (!fileUrl) return;

  const bucket = process.env.AWS_S3_BUCKET;

  // Extract key after bucket URL
  const urlParts = fileUrl.split(".amazonaws.com/");
  if (urlParts.length < 2) return;

  const key = urlParts[1];

  const command = new DeleteObjectCommand({
    Bucket: bucket,
    Key: key,
  });

  await s3.send(command);
}

module.exports = { generatePresignedUrl, deleteFileFromS3 };

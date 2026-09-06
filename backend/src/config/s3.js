const { S3Client } = require('@aws-sdk/client-s3');

let client = null;

const getS3Client = () => {
  if (client) return client;

  const region      = process.env.AWS_REGION      || 'ap-south-1';
  const accessKeyId = process.env.AWS_ACCESS_KEY_ID;
  const secretKey   = process.env.AWS_SECRET_ACCESS_KEY;

  if (!accessKeyId || !secretKey) {
    console.warn('[S3] AWS credentials not configured — image uploads will fail.');
  }

  client = new S3Client({
    region,
    credentials: { accessKeyId, secretAccessKey: secretKey },
  });

  return client;
};

const getBucket = () => process.env.AWS_S3_BUCKET || 'rvscet-placement';

module.exports = { getS3Client, getBucket };

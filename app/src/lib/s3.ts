import { S3Client, PutObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";

const endpoint = process.env.MINIO_ENDPOINT ?? "minio";
const port = process.env.MINIO_PORT ?? "9000";
const accessKey = process.env.MINIO_ACCESS_KEY ?? "minioadmin";
const secretKey = process.env.MINIO_SECRET_KEY ?? "minioadmin";
const bucket = process.env.MINIO_BUCKET ?? "collection-images";
const publicUrl = process.env.MINIO_PUBLIC_URL ?? "http://localhost:9000";

const s3 = new S3Client({
  endpoint: `http://${endpoint}:${port}`,
  region: "us-east-1",
  credentials: { accessKeyId: accessKey, secretAccessKey: secretKey },
  forcePathStyle: true,
});

export function getImageUrl(key: string): string {
  return `${publicUrl}/${bucket}/${key}`;
}

export async function uploadImage(key: string, buffer: Buffer, contentType: string): Promise<string> {
  await s3.send(new PutObjectCommand({
    Bucket: bucket,
    Key: key,
    Body: buffer,
    ContentType: contentType,
  }));
  return getImageUrl(key);
}

export async function deleteImage(key: string): Promise<void> {
  await s3.send(new DeleteObjectCommand({ Bucket: bucket, Key: key }));
}

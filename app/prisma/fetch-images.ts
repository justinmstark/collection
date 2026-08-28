import { PrismaClient } from "@prisma/client";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";

const db = new PrismaClient();

const s3 = new S3Client({
  endpoint: `http://${process.env.MINIO_ENDPOINT ?? "minio"}:${process.env.MINIO_PORT ?? "9000"}`,
  region: "us-east-1",
  credentials: {
    accessKeyId: process.env.MINIO_ACCESS_KEY ?? "minioadmin",
    secretAccessKey: process.env.MINIO_SECRET_KEY ?? "minioadmin",
  },
  forcePathStyle: true,
});

const BUCKET = process.env.MINIO_BUCKET ?? "collection-images";
const MINIO_PUBLIC_URL = process.env.MINIO_PUBLIC_URL ?? "http://localhost:9000";

function toSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[''`]/g, "")        // remove apostrophes
    .replace(/[^a-z0-9\s-]/g, "") // remove other punctuation
    .trim()
    .replace(/\s+/g, "-");        // spaces to hyphens
}

async function fetchSmwsImageUrl(slug: string): Promise<string | null> {
  try {
    const res = await fetch(`https://smws.com/${slug}`, {
      headers: { "User-Agent": "Mozilla/5.0" },
      signal: AbortSignal.timeout(10000),
    });
    if (!res.ok) return null;
    const html = await res.text();
    const match = html.match(/property="og:image"\s+content="([^"]+)"/);
    return match?.[1] ?? null;
  } catch {
    return null;
  }
}

async function downloadAndStore(imageUrl: string, key: string): Promise<boolean> {
  try {
    const res = await fetch(imageUrl, { signal: AbortSignal.timeout(15000) });
    if (!res.ok) return false;
    const buffer = Buffer.from(await res.arrayBuffer());
    const contentType = res.headers.get("content-type") ?? "image/png";
    await s3.send(new PutObjectCommand({
      Bucket: BUCKET,
      Key: key,
      Body: buffer,
      ContentType: contentType,
    }));
    return true;
  } catch {
    return false;
  }
}

async function main() {
  const products = await db.product.findMany({
    where: { smwsCode: { not: null } },
    include: {
      items: {
        include: { images: true },
        take: 1,
      },
    },
  });

  let found = 0, skipped = 0, failed = 0;

  for (const product of products) {
    const item = product.items[0];
    if (!item) { console.log(`  skip  ${product.smwsCode} — no collection item`); skipped++; continue; }
    if (item.images.length > 0) { console.log(`  skip  ${product.smwsCode} — already has image`); skipped++; continue; }

    const slug = toSlug(product.name);
    process.stdout.write(`  ${product.smwsCode}  ${slug}  … `);

    const imageUrl = await fetchSmwsImageUrl(slug);
    if (!imageUrl) {
      console.log("not found on smws.com");
      failed++;
      continue;
    }

    const ext = imageUrl.match(/\.(png|jpg|jpeg|webp)/i)?.[1] ?? "png";
    const key = `smws/${product.smwsCode?.replace(".", "-")}.${ext}`;

    const ok = await downloadAndStore(imageUrl, key);
    if (!ok) {
      console.log("download failed");
      failed++;
      continue;
    }

    await db.itemImage.create({
      data: { collectionItemId: item.id, storageKey: key, isPrimary: true },
    });

    console.log(`✓  saved as ${key}`);
    found++;

    await new Promise((r) => setTimeout(r, 500)); // be polite to smws.com
  }

  console.log(`\nDone: ${found} fetched, ${skipped} skipped, ${failed} not found`);
}

main().catch(console.error).finally(() => db.$disconnect());

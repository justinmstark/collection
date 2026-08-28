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
const API_KEY = process.env.GOOGLE_SEARCH_API_KEY!;
const CX = process.env.GOOGLE_SEARCH_CX!;

async function googleImageSearch(query: string): Promise<string | null> {
  const url = `https://www.googleapis.com/customsearch/v1?key=${API_KEY}&cx=${CX}&searchType=image&q=${encodeURIComponent(query)}&num=5&imgType=photo&imgSize=medium`;
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(10000) });
    if (!res.ok) { console.error(`  Google API error: ${res.status}`); return null; }
    const data: any = await res.json();
    const items = data.items ?? [];
    // Prefer PNG/JPG images, prefer bottle images from known whisky sites
    const preferred = items.find((i: any) =>
      /\.(png|jpg|jpeg)(\?|$)/i.test(i.link) &&
      /(smws|whisky|malt|spirit|masterofmalt|thewhiskyexchange)/i.test(i.link)
    );
    return preferred?.link ?? items[0]?.link ?? null;
  } catch (e) {
    console.error(`  Google API error:`, e);
    return null;
  }
}

async function downloadAndStore(imageUrl: string, key: string): Promise<boolean> {
  try {
    const res = await fetch(imageUrl, {
      headers: { "User-Agent": "Mozilla/5.0" },
      signal: AbortSignal.timeout(15000),
    });
    if (!res.ok) return false;
    const ct = res.headers.get("content-type") ?? "";
    if (!ct.includes("image")) return false;
    const buffer = Buffer.from(await res.arrayBuffer());
    await s3.send(new PutObjectCommand({
      Bucket: BUCKET, Key: key, Body: buffer, ContentType: ct,
    }));
    return true;
  } catch {
    return false;
  }
}

async function main() {
  const products = await db.product.findMany({
    where: { smwsCode: { not: null } },
    include: { items: { include: { images: true }, take: 1 } },
  });

  const missing = products.filter((p) => p.items[0] && p.items[0].images.length === 0);
  console.log(`${missing.length} bottles need images\n`);

  let saved = 0, failed = 0;

  for (const product of missing) {
    const code = product.smwsCode!;
    const query = `SMWS ${code} "${product.name}" whisky bottle`;
    process.stdout.write(`  ${code}  ${product.name}  … `);

    const imageUrl = await googleImageSearch(query);
    if (!imageUrl) {
      console.log("no result");
      failed++;
      continue;
    }

    const ext = imageUrl.match(/\.(jpg|jpeg|png|webp)/i)?.[1] ?? "jpg";
    const key = `smws/${code.replace(".", "-")}.${ext}`;
    const ok = await downloadAndStore(imageUrl, key);

    if (!ok) {
      console.log(`found but download failed`);
      failed++;
      continue;
    }

    await db.itemImage.create({
      data: { collectionItemId: product.items[0].id, storageKey: key, isPrimary: true },
    });

    console.log(`✓  ${imageUrl.split("/")[2]}`);
    saved++;
    await new Promise((r) => setTimeout(r, 500)); // avoid rate limits
  }

  console.log(`\nDone: ${saved} saved, ${failed} failed`);
}

main().catch(console.error).finally(() => db.$disconnect());

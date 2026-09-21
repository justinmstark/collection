import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

export const dynamic = 'force-dynamic';

type Params = { params: Promise<{ id: string }> };

interface ImageResult {
  url: string;
  title: string;
  source: string;
}

async function trySmwsScrape(smwsCode: string): Promise<ImageResult | null> {
  try {
    const url = `https://www.scotchmalts.com/en-GB/product/${smwsCode}`;
    const res = await fetch(url, {
      headers: { "User-Agent": "Mozilla/5.0 (compatible; CollectionBot/1.0)" },
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) return null;
    const html = await res.text();
    const ogMatch = html.match(/<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i)
      ?? html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:image["']/i);
    if (ogMatch?.[1]) {
      return { url: ogMatch[1], title: `SMWS ${smwsCode}`, source: "scotchmalts.com" };
    }
    return null;
  } catch {
    return null;
  }
}

async function bingImageSearch(query: string): Promise<ImageResult[]> {
  try {
    const q = encodeURIComponent(query);
    const res = await fetch(`https://www.bing.com/images/search?q=${q}&first=1`, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept": "text/html",
        "Accept-Language": "en-US,en;q=0.9",
      },
      signal: AbortSignal.timeout(10000),
    });
    if (!res.ok) return [];
    const html = await res.text();
    const matches = [...html.matchAll(/mediaurl=(https?[^&"]+)/g)];
    return matches.slice(0, 6).map((m) => ({
      url: decodeURIComponent(m[1]),
      title: query,
      source: new URL(decodeURIComponent(m[1])).hostname,
    }));
  } catch {
    return [];
  }
}

export async function GET(_req: NextRequest, { params }: Params) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const userId = (session.user as { id: string }).id;

  const item = await db.collectionItem.findFirst({
    where: { id, userId },
    include: { product: true },
  });
  if (!item) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const results: ImageResult[] = [];

  const smwsCode = item.product?.smwsCode;
  if (smwsCode) {
    const smwsResult = await trySmwsScrape(smwsCode);
    if (smwsResult) results.push(smwsResult);
  }

  const name = item.product?.name ?? item.customName ?? "";
  const producer = item.product?.producerId
    ? (await db.producer.findUnique({ where: { id: item.product.producerId } }))?.name ?? ""
    : "";
  const category = item.product?.category ?? "spirits";
  const categoryTerm = category === "wine" ? "wine bottle" : category === "spirits" ? "bottle" : "whisky bottle";
  const query = [name, producer, categoryTerm].filter(Boolean).join(" ");

  const bingResults = await bingImageSearch(query);
  results.push(...bingResults);

  return NextResponse.json(results.slice(0, 6));
}

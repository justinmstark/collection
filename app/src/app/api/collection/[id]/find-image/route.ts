import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

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

async function googleImageSearch(query: string): Promise<ImageResult[]> {
  const apiKey = process.env.GOOGLE_SEARCH_API_KEY;
  const cx = process.env.GOOGLE_SEARCH_CX;
  if (!apiKey || !cx) return [];

  try {
    const params = new URLSearchParams({
      key: apiKey,
      cx,
      searchType: "image",
      q: query,
      num: "6",
    });
    const res = await fetch(`https://www.googleapis.com/customsearch/v1?${params}`, {
      signal: AbortSignal.timeout(10000),
    });
    if (!res.ok) return [];
    const data = await res.json();
    return (data.items ?? []).map((item: { link: string; title: string; displayLink: string }) => ({
      url: item.link,
      title: item.title,
      source: item.displayLink,
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
  const query = [name, producer, "whisky bottle"].filter(Boolean).join(" ");

  const googleResults = await googleImageSearch(query);
  results.push(...googleResults);

  return NextResponse.json(results.slice(0, 6));
}

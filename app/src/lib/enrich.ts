const UA = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";

async function getDDGVqd(query: string): Promise<string | null> {
  try {
    const res = await fetch(`https://duckduckgo.com/?q=${encodeURIComponent(query)}&iax=images&ia=images`, {
      headers: { "User-Agent": UA },
      signal: AbortSignal.timeout(8000),
    });
    const html = await res.text();
    return html.match(/vqd=([^&"']+)/)?.[1] ?? null;
  } catch { return null; }
}

export async function searchProductImage(name: string, producer: string): Promise<string | null> {
  const query = [name, producer, "whisky bottle product"].filter(Boolean).join(" ");
  const vqd = await getDDGVqd(query);
  if (!vqd) return null;

  try {
    const res = await fetch(
      `https://duckduckgo.com/i.js?q=${encodeURIComponent(query)}&o=json&p=1&s=0&u=bing&f=,,,,,&l=us-en&vqd=${vqd}`,
      { headers: { "User-Agent": UA, Referer: "https://duckduckgo.com/" }, signal: AbortSignal.timeout(8000) }
    );
    if (!res.ok) return null;
    const data = await res.json();
    const urls: string[] = (data.results ?? []).map((r: { image: string }) => r.image).filter(Boolean);
    // Try each until we get a real downloadable image > 20kb
    for (const url of urls.slice(0, 10)) {
      try {
        const r = await fetch(url, { headers: { "User-Agent": UA }, signal: AbortSignal.timeout(8000) });
        if (!r.ok) continue;
        const ct = r.headers.get("content-type")?.split(";")[0].trim() ?? "";
        if (!["image/jpeg", "image/png", "image/webp"].includes(ct)) continue;
        const len = parseInt(r.headers.get("content-length") ?? "0");
        if (len > 0 && len < 20000) continue;
        return url;
      } catch { continue; }
    }
    return null;
  } catch { return null; }
}

export async function searchPrice(name: string, producer: string): Promise<number | null> {
  const query = `${name} ${producer} price AUD buy`;
  const vqd = await getDDGVqd(query.replace("images", ""));

  try {
    // Try DuckDuckGo text search results
    const res = await fetch(
      `https://duckduckgo.com/d.js?q=${encodeURIComponent(query)}&o=json&p=1&s=0&dc=1&l=us-en${vqd ? `&vqd=${vqd}` : ""}`,
      { headers: { "User-Agent": UA, Referer: "https://duckduckgo.com/" }, signal: AbortSignal.timeout(8000) }
    );
    if (!res.ok) return null;
    const text = await res.text();
    // Extract AUD prices from snippets
    const matches = [...text.matchAll(/\$\s*(\d{2,4}(?:\.\d{2})?)/g)];
    const prices = matches.map(m => parseFloat(m[1])).filter(p => p >= 30 && p <= 5000);
    if (prices.length === 0) return null;
    prices.sort((a, b) => a - b);
    // Return median-ish price
    return prices[Math.floor(prices.length / 2)];
  } catch { return null; }
}

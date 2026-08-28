import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import sharp from "sharp";

export const dynamic = "force-dynamic";

const MINIO_INTERNAL = process.env.MINIO_ENDPOINT
  ? `http://${process.env.MINIO_ENDPOINT}:${process.env.MINIO_PORT ?? 9000}`
  : "http://minio:9000";
const BUCKET = process.env.MINIO_BUCKET ?? "collection-images";

const GOLD = "#C9A84C";
const NAVY = "#0f1f2e";
const GRAY = "#555555";
const LIGHT = "#eeeeee";

async function fetchThumbnail(storageKey: string): Promise<Buffer | null> {
  try {
    const url = `${MINIO_INTERNAL}/${BUCKET}/${storageKey}`;
    const res = await fetch(url, { signal: AbortSignal.timeout(8000) });
    if (!res.ok) return null;
    const raw = Buffer.from(await res.arrayBuffer());
    // Resize to 60×80 max, convert to JPEG for small PDF footprint
    return await sharp(raw)
      .resize(60, 80, { fit: "inside", withoutEnlargement: true })
      .flatten({ background: { r: 255, g: 255, b: 255 } })
      .jpeg({ quality: 70 })
      .toBuffer();
  } catch {
    return null;
  }
}

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const userId = (session.user as { id: string }).id;

    const items = await db.collectionItem.findMany({
      where: { userId },
      include: {
        product: { include: { producer: { include: { region: true } } } },
        images: { where: { isPrimary: true }, take: 1 },
        valuations: { orderBy: { valuedAt: "desc" }, take: 1 },
      },
      orderBy: [{ product: { category: "asc" } }, { product: { name: "asc" } }],
    });

    const totalValue = items.reduce((s, i) => s + (i.valuations[0]?.value ?? 0) * i.quantity, 0);
    const byCategory = items.reduce<Record<string, typeof items>>((acc, i) => {
      const cat = i.product?.category ?? "other";
      (acc[cat] = acc[cat] ?? []).push(i);
      return acc;
    }, {});

    const aud = (v: number) =>
      new Intl.NumberFormat("en-AU", { style: "currency", currency: "AUD", maximumFractionDigits: 0 }).format(v);

    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const PDFDocument = require("pdfkit") as typeof import("pdfkit");
    const doc = new PDFDocument({
      size: "A4",
      margin: 40,
      bufferPages: true,
      info: { Title: "Collection Report", Author: "My Collection" },
    });

    const chunks: Buffer[] = [];
    doc.on("data", (c: Buffer) => chunks.push(c));

    const pageW = doc.page.width;
    const pageH = doc.page.height;
    const margin = 40;
    const contentW = pageW - margin * 2;

    // ── Header band ──────────────────────────────────────────────────────
    doc.rect(0, 0, pageW, 110).fill(NAVY);
    doc.fillColor(GOLD).fontSize(28).font("Helvetica-Bold").text("My Collection", margin, 28);
    doc.fillColor("#ffffff").fontSize(11).font("Helvetica").text(
      `Report generated ${new Date().toLocaleDateString("en-AU", { day: "numeric", month: "long", year: "numeric" })}`,
      margin, 65
    );

    // ── Summary boxes ────────────────────────────────────────────────────
    const boxY = 125;
    const boxW = (contentW - 20) / 3;
    const summaryData = [
      { label: "Total Bottles", value: String(items.length) },
      { label: "Total Value", value: aud(totalValue) },
      { label: "Categories", value: Object.keys(byCategory).map(k => `${k}: ${byCategory[k].length}`).join("  ·  ") },
    ];
    summaryData.forEach(({ label, value }, i) => {
      const x = margin + i * (boxW + 10);
      doc.rect(x, boxY, boxW, 52).fillAndStroke("#f5f5f5", LIGHT);
      doc.fillColor(GOLD).fontSize(8).font("Helvetica-Bold").text(label.toUpperCase(), x + 8, boxY + 8);
      doc.fillColor(NAVY).fontSize(i === 2 ? 8 : 14).font("Helvetica-Bold").text(value, x + 8, boxY + 22, { width: boxW - 16 });
    });

    let y = boxY + 72;

    for (const [cat, catItems] of Object.entries(byCategory)) {
      if (y > pageH - 80) { doc.addPage(); y = margin; }

      // Category heading
      doc.rect(margin, y, contentW, 20).fill(NAVY);
      doc.fillColor(GOLD).fontSize(10).font("Helvetica-Bold").text(cat.toUpperCase(), margin + 8, y + 5);
      y += 28;

      // Column headers — lineBreak:false prevents pdfkit cursor drift on multi-column draws
      doc.fillColor(GRAY).fontSize(7).font("Helvetica-Bold");
      const C = { name: margin + 44, dist: margin + 200, region: margin + 288, age: margin + 362, abv: margin + 392, status: margin + 424, value: margin + 476 };
      doc.text("NAME", C.name, y, { lineBreak: false });
      doc.text("DISTILLERY", C.dist, y, { lineBreak: false });
      doc.text("REGION", C.region, y, { lineBreak: false });
      doc.text("AGE", C.age, y, { lineBreak: false });
      doc.text("ABV", C.abv, y, { lineBreak: false });
      doc.text("STATUS", C.status, y, { lineBreak: false });
      doc.text("VALUE", C.value, y, { width: contentW - (C.value - margin), align: "right", lineBreak: false });
      doc.y = y + 12; doc.x = margin;
      y += 12;
      doc.rect(margin, y, contentW, 0.5).fill(LIGHT);
      y += 6;

      // truncate helper — pdfkit width wraps (not clips); we truncate to avoid cursor blowout
      const clip = (s: string, maxPt: number, ptPerChar = 4.2) => {
        const max = Math.floor(maxPt / ptPerChar);
        return s.length > max ? s.slice(0, max - 1) + "…" : s;
      };

      for (let ri = 0; ri < catItems.length; ri++) {
        const item = catItems[ri];
        const rowH = 38;
        if (y + rowH > pageH - margin) { doc.addPage(); y = margin; }

        const p = item.product;
        const displayName = p?.name ?? item.customName ?? "Unnamed";
        const val = item.valuations[0]?.value;

        if (ri % 2 === 0) doc.rect(margin, y - 2, contentW, rowH).fill("#fafafa");

        // Thumbnail (resized to small size before embedding)
        const imgKey = item.images[0]?.storageKey;
        if (imgKey) {
          const imgBuf = await fetchThumbnail(imgKey);
          if (imgBuf) {
            try { doc.image(imgBuf, margin, y, { width: 30, height: 34, fit: [30, 34] }); }
            catch { /* skip broken */ }
          }
        }

        doc.fillColor(NAVY).fontSize(8).font("Helvetica-Bold")
          .text(clip(displayName, 148, 4.8), C.name, y + 2, { lineBreak: false });
        doc.fillColor(GRAY).fontSize(7).font("Helvetica");
        if (p?.smwsCode) doc.text(p.smwsCode, C.name, y + 13, { lineBreak: false });

        doc.text(clip(p?.producer?.name ?? "—", 84), C.dist, y + 2, { lineBreak: false });
        doc.text(clip(p?.producer?.region?.name ?? "—", 70), C.region, y + 2, { lineBreak: false });
        doc.text(p?.age != null ? `${p.age} yr` : "NAS", C.age, y + 2, { lineBreak: false });
        doc.text(p?.abv != null ? `${p.abv}%` : "—", C.abv, y + 2, { lineBreak: false });
        doc.text(item.status, C.status, y + 2, { lineBreak: false });

        if (val != null) {
          doc.fillColor(GOLD).fontSize(8).font("Helvetica-Bold")
            .text(aud(val), C.value, y + 2, { width: contentW - (C.value - margin), align: "right", lineBreak: false });
        } else {
          doc.fillColor(GRAY).fontSize(8).font("Helvetica")
            .text("—", C.value, y + 2, { width: contentW - (C.value - margin), align: "right", lineBreak: false });
        }

        // Explicitly reset pdfkit cursor after every row so it can't drift past page bottom
        doc.y = y + rowH; doc.x = margin;

        doc.rect(margin, y + rowH - 3, contentW, 0.3).fill(LIGHT);
        y += rowH;
      }
      y += 12;
    }

    // Footer on last page
    if (y < pageH - 60) {
      doc.rect(margin, y + 10, contentW, 0.5).fill(LIGHT);
      doc.fillColor(GRAY).fontSize(7).font("Helvetica")
        .text(`Total collection value: ${aud(totalValue)}  ·  ${items.length} bottles  ·  Generated ${new Date().toISOString().slice(0, 10)}`,
          margin, y + 18, { align: "center", width: contentW });
    }

    // Page numbers — must be added BEFORE doc.end()
    const range = doc.bufferedPageRange();
    // pageNumY must be < pageH - margin (= 801.89 for A4/40pt margins); beyond that pdfkit adds a new page
    const pageNumY = pageH - margin - 12;
    for (let i = 0; i < range.count; i++) {
      doc.switchToPage(range.start + i);
      doc.x = margin; doc.y = margin;
      doc.fillColor(GRAY).fontSize(7).font("Helvetica")
        .text(`Page ${i + 1} of ${range.count}`, margin, pageNumY, { align: "right", width: contentW, lineBreak: false });
    }

    doc.end();
    await new Promise<void>((res) => doc.on("end", res));

    const pdf = Buffer.concat(chunks);
    const filename = `collection-report-${new Date().toISOString().slice(0, 10)}.pdf`;
    return new NextResponse(pdf, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Content-Length": String(pdf.length),
      },
    });
  } catch (err) {
    console.error("[PDF export error]", err);
    return NextResponse.json({ error: "Export failed", detail: String(err) }, { status: 500 });
  }
}

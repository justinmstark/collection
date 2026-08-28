import { PrismaClient } from "@prisma/client";

const db = new PrismaClient();

// Exchange rates as of 2026-08-25: GBP→AUD 1.9061, CAD→AUD 1.0112
const GBP = 1.9061;
const CAD = 1.0112;

const valuations = [
  { smwsCode: "63.105", valueAUD: Math.round(90     * GBP * 100) / 100, source: "smws.com (GBP→AUD @1.9061, out of stock)" },
  { smwsCode: "63.118", valueAUD: Math.round(144    * GBP * 100) / 100, source: "Whisky International Online (GBP→AUD @1.9061)" },
  { smwsCode: "70.67",  valueAUD: Math.round(115    * GBP * 100) / 100, source: "smws.com (GBP→AUD @1.9061)" },
  { smwsCode: "78.91",  valueAUD: Math.round(132    * GBP * 100) / 100, source: "Whisky International Online (GBP→AUD @1.9061)" },
  { smwsCode: "140.14", valueAUD: 234.70,                               source: "Strath Liquor (AUD)" },
  { smwsCode: "144.4",  valueAUD: Math.round(249.48 * CAD * 100) / 100, source: "Kensington Wine Market (CAD→AUD @1.0112)" },
];

async function main() {
  for (const v of valuations) {
    const product = await db.product.findFirst({ where: { smwsCode: v.smwsCode } });
    if (!product) { console.error(`No product for ${v.smwsCode}`); continue; }
    const item = await db.collectionItem.findFirst({ where: { productId: product.id } });
    if (!item) { console.error(`No item for ${v.smwsCode}`); continue; }

    await db.valuation.deleteMany({ where: { collectionItemId: item.id } });
    await db.valuation.create({
      data: { collectionItemId: item.id, value: v.valueAUD, source: v.source },
    });

    console.log(`✓ ${v.smwsCode}  A$${v.valueAUD.toFixed(2)}  ${v.source}`);
  }
}

main()
  .catch(console.error)
  .finally(() => db.$disconnect());

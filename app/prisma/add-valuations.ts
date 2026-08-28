import { PrismaClient } from "@prisma/client";

const db = new PrismaClient();

const valuations = [
  { smwsCode: "63.105", value: 90,     source: "smws.com (GBP, out of stock — last known price)" },
  { smwsCode: "63.118", value: 144,    source: "Whisky International Online (GBP inc VAT)" },
  { smwsCode: "70.67",  value: 115,    source: "smws.com (GBP, currently available)" },
  { smwsCode: "78.91",  value: 132,    source: "Whisky International Online (GBP inc VAT)" },
  { smwsCode: "144.4",  value: 249.48, source: "Kensington Wine Market (CAD)" },
  // 140.14 already has AUD $234.70 from previous update
  // 71.109 — members room only, no retail price found
];

async function main() {
  for (const v of valuations) {
    const product = await db.product.findFirst({ where: { smwsCode: v.smwsCode } });
    if (!product) { console.error(`No product for ${v.smwsCode}`); continue; }

    const item = await db.collectionItem.findFirst({ where: { productId: product.id } });
    if (!item) { console.error(`No item for ${v.smwsCode}`); continue; }

    // Remove any existing valuation then add fresh one
    await db.valuation.deleteMany({ where: { collectionItemId: item.id } });

    await db.valuation.create({
      data: {
        collectionItemId: item.id,
        value: v.value,
        source: v.source,
      },
    });

    console.log(`✓ ${v.smwsCode}  ${v.value}  ${v.source}`);
  }

  console.log("\n  71.109 (A Nordic Cranachan) — members room only, no retail price available");
}

main()
  .catch(console.error)
  .finally(() => db.$disconnect());

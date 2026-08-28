import { PrismaClient } from "@prisma/client";

const db = new PrismaClient();

const updates = [
  {
    smwsCode: "63.105",
    name: "Dangerously Gorgeous",
    producer: "Glentauchers",
    region: "Speyside", country: "Scotland",
    abv: 53.8,
    caskType: "1st fill ex-bourbon barrel",
  },
  {
    smwsCode: "63.118",
    name: "Cobblers and Confectioners",
    producer: "Glentauchers",
    region: "Speyside", country: "Scotland",
    abv: 58.2,
    caskType: "1st fill PX barrique",
  },
  {
    smwsCode: "70.67",
    name: "Through the Window, Brambles",
    producer: "Balblair",
    region: "Highland", country: "Scotland",
    abv: 57.7,
    caskType: "1st fill American oak toasted barrique",
  },
  {
    smwsCode: "71.109",
    name: "A Nordic Cranachan",
    producer: "Glenburgie",
    region: "Speyside", country: "Scotland",
    abv: 54.3,
    caskType: "1st fill ex-bourbon barrel",
  },
  {
    smwsCode: "78.91",
    name: "A Rugged Highlander",
    producer: "Ben Nevis",
    region: "Highland", country: "Scotland",
    abv: 57.4,
    caskType: "1st fill ex-bourbon hogshead",
  },
  {
    smwsCode: "140.14",
    name: "Cowpuncher Rodeo Dram",
    producer: "Balcones",
    region: "Texas", country: "USA",
    abv: 61.8,
    caskType: "Ex-Texas Rumble → 1st fill ex-bourbon",
    valueAUD: 234.70,
  },
  {
    smwsCode: "144.4",
    name: "A Flashing Blade",
    producer: "High Coast",
    region: "Ångermanland", country: "Sweden",
    abv: 60.8,
    caskType: "1st fill ex-bourbon barrel",
  },
];

async function main() {
  for (const u of updates) {
    const region = await db.region.upsert({
      where: { name: u.region },
      update: { country: u.country },
      create: { name: u.region, country: u.country },
    });

    let producer = await db.producer.findFirst({ where: { name: u.producer } });
    if (producer) {
      producer = await db.producer.update({
        where: { id: producer.id },
        data: { regionId: region.id },
      });
    } else {
      producer = await db.producer.create({
        data: { name: u.producer, regionId: region.id },
      });
    }

    const product = await db.product.findFirst({ where: { smwsCode: u.smwsCode } });
    if (!product) { console.error(`No product found for ${u.smwsCode}`); continue; }

    await db.product.update({
      where: { id: product.id },
      data: {
        name: u.name,
        producerId: producer.id,
        abv: u.abv,
        caskType: u.caskType,
      },
    });

    if (u.valueAUD) {
      const item = await db.collectionItem.findFirst({ where: { productId: product.id } });
      if (item) {
        await db.valuation.create({
          data: {
            collectionItemId: item.id,
            value: u.valueAUD,
            source: "Strath Liquor (AUD)",
          },
        });
      }
    }

    console.log(`✓ ${u.smwsCode}  ${u.name}  ${u.producer}  ${u.abv}%`);
  }

  // Clean up any orphaned producers from the old wrong distillery names
  const stale = ["Mannochmore", "Miltonduff", "Deanston"];
  for (const name of stale) {
    const p = await db.producer.findFirst({ where: { name } });
    if (p) {
      const linked = await db.product.count({ where: { producerId: p.id } });
      if (linked === 0) {
        await db.producer.delete({ where: { id: p.id } });
        console.log(`  removed stale producer: ${name}`);
      }
    }
  }
}

main()
  .catch(console.error)
  .finally(() => db.$disconnect());

import { PrismaClient } from "@prisma/client";
const db = new PrismaClient();

const updates = [
  {
    smwsCode: "9.244",
    name: "Sheer Pleasure",
    age: 18, abv: 56.8, caskType: "1st fill bourbon barrel",
    valueAUD: 269, valueSource: "SMWS Australia (AUD)",
  },
  {
    smwsCode: "10.277",
    name: "Fire Without Smoke",
    age: 11, abv: 64.1, caskType: "Ex-bourbon hogshead into 2nd fill ex-American oak PX hogshead",
    valueAUD: 240, valueSource: "SMWS Australia (AUD)",
  },
  {
    smwsCode: "3.184",
    name: "Arabesques of ash and high kicks of coal",
    age: 15, abv: 61.0, caskType: "Refill hogshead / ex-bourbon",
    valueAUD: null, valueSource: null,
  },
  {
    smwsCode: "9.66",
    name: "Melo-dram-atic",
    age: 14, abv: 56.5, caskType: "Refill ex-bourbon hogshead",
    valueAUD: null, valueSource: null,
  },
  {
    smwsCode: "10.275",
    name: "Scoobie Snack",
    age: 11, abv: 60.1, caskType: "ex-Bourbon hogshead; 2nd fill ex-PX butt finish",
    valueAUD: null, valueSource: null,
  },
];

async function main() {
  for (const u of updates) {
    const p = await db.product.findFirst({ where: { smwsCode: u.smwsCode } });
    if (!p) { console.error(`Not found: ${u.smwsCode}`); continue; }

    await db.product.update({
      where: { id: p.id },
      data: { name: u.name, age: u.age, abv: u.abv, caskType: u.caskType },
    });

    if (u.valueAUD) {
      const item = await db.collectionItem.findFirst({ where: { productId: p.id } });
      if (item) {
        await db.valuation.deleteMany({ where: { collectionItemId: item.id } });
        await db.valuation.create({
          data: { collectionItemId: item.id, value: u.valueAUD, source: u.valueSource! },
        });
      }
    }

    const price = u.valueAUD ? `A$${u.valueAUD}` : "—";
    console.log(`✓ ${u.smwsCode}  "${u.name}"  ${u.age}yr  ${u.abv}%  ${price}`);
  }
}

main().catch(console.error).finally(() => db.$disconnect());

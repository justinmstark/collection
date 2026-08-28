import { PrismaClient } from "@prisma/client";
const db = new PrismaClient();

const GBP = 1.9061;
const CAD = 1.0112;

const bottles = [
  {
    smwsCode: "3.184",
    name: "SMWS 3.184",          // name not found online
    producer: "Bowmore", region: "Islay", country: "Scotland",
    age: null, abv: null, caskType: null,
    valueAUD: null, valueSource: null,
  },
  {
    smwsCode: "3.347",
    name: "An Ode to Intensity",
    producer: "Bowmore", region: "Islay", country: "Scotland",
    age: 18, abv: 55.7, caskType: "2nd fill ex-bourbon hogshead",
    valueAUD: null, valueSource: null,
  },
  {
    smwsCode: "6.83",
    name: "SMWS 6.83",           // name unconfirmed
    producer: "Macduff", region: "Highland", country: "Scotland",
    age: 17, abv: 53.6, caskType: "1st fill oloroso hogshead",
    valueAUD: Math.round(99 * GBP * 100) / 100,
    valueSource: "smws.com approx (GBP→AUD @1.9061)",
  },
  {
    smwsCode: "9.66",
    name: "SMWS 9.66",           // name not found online
    producer: "Glen Grant", region: "Speyside", country: "Scotland",
    age: null, abv: null, caskType: null,
    valueAUD: null, valueSource: null,
  },
  {
    smwsCode: "9.244",
    name: "A Pleasant Sunny Disposition",
    producer: "Glen Grant", region: "Speyside", country: "Scotland",
    age: 31, abv: 56.7, caskType: "1st fill ex-bourbon barrel",
    valueAUD: null, valueSource: null,
  },
  {
    smwsCode: "10.241",
    name: "Sound of Singing Sand",
    producer: "Bunnahabhain", region: "Islay", country: "Scotland",
    age: 9, abv: 58.8, caskType: "2nd fill ex-PX hogshead",
    valueAUD: null, valueSource: "out of stock",
  },
  {
    smwsCode: "10.275",
    name: "SMWS 10.275",         // name not found online
    producer: "Bunnahabhain", region: "Islay", country: "Scotland",
    age: null, abv: null, caskType: null,
    valueAUD: null, valueSource: null,
  },
  {
    smwsCode: "10.277",
    name: "Fire Without Smoke",
    producer: "Bunnahabhain", region: "Islay", country: "Scotland",
    age: 11, abv: 64.1, caskType: "Ex-bourbon hogshead + 2nd fill PX hogshead",
    valueAUD: Math.round(207.99 * CAD * 100) / 100,
    valueSource: "Kensington Wine Market (CAD→AUD @1.0112)",
  },
];

async function main() {
  const admin = await db.user.findUniqueOrThrow({ where: { email: "admin@collection.local" } });

  for (const b of bottles) {
    const region = await db.region.upsert({
      where: { name: b.region },
      update: {},
      create: { name: b.region, country: b.country },
    });

    let producer = await db.producer.findFirst({ where: { name: b.producer } });
    if (!producer) {
      producer = await db.producer.create({ data: { name: b.producer, regionId: region.id } });
    }

    const product = await db.product.create({
      data: {
        name: b.name,
        producerId: producer.id,
        category: "whisky",
        subcategory: "Single Malt Scotch",
        age: b.age,
        abv: b.abv,
        caskType: b.caskType,
        smwsCode: b.smwsCode,
      },
    });

    const item = await db.collectionItem.create({
      data: { userId: admin.id, productId: product.id, status: "sealed", quantity: 1 },
    });

    if (b.valueAUD && b.valueSource !== "out of stock") {
      await db.valuation.create({
        data: { collectionItemId: item.id, value: b.valueAUD, source: b.valueSource! },
      });
    }

    const price = b.valueAUD ? `A$${b.valueAUD.toFixed(2)}` : "—";
    console.log(`✓ ${b.smwsCode}  ${b.producer}  ${b.name}  ${b.age ? b.age + "yr" : "—"}  ${price}`);
  }
}

main().catch(console.error).finally(() => db.$disconnect());

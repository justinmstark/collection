import { PrismaClient } from "@prisma/client";

const db = new PrismaClient();

const bottles = [
  {
    smwsCode: "63.105",
    name: "Dangerously Gorgeous",
    producer: "Mannochmore",
    region: "Speyside",
    country: "Scotland",
    category: "whisky",
    subcategory: "Single Malt Scotch",
    age: 20,
  },
  {
    smwsCode: "63.118",
    name: "Doodlers and Confectioners",
    producer: "Mannochmore",
    region: "Speyside",
    country: "Scotland",
    category: "whisky",
    subcategory: "Single Malt Scotch",
    age: 15,
  },
  {
    smwsCode: "70.67",
    name: "Through the Whadow, Brambles",
    producer: "Glenburgie",
    region: "Speyside",
    country: "Scotland",
    category: "whisky",
    subcategory: "Single Malt Scotch",
    age: 17,
  },
  {
    smwsCode: "71.109",
    name: "A Nordic Cranachan",
    producer: "Miltonduff",
    region: "Speyside",
    country: "Scotland",
    category: "whisky",
    subcategory: "Single Malt Scotch",
    age: 15,
  },
  {
    smwsCode: "78.91",
    name: "A Rugged Highlander",
    producer: "Deanston",
    region: "Highland",
    country: "Scotland",
    category: "whisky",
    subcategory: "Single Malt Scotch",
    age: 12,
  },
  {
    smwsCode: "140.14",
    name: "Cowpuncher Rodeo Dram",
    producer: "Balcones",
    region: "Texas",
    country: "USA",
    category: "whisky",
    subcategory: "American Single Malt",
    age: 4,
  },
  {
    smwsCode: "144.4",
    name: "A Flashing Blade",
    producer: "High Coast",
    region: "Ångermanland",
    country: "Sweden",
    category: "whisky",
    subcategory: "Single Malt",
    age: 7,
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

    const producer = await db.producer.upsert({
      where: { id: (await db.producer.findFirst({ where: { name: b.producer } }))?.id ?? "none" },
      update: {},
      create: { name: b.producer, regionId: region.id },
    });

    const product = await db.product.create({
      data: {
        name: b.name,
        producerId: producer.id,
        category: b.category,
        subcategory: b.subcategory,
        age: b.age,
        smwsCode: b.smwsCode,
      },
    });

    await db.collectionItem.create({
      data: {
        userId: admin.id,
        productId: product.id,
        status: "sealed",
        quantity: 1,
      },
    });

    console.log(`✓ ${b.smwsCode}  ${b.name}`);
  }
}

main()
  .catch(console.error)
  .finally(() => db.$disconnect());

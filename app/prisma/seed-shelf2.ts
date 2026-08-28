import { PrismaClient } from "@prisma/client";

const db = new PrismaClient();

// Exchange rates 2026-08-25: GBP×1.9061, USD×1.55, EUR×1.70
const GBP = 1.9061;
const USD = 1.55;
const EUR = 1.70;

const bottles = [
  {
    smwsCode: "17.28",
    name: "Black Pepper and Custard Creams",
    producer: "Scapa",
    region: "Islands", country: "Scotland",
    category: "whisky", subcategory: "Single Malt Scotch",
    age: null, abv: null, caskType: null,
    valueAUD: null, valueSource: null,
  },
  {
    smwsCode: "19.74",
    name: "Dessert Mirage",
    producer: "Glen Garioch",
    region: "Highland", country: "Scotland",
    category: "whisky", subcategory: "Single Malt Scotch",
    age: 19, abv: 51.3, caskType: "1st fill ex-bourbon barrel",
    valueAUD: Math.round(399.99 * USD * 100) / 100,
    valueSource: "CaskCartel (USD→AUD @1.55, backordered)",
  },
  {
    smwsCode: "33.124",
    name: "An Engineer's Lunchbox",
    producer: "Ardbeg",
    region: "Islay", country: "Scotland",
    category: "whisky", subcategory: "Single Malt Scotch",
    age: 7, abv: 59.7, caskType: "1st fill ex-Sherry butt",
    valueAUD: Math.round(299 * EUR * 100) / 100,
    valueSource: "Whiskybase secondary market avg (EUR→AUD @1.70)",
  },
  {
    smwsCode: "35.331",
    name: "Life-Changing Magnificence",
    producer: "Glen Moray",
    region: "Speyside", country: "Scotland",
    category: "whisky", subcategory: "Single Malt Scotch",
    age: 27, abv: 55.7, caskType: "1st fill toasted oak hogshead",
    valueAUD: null, valueSource: null,
  },
  {
    smwsCode: "53.526",
    name: "Pleasures Rare",
    producer: "Caol Ila",
    region: "Islay", country: "Scotland",
    category: "whisky", subcategory: "Single Malt Scotch",
    age: 15, abv: null, caskType: null,
    valueAUD: null, valueSource: null,
  },
  {
    smwsCode: "55.76",
    name: "Petals in an Orange Bitters Cocktail",
    producer: "Royal Brackla",
    region: "Highland", country: "Scotland",
    category: "whisky", subcategory: "Single Malt Scotch",
    age: 15, abv: 56.3, caskType: "1st fill ex-Oloroso sherry hogshead",
    valueAUD: Math.round(89.50 * GBP * 100) / 100,
    valueSource: "smws.com (GBP→AUD @1.9061, out of stock)",
  },
  {
    smwsCode: "55.90",
    name: "Chocolate Crème Brûlée with Redcurrants",
    producer: "Royal Brackla",
    region: "Highland", country: "Scotland",
    category: "whisky", subcategory: "Single Malt Scotch",
    age: 15, abv: 55.2, caskType: "2nd fill STR barrique finish",
    valueAUD: null, valueSource: null,
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
      producer = await db.producer.create({
        data: { name: b.producer, regionId: region.id },
      });
    }

    const product = await db.product.create({
      data: {
        name: b.name,
        producerId: producer.id,
        category: b.category,
        subcategory: b.subcategory,
        age: b.age,
        abv: b.abv,
        caskType: b.caskType,
        smwsCode: b.smwsCode,
      },
    });

    const item = await db.collectionItem.create({
      data: { userId: admin.id, productId: product.id, status: "sealed", quantity: 1 },
    });

    if (b.valueAUD && b.valueSource) {
      await db.valuation.create({
        data: { collectionItemId: item.id, value: b.valueAUD, source: b.valueSource },
      });
    }

    const price = b.valueAUD ? `A$${b.valueAUD.toFixed(2)}` : "—";
    console.log(`✓ ${b.smwsCode}  ${b.producer}  ${b.name}  ${price}`);
  }
}

main()
  .catch(console.error)
  .finally(() => db.$disconnect());

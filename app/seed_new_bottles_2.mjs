import { PrismaClient } from "@prisma/client";
const db = new PrismaClient();

const user = await db.user.findUnique({ where: { email: "admin@collection.local" } });
if (!user) { console.error("User not found"); process.exit(1); }

async function upsertRegion(name, country) {
  return db.region.upsert({ where: { name }, update: {}, create: { name, country } });
}
async function upsertProducer(name, regionId) {
  const existing = await db.producer.findFirst({ where: { name } });
  if (existing) return existing;
  return db.producer.create({ data: { name, regionId } });
}

async function addBottle({ name, producerName, regionName, country, category, subcategory, age, abv, caskType, description, value, valueSource }) {
  const region = await upsertRegion(regionName, country);
  const producer = await upsertProducer(producerName, region.id);
  const existing = await db.product.findFirst({ where: { name } });
  let product = existing;
  if (!product) {
    product = await db.product.create({
      data: { name, producerId: producer.id, category, subcategory, age, abv, caskType, description },
    });
  }
  const item = await db.collectionItem.create({
    data: { userId: user.id, productId: product.id, quantity: 1, status: "sealed" },
  });
  if (value) {
    await db.valuation.create({
      data: { collectionItemId: item.id, value, source: valueSource ?? "Market price estimate (AUD)", valuedAt: new Date() },
    });
  }
  console.log(`✓ ${name}`);
  return item;
}

const bottles = [
  {
    name: "Glenmorangie The Quinta Ruban",
    producerName: "Glenmorangie", regionName: "Highlands", country: "Scotland",
    category: "whisky", subcategory: "Highland single malt",
    abv: 46.3, caskType: "Port Cask",
    description: "Highland Single Malt Scotch Whisky. Port Cask Extra Matured. Non Chill-Filtered.",
    value: 99, valueSource: "Australian retail estimate",
  },
  {
    name: "Glenmorangie Barrel Select Release 12 Calvados Cask",
    producerName: "Glenmorangie", regionName: "Highlands", country: "Scotland",
    category: "whisky", subcategory: "Highland single malt",
    age: 12, abv: 46, caskType: "Calvados Cask",
    description: "Barrel Select Release. Highland Single Malt. 12 Years. Calvados cask finish. Whisky Club exclusive.",
    value: 115, valueSource: "The Whisky Club (thewhiskyclub.com.au)",
  },
  {
    name: "Glenmorangie Barrel Select Release 12 Bourbon & Sherry Cask",
    producerName: "Glenmorangie", regionName: "Highlands", country: "Scotland",
    category: "whisky", subcategory: "Highland single malt",
    age: 12, abv: 46, caskType: "Bourbon & Sherry Cask",
    description: "Barrel Select Release. Highland Single Malt. 12 Years. Bourbon & Sherry cask finish. Whisky Club exclusive.",
    value: 115, valueSource: "The Whisky Club (thewhiskyclub.com.au)",
  },
  {
    name: "Glenmorangie Barrel Select Release 13",
    producerName: "Glenmorangie", regionName: "Highlands", country: "Scotland",
    category: "whisky", subcategory: "Highland single malt",
    age: 13, abv: 46, caskType: "Bourbon, Moscatel & New Oak",
    description: "Barrel Select Release. Highland Single Malt. 13 Years. Special sweet release. Whisky Club exclusive.",
    value: 120, valueSource: "The Whisky Club (thewhiskyclub.com.au)",
  },
  {
    name: "The Glenlivet 14 Years First Fill American Oak",
    producerName: "The Glenlivet", regionName: "Speyside", country: "Scotland",
    category: "whisky", subcategory: "Speyside single malt",
    age: 14, abv: 50.9, caskType: "First Fill American Oak",
    description: "Bottled from First Fill Casks. Non-chill filtered. Whisky Club exclusive. 700mL.",
    value: 175, valueSource: "The Whisky Club (thewhiskyclub.com.au)",
  },
  {
    name: "The Glenlivet Groundbreaker Collection",
    producerName: "The Glenlivet", regionName: "Speyside", country: "Scotland",
    category: "whisky", subcategory: "Speyside single malt",
    abv: 40, caskType: "Charred American Oak & European Red Wine Cask",
    description: "Groundbreaker Collection. Chapter 1: The Journey Inward. Finished in Charred American Oak & European Red Wine Casks. NAS.",
    value: 85, valueSource: "Australian retail estimate",
  },
  {
    name: "The Glenlivet Founder's Reserve",
    producerName: "The Glenlivet", regionName: "Speyside", country: "Scotland",
    category: "whisky", subcategory: "Speyside single malt",
    abv: 40,
    description: "Single Malt Scotch Whisky. Named for George Smith who established the distillery in 1824. 1 litre.",
    value: 75, valueSource: "Australian retail estimate",
  },
  {
    name: "Basil Hayden's Kentucky Straight Bourbon",
    producerName: "Beam Suntory", regionName: "Kentucky", country: "USA",
    category: "whisky", subcategory: "Kentucky straight bourbon",
    abv: 40,
    description: "Kentucky Straight Bourbon Whiskey. Artfully aged. Whisky Club exclusive. Basil Hayden began distilling in 1796.",
    value: 80, valueSource: "The Whisky Club (thewhiskyclub.com.au)",
  },
  {
    name: "Beenleigh 5 Year Old Double Barrel Rum",
    producerName: "Beenleigh Artisan Distillers", regionName: "Queensland", country: "Australia",
    category: "spirits", subcategory: "rum",
    age: 5, abv: 40, caskType: "Double Barrel",
    description: "Hand Crafted Rum. 5 Year Old. Double Barrel. Special Oak & Vanilla character. Australian Distilled Spirits Awards Gold 2016.",
    value: 65, valueSource: "Australian retail estimate",
  },
  {
    name: "The Glenlivet Archive 21 Years",
    producerName: "The Glenlivet", regionName: "Speyside", country: "Scotland",
    category: "whisky", subcategory: "Speyside single malt",
    age: 21, abv: 43,
    description: "Single Malt Scotch Whisky. Archive. 21 Years. Hand selected from the distillery archive. 500mL.",
    value: 280, valueSource: "Australian retail estimate",
  },
  {
    name: "Glen Grant 10 Years",
    producerName: "Glen Grant", regionName: "Speyside", country: "Scotland",
    category: "whisky", subcategory: "Speyside single malt",
    age: 10, abv: 40,
    description: "Rothes Speyside. Single Malt Scotch Whisky. Orchard fruits, vanilla & butterscotch.",
    value: 65, valueSource: "Australian retail estimate",
  },
  {
    name: "Glen Grant Aurora Wanderlust Collection",
    producerName: "Glen Grant", regionName: "Speyside", country: "Scotland",
    category: "whisky", subcategory: "Speyside single malt",
    abv: 40, caskType: "Bourbon Barrel & Oloroso Sherry Cask",
    description: "Speyside Single Malt Scotch Whisky. Aurora. Wanderlust Collection. Travel Exclusive. NAS. Light and vanilla with warm toasted oak.",
    value: 85, valueSource: "Travel retail estimate",
  },
  {
    name: "Glen Grant 15 Years Batch Strength",
    producerName: "Glen Grant", regionName: "Speyside", country: "Scotland",
    category: "whisky", subcategory: "Speyside single malt",
    age: 15, abv: 54.9,
    description: "Rothes Speyside. Single Malt Scotch Whisky. Aged 15 Years. Batch Strength 1st Edition. Spiced pears, toffee & apricot marmalade. Whisky Club exclusive.",
    value: 175, valueSource: "The Whisky Club (thewhiskyclub.com.au)",
  },
  {
    name: "Glen Grant 13 Years Non-Chill Filtered",
    producerName: "Glen Grant", regionName: "Speyside", country: "Scotland",
    category: "whisky", subcategory: "Speyside single malt",
    age: 13, abv: 46,
    description: "Rothes Speyside. Single Malt Scotch Whisky. Aged 13 Years. Non-Chill Filtered. Sweet apples, orchard fruits & toffee. Whisky Club exclusive.",
    value: 130, valueSource: "The Whisky Club (thewhiskyclub.com.au)",
  },
];

let added = 0;
for (const bottle of bottles) {
  await addBottle(bottle);
  added++;
}

console.log(`\nAdded ${added} bottles.`);
await db.$disconnect();

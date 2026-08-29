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

async function addBottle({ name, producerName, regionName, country, category, subcategory, age, abv, caskType, smwsCode, description, value, valueSource }) {
  const region = await upsertRegion(regionName, country);
  const producer = await upsertProducer(producerName, region.id);
  const existing = await db.product.findFirst({ where: { name } });
  let product = existing;
  if (!product) {
    product = await db.product.create({
      data: { name, producerId: producer.id, category, subcategory, age: age ?? null, abv: abv ?? null, caskType: caskType ?? null, smwsCode: smwsCode ?? null, description: description ?? null },
    });
  }
  const existingItem = await db.collectionItem.findFirst({ where: { userId: user.id, productId: product.id } });
  if (existingItem) { console.log(`⏭  ${name} (already in collection)`); return existingItem; }
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
  // ── Scotch ──────────────────────────────────────────────────────────────────
  {
    name: "Lagavulin 11 Year Old Offerman Edition Charred Oak Cask",
    producerName: "Lagavulin", regionName: "Islay", country: "Scotland",
    category: "whisky", subcategory: "single malt scotch",
    age: 11, abv: 46, caskType: "Charred Oak",
    description: "Islay Single Malt. Offerman Edition. Charred Oak Cask. 700ml.",
    value: 120, valueSource: "Australian retail estimate",
  },
  {
    name: "GlenDronach Original 12 Year Old",
    producerName: "GlenDronach", regionName: "Highlands", country: "Scotland",
    category: "whisky", subcategory: "single malt scotch",
    age: 12, abv: 43, caskType: "Pedro Ximenez & Oloroso Sherry Casks",
    description: "Highland Single Malt. Matured in combination of finest Pedro Ximenez and Oloroso Sherry casks. Non chill-filtered.",
    value: 90, valueSource: "Australian retail estimate",
  },
  {
    name: "GlenDronach 2013 Vintage 11 Year Old PX Cask",
    producerName: "GlenDronach", regionName: "Highlands", country: "Scotland",
    category: "whisky", subcategory: "single malt scotch",
    age: 11, abv: 60.1, caskType: "Pedro Ximenez Cask",
    description: "Highland Single Malt. 2013 Vintage. PX Cask Matured. 11 Year Old. Created exclusively for The Whisky Club. 700ml.",
    value: 145, valueSource: "The Whisky Club estimate",
  },
  {
    name: "GlenDronach Cask Strength Batch 11",
    producerName: "GlenDronach", regionName: "Highlands", country: "Scotland",
    category: "whisky", subcategory: "single malt scotch",
    age: null, abv: 50, caskType: "Oloroso & Pedro Ximenez Sherry Casks",
    description: "Highland Single Malt. Cask Strength Batch 11. Non chill-filtered. Natural colour. 700ml.",
    value: 130, valueSource: "Australian retail estimate",
  },
  {
    name: "Glenglassaugh 12 Year Old Pedro Ximenez Cask",
    producerName: "Glenglassaugh", regionName: "Highlands", country: "Scotland",
    category: "whisky", subcategory: "single malt scotch",
    age: 12, abv: 56.9, caskType: "Pedro Ximenez Cask",
    description: "Highland Single Malt. 12 Years Old. Pedro Ximenez Cask Matured. Whisky Club Exclusive. 700ml.",
    value: 135, valueSource: "The Whisky Club estimate",
  },
  {
    name: "Glengoyne 12 Year Old First Fill Edition",
    producerName: "Glengoyne", regionName: "Highlands", country: "Scotland",
    category: "whisky", subcategory: "single malt scotch",
    age: 12, abv: 43, caskType: "First Fill Sherry, Bourbon & Marsala Casks",
    description: "Highland Single Malt. Aged 12 Years. First Fill Edition. Travel Exclusive. 1L.",
    value: 110, valueSource: "Australian retail estimate",
  },
  {
    name: "Laphroaig PX Cask Triple Matured",
    producerName: "Laphroaig", regionName: "Islay", country: "Scotland",
    category: "whisky", subcategory: "single malt scotch",
    age: null, abv: 48, caskType: "PX Pedro Ximenez Cask",
    description: "Islay Single Malt. Triple Matured. Ex-bourbon barrels, then quarter casks, then European oak PX casks. 1L.",
    value: 115, valueSource: "Australian retail estimate",
  },
  {
    name: "Laphroaig An Cuan Mòr",
    producerName: "Laphroaig", regionName: "Islay", country: "Scotland",
    category: "whisky", subcategory: "single malt scotch",
    age: null, abv: 48, caskType: "Multi-continental cask",
    description: "Islay Single Malt. An Cuan Mòr ('The Ocean'). Travel Retail Exclusive. Matured in ex-bourbon barrels then finest European casks.",
    value: 105, valueSource: "Australian retail estimate",
  },
  {
    name: "A Dram for Party Animals",
    producerName: "Scotch Malt Whisky Society", regionName: "Speyside", country: "Scotland",
    category: "whisky", subcategory: "single malt scotch",
    age: 17, abv: 57.2, caskType: "Ex-Bourbon",
    smwsCode: "46.155",
    description: "SMWS Cask 46.155. A Dram for Party Animals. 17 Year Old. Speyside (Glenfarclas). Ex-Bourbon final cask. 1 of only 214 bottles.",
    value: 195, valueSource: "SMWS estimate",
  },
  {
    name: "Glenmorangie The Accord 12 Year Old",
    producerName: "Glenmorangie", regionName: "Highlands", country: "Scotland",
    category: "whisky", subcategory: "single malt scotch",
    age: 12, abv: 43, caskType: "Bourbon & Sherry Cask",
    description: "Highland Single Malt. Traveller's Exclusive. Aged 12 Years. Bourbon and Sherry Cask finish.",
    value: 99, valueSource: "Australian retail estimate",
  },
  {
    name: "Glenfiddich Special Old Reserve",
    producerName: "Glenfiddich", regionName: "Speyside", country: "Scotland",
    category: "whisky", subcategory: "single malt scotch",
    age: null, abv: 43, caskType: "Oak",
    description: "Speyside Single Malt. Special Old Reserve. Pure Malt Scotch Whisky. Vintage expression.",
    value: 80, valueSource: "Market estimate",
  },
  {
    name: "The Macallan Whisky Maker's Edition",
    producerName: "The Macallan", regionName: "Speyside", country: "Scotland",
    category: "whisky", subcategory: "single malt scotch",
    age: null, abv: 42.3, caskType: "Sherry Seasoned Oak",
    description: "Highland Single Malt. Whisky Maker's Edition. An exceptionally elegant single malt with a lingering finish. 700ml.",
    value: 130, valueSource: "Australian retail estimate",
  },
  {
    name: "The Lakes Whiskymaker's Editions Voyage",
    producerName: "The Lakes Distillery", regionName: "Lake District", country: "England",
    category: "whisky", subcategory: "english single malt",
    age: null, abv: 49, caskType: "Multi-cask",
    description: "English Single Malt. Whiskymaker's Editions. Limited Release Voyage. Made in England. 700ml.",
    value: 155, valueSource: "Australian retail estimate",
  },
  {
    name: "The Lakes Chocolatier",
    producerName: "The Lakes Distillery", regionName: "Lake District", country: "England",
    category: "whisky", subcategory: "english single malt",
    age: null, abv: 51, caskType: "Multi-cask",
    description: "English Single Malt. The Chocolatier. Celebrating fusion of flavour and artistry of chocolate. Limited Edition. 70cl.",
    value: 165, valueSource: "Australian retail estimate",
  },
  {
    name: "Talisker x Parley Wilder Seas",
    producerName: "Talisker", regionName: "Isle of Skye", country: "Scotland",
    category: "whisky", subcategory: "single malt scotch",
    age: null, abv: 45.8, caskType: "Oak",
    description: "Single Malt Scotch Whisky. Talisker x Parley. Wilder Seas. Limited Edition. In support of Wild Sea Forests. 700ml.",
    value: 89, valueSource: "Australian retail estimate",
  },
  {
    name: "Talisker Skye",
    producerName: "Talisker", regionName: "Isle of Skye", country: "Scotland",
    category: "whisky", subcategory: "single malt scotch",
    age: null, abv: 45.8, caskType: "Oak",
    description: "Single Malt Scotch Whisky. Talisker Skye. Elemental warm notes, verdant richness. Made by the sea. 1L.",
    value: 85, valueSource: "Australian retail estimate",
  },
  {
    name: "Talisker Dark Storm",
    producerName: "Talisker", regionName: "Isle of Skye", country: "Scotland",
    category: "whisky", subcategory: "single malt scotch",
    age: null, abv: 45.8, caskType: "Charred Casks",
    description: "Single Malt Scotch Whisky. Talisker Dark Storm. Matured in heavily charred casks. Made by the sea. 1L.",
    value: 95, valueSource: "Australian retail estimate",
  },
  {
    name: "Aberlour 15 Year Old Double Cask Matured",
    producerName: "Aberlour", regionName: "Speyside", country: "Scotland",
    category: "whisky", subcategory: "single malt scotch",
    age: 15, abv: 40, caskType: "Double Cask",
    description: "Speyside Single Highland Malt. Aged 15 Years. St. Drostan's Well. Double cask matured.",
    value: 95, valueSource: "Australian retail estimate",
  },
  {
    name: "Glenmorangie Dornoch Limited Edition",
    producerName: "Glenmorangie", regionName: "Highlands", country: "Scotland",
    category: "whisky", subcategory: "single malt scotch",
    age: null, abv: 43, caskType: "Amontillado Sherry Butts",
    description: "Highland Single Malt. Dornoch Limited Edition. Inspired by the unique natural environment around the Distillery. Amontillado sherry buts finish.",
    value: 110, valueSource: "Australian retail estimate",
  },
  {
    name: "Dalwhinnie Winter's Frost Game of Thrones House Stark",
    producerName: "Dalwhinnie", regionName: "Highlands", country: "Scotland",
    category: "whisky", subcategory: "single malt scotch",
    age: null, abv: 43, caskType: "Oak",
    description: "Highland Single Malt. Game of Thrones Limited Edition. House Stark – Winter is Coming. 700ml.",
    value: 95, valueSource: "Market estimate",
  },
  {
    name: "Ardbeg Smoketrails Limited Edition",
    producerName: "Ardbeg", regionName: "Islay", country: "Scotland",
    category: "whisky", subcategory: "single malt scotch",
    age: null, abv: 50.1, caskType: "Oak",
    description: "Islay Single Malt. Smoketrails. The Ultimate Islay Single Malt Scotch Whisky. Limited Edition.",
    value: 115, valueSource: "Australian retail estimate",
  },
  {
    name: "Grant's Ale Cask Finish Edition",
    producerName: "William Grant & Sons", regionName: "Speyside", country: "Scotland",
    category: "whisky", subcategory: "blended scotch",
    age: null, abv: 40, caskType: "Ale Cask",
    description: "Blended Scotch Whisky. Oak Edition. Ale Cask Finish. Finished in handpicked artisanal ale casks.",
    value: 45, valueSource: "Australian retail estimate",
  },
  {
    name: "Glen Scotia 2013 Vintage Bordeaux Red Wine Cask",
    producerName: "Glen Scotia", regionName: "Campbeltown", country: "Scotland",
    category: "whisky", subcategory: "single malt scotch",
    age: null, abv: 48.3, caskType: "Bordeaux Red Wine Cask",
    description: "Campbeltown Single Malt. Vintage 2013. Bordeaux Red Wine Cask Finish. Created exclusively for The Whisky Club. 700ml.",
    value: 135, valueSource: "The Whisky Club estimate",
  },
  {
    name: "Jura The Road",
    producerName: "Isle of Jura", regionName: "Islands", country: "Scotland",
    category: "whisky", subcategory: "single malt scotch",
    age: null, abv: 43.9, caskType: "Amoroso Sherry & American Oak",
    description: "Single Malt Scotch Whisky. The Road. Isle of Jura. Finished with 5 Hand-Picked Casks. Exclusively for Malt Master.",
    value: 85, valueSource: "Australian retail estimate",
  },
  {
    name: "Johnnie Walker Gold Label Reserve 18 Year Old",
    producerName: "Johnnie Walker", regionName: "Scotland", country: "Scotland",
    category: "whisky", subcategory: "blended scotch",
    age: 18, abv: 40, caskType: "Oak",
    description: "Blended Scotch Whisky. Gold Label Reserve. Aged 18 Years. Finest Scotch Whisky.",
    value: 90, valueSource: "Australian retail estimate",
  },
  {
    name: "Johnnie Walker Green Label 15 Year Old",
    producerName: "Johnnie Walker", regionName: "Scotland", country: "Scotland",
    category: "whisky", subcategory: "blended malt scotch",
    age: 15, abv: 43, caskType: "Oak",
    description: "Blended Malt Scotch Whisky. Green Label. Aged 15 Years. Pure Malt. 1L.",
    value: 85, valueSource: "Australian retail estimate",
  },
  {
    name: "Johnnie Walker Blue Label",
    producerName: "Johnnie Walker", regionName: "Scotland", country: "Scotland",
    category: "whisky", subcategory: "blended scotch",
    age: null, abv: 40, caskType: "Oak",
    description: "Blended Scotch Whisky. Blue Label. A blend of our very rarest whiskies. One in every ten thousand casks.",
    value: 260, valueSource: "Australian retail estimate",
  },
  // ── Australian Whisky ────────────────────────────────────────────────────────
  {
    name: "Hellyers Road Original 12 Year Old",
    producerName: "Hellyers Road Distillery", regionName: "Tasmania", country: "Australia",
    category: "whisky", subcategory: "australian single malt",
    age: 12, abv: 46.2, caskType: "Ex-Bourbon",
    description: "Tasmanian Single Malt Whisky. Original. Aged 12 Years. Product of Tasmania, Australia. 700ml.",
    value: 110, valueSource: "Australian retail estimate",
  },
  {
    name: "Dog & Gun Whisky",
    producerName: "Dog & Gun", regionName: "Australia", country: "Australia",
    category: "whisky", subcategory: "australian whisky",
    age: null, abv: null, caskType: null,
    description: "Australian Whisky. Dog & Gun Whisky.",
    value: 55, valueSource: "Market estimate",
  },
  {
    name: "Coastal Stone Ginger Beer Cask #1",
    producerName: "Coastal Stone Distillery", regionName: "New South Wales", country: "Australia",
    category: "whisky", subcategory: "australian single malt",
    age: null, abv: 54.6, caskType: "Ginger Beer Cask",
    description: "Australian Single Malt Whisky. Distilled by the Sea. Ginger Beer Cask #1. Distiller's Experimentation. 760ml.",
    value: 120, valueSource: "Market estimate",
  },
  {
    name: "Coastal Stone Bourbon Cask Element Series",
    producerName: "Coastal Stone Distillery", regionName: "New South Wales", country: "Australia",
    category: "whisky", subcategory: "australian single malt",
    age: null, abv: 46, caskType: "American Oak Bourbon Cask",
    description: "Australian Single Malt Whisky. Distilled by the Sea. Element Series. Bourbon Cask. Batch Third. 2021. 500ml.",
    value: 99, valueSource: "Market estimate",
  },
  // ── New Zealand ──────────────────────────────────────────────────────────────
  {
    name: "Pōkeno Origin",
    producerName: "Pōkeno Whisky Company", regionName: "Waikato", country: "New Zealand",
    category: "whisky", subcategory: "new zealand single malt",
    age: null, abv: 40, caskType: "Oak",
    description: "Aotearoa New Zealand Single Malt Whisky. Origin. Created exclusively for The Whisky Club. 700ml.",
    value: 115, valueSource: "The Whisky Club estimate",
  },
  // ── Irish Whiskey ─────────────────────────────────────────────────────────────
  {
    name: "Jameson Triple Triple",
    producerName: "Jameson", regionName: "County Cork", country: "Ireland",
    category: "whisky", subcategory: "irish whiskey",
    age: null, abv: 40, caskType: "Sherry, Bourbon and Malaga Casks",
    description: "Irish Whiskey. Triple Distilled. Triple Cask. Travel Exclusive. Sherry, Bourbon and Malaga casks. 700ml.",
    value: 75, valueSource: "Australian retail estimate",
  },
  {
    name: "Jameson Black Barrel",
    producerName: "Jameson", regionName: "County Cork", country: "Ireland",
    category: "whisky", subcategory: "irish whiskey",
    age: null, abv: 40, caskType: "Double Charred Bourbon Barrels",
    description: "Irish Whiskey. Jameson Black Barrel. Finished in double charred bourbon barrels.",
    value: 75, valueSource: "Australian retail estimate",
  },
  {
    name: "Jameson Gold Reserve",
    producerName: "Jameson", regionName: "County Cork", country: "Ireland",
    category: "whisky", subcategory: "irish whiskey",
    age: null, abv: 40, caskType: "Virgin Oak, Sherry, Bourbon",
    description: "Irish Whiskey. Jameson Gold Reserve. Finished in a marriage of virgin oak, sherry and bourbon barrels.",
    value: 90, valueSource: "Australian retail estimate",
  },
  {
    name: "Jameson Caskmates Stout Edition",
    producerName: "Jameson", regionName: "County Cork", country: "Ireland",
    category: "whisky", subcategory: "irish whiskey",
    age: null, abv: 40, caskType: "Stout Beer Barrels",
    description: "Irish Whiskey. Caskmates Stout Edition. Finished in craft stout beer barrels.",
    value: 68, valueSource: "Australian retail estimate",
  },
  // ── Indian Whisky ─────────────────────────────────────────────────────────────
  {
    name: "Amrut Indian Single Malt",
    producerName: "Amrut Distilleries", regionName: "Karnataka", country: "India",
    category: "whisky", subcategory: "indian single malt",
    age: null, abv: 46, caskType: "Oak",
    description: "Indian Single Malt Whisky. Made from select Indian barley, nurtured by water flowing from the Great Himalayas.",
    value: 95, valueSource: "Australian retail estimate",
  },
  {
    name: "Amrut Nativity",
    producerName: "Amrut Distilleries", regionName: "Karnataka", country: "India",
    category: "whisky", subcategory: "indian single malt",
    age: null, abv: 46, caskType: "Oak",
    description: "Indian Single Malt Whisky. Amrut Nativity. Matured and bottled in the Nilgiri foothills. 750ml.",
    value: 120, valueSource: "Australian retail estimate",
  },
  {
    name: "Amrut Fusion",
    producerName: "Amrut Distilleries", regionName: "Karnataka", country: "India",
    category: "whisky", subcategory: "indian single malt",
    age: null, abv: 50, caskType: "Oak",
    description: "Indian Single Malt Whisky. Fusion. A subtle fusion of Indian and Scottish barley to produce a whisky extraordinary in flavour.",
    value: 115, valueSource: "Australian retail estimate",
  },
  {
    name: "Paul John Port Select Cask",
    producerName: "John Distilleries", regionName: "Goa", country: "India",
    category: "whisky", subcategory: "indian single malt",
    age: null, abv: 52.3, caskType: "Port Cask",
    description: "Indian Single Malt Whisky. Port Select Cask. Non Chill-Filtered. Created exclusively for The Whisky Club. 70cl.",
    value: 135, valueSource: "The Whisky Club estimate",
  },
  // ── Japanese Whisky ───────────────────────────────────────────────────────────
  {
    name: "Hibiki 12 Year Old",
    producerName: "Suntory", regionName: "Japan", country: "Japan",
    category: "whisky", subcategory: "japanese blended whisky",
    age: 12, abv: 43, caskType: "Mizunara Oak, Ex-Bourbon, Sherry",
    description: "Japanese Blended Whisky. Hibiki. A harmonious blend of handcrafted specially aged whiskies.",
    value: 250, valueSource: "Australian retail estimate",
  },
  {
    name: "Suntory Royal Limited Design Bottle",
    producerName: "Suntory", regionName: "Japan", country: "Japan",
    category: "whisky", subcategory: "japanese blended whisky",
    age: null, abv: 43, caskType: "Oak",
    description: "Japanese Blended Whisky. Royal Suntory Whisky. Limited Design Bottle.",
    value: 110, valueSource: "Market estimate",
  },
  {
    name: "The Kyoto Malt Whisky",
    producerName: "Kyoto Miyako Distillery", regionName: "Japan", country: "Japan",
    category: "whisky", subcategory: "japanese malt whisky",
    age: null, abv: 43, caskType: "Oak",
    description: "Malt Whisky. Kyoto whisky by the only distillery in Kyoto dedicated to whisky. 700ml.",
    value: 150, valueSource: "Market estimate",
  },
  {
    name: "The Kurayoshi Pure Malt Sherry Cask",
    producerName: "Matsui Whisky", regionName: "Japan", country: "Japan",
    category: "whisky", subcategory: "japanese pure malt",
    age: null, abv: 43, caskType: "Sherry Cask",
    description: "Japanese Pure Malt Whisky. The Kurayoshi. Sherry Cask. Best Japanese Whisky IWC 2019. 700ml.",
    value: 120, valueSource: "Australian retail estimate",
  },
  {
    name: "Suntory World Whisky Ao",
    producerName: "Suntory", regionName: "Japan", country: "Japan",
    category: "whisky", subcategory: "world blended whisky",
    age: null, abv: 43, caskType: "Oak",
    description: "World Whisky. A blend of five major whiskies – Irish, Scotch, American, Canadian, and Japanese. 700ml.",
    value: 115, valueSource: "Australian retail estimate",
  },
  {
    name: "Nikka Whisky From The Barrel",
    producerName: "Nikka Whisky", regionName: "Japan", country: "Japan",
    category: "whisky", subcategory: "japanese blended whisky",
    age: null, abv: 51.4, caskType: "Oak",
    description: "Japanese Blended Whisky. Nikka Whisky From The Barrel. 500ml.",
    value: 90, valueSource: "Australian retail estimate",
  },
  {
    name: "Nikka Coffey Malt Whisky",
    producerName: "Nikka Whisky", regionName: "Japan", country: "Japan",
    category: "whisky", subcategory: "japanese malt whisky",
    age: null, abv: 45, caskType: "Oak",
    description: "Japanese Malt Whisky. Nikka Coffey Malt. Distilled in a Coffey still.",
    value: 120, valueSource: "Australian retail estimate",
  },
  // ── American Whiskey ──────────────────────────────────────────────────────────
  {
    name: "Willett Pot Still Reserve Bourbon",
    producerName: "Willett Distillery", regionName: "Kentucky", country: "USA",
    category: "whisky", subcategory: "kentucky straight bourbon",
    age: null, abv: 47, caskType: "New American Oak",
    description: "Kentucky Straight Bourbon Whiskey. Small Batch. Pot Still. Bardstown KY.",
    value: 95, valueSource: "Australian retail estimate",
  },
  {
    name: "Westward American Single Malt Vintage Muscat Cask",
    producerName: "Westward Whiskey", regionName: "Oregon", country: "USA",
    category: "whisky", subcategory: "american single malt",
    age: null, abv: 52.5, caskType: "Vintage Muscat Cask",
    description: "American Single Malt Whiskey. Vintage Muscat Cask. Born in Oregon, Raised in Australia. Whisky Club Exclusive. 700ml.",
    value: 155, valueSource: "The Whisky Club estimate",
  },
  // ── Rum ───────────────────────────────────────────────────────────────────────
  {
    name: "Bundaberg O.P. Rum",
    producerName: "Bundaberg Distilling Company", regionName: "Queensland", country: "Australia",
    category: "spirits", subcategory: "rum",
    age: null, abv: 57.7, caskType: null,
    description: "Over Proof Rum. Crafted and distilled for strength by the Bundaberg Distilling Company. 1125ml.",
    value: 55, valueSource: "Australian retail estimate",
  },
  {
    name: "Bundaberg Overproof Rum",
    producerName: "Bundaberg Distilling Company", regionName: "Queensland", country: "Australia",
    category: "spirits", subcategory: "rum",
    age: null, abv: 57.7, caskType: null,
    description: "Bundaberg Overproof. Extra Bold Rum. Distilled and aged then bottled at higher strength. 1125ml.",
    value: 55, valueSource: "Australian retail estimate",
  },
  {
    name: "Bundaberg Extra Smooth Red Rum",
    producerName: "Bundaberg Distilling Company", regionName: "Queensland", country: "Australia",
    category: "spirits", subcategory: "rum",
    age: null, abv: 37, caskType: null,
    description: "Bundaberg Extra Smooth Red. Triple filtered through red gum charcoal. Hints of brown sugar, caramel and honey. 1L.",
    value: 42, valueSource: "Australian retail estimate",
  },
  {
    name: "Bundaberg Master Distillers Collection Blenders Edition 2014",
    producerName: "Bundaberg Distilling Company", regionName: "Queensland", country: "Australia",
    category: "spirits", subcategory: "rum",
    age: null, abv: 40, caskType: "Oak",
    description: "Master Distillers Collection. Blenders Edition. Limited Release 2014. 700ml.",
    value: 75, valueSource: "Market estimate",
  },
  {
    name: "Inner Circle Rum 33 O.P. Full Strength",
    producerName: "Inner Circle", regionName: "Queensland", country: "Australia",
    category: "spirits", subcategory: "rum",
    age: null, abv: 75.9, caskType: null,
    description: "Traditional Pot Still Rum. 33 O.P. Full Strength. Australia's Premier Rum. 700ml.",
    value: 65, valueSource: "Australian retail estimate",
  },
  // ── Cognac ────────────────────────────────────────────────────────────────────
  {
    name: "Comte Joseph Fine Cognac VSOP",
    producerName: "Les Grands Chais de France", regionName: "Cognac", country: "France",
    category: "spirits", subcategory: "cognac",
    age: null, abv: 40, caskType: "Oak",
    description: "Fine Cognac. V.S.O.P. Appellation Cognac Contrôlée. Les Grands Chais de France, Petersbach.",
    value: 55, valueSource: "Market estimate",
  },
  // ── Liqueur ───────────────────────────────────────────────────────────────────
  {
    name: "Choya Organic Kokuto Umeshu",
    producerName: "Choya", regionName: "Japan", country: "Japan",
    category: "spirits", subcategory: "liqueur",
    age: null, abv: null, caskType: null,
    description: "Traditional Japanese Umeshu. Organic Kokuto (black sugar) plum liqueur.",
    value: 45, valueSource: "Market estimate",
  },
];

let added = 0, skipped = 0;
for (const b of bottles) {
  try {
    const item = await addBottle(b);
    if (item) added++;
  } catch (e) {
    console.error(`✗ ${b.name}: ${e.message}`);
  }
}

const total = await db.collectionItem.count({ where: { userId: user.id } });
console.log(`\nDone. Added: ${added}, Total collection: ${total}`);
await db.$disconnect();

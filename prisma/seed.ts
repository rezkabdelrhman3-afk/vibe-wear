import { PrismaPg } from "@prisma/adapter-pg";
import "dotenv/config";
import { PrismaClient } from "@prisma/client";
const db = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL! }),
});
async function main() {
  const collection = await db.collection.upsert({
    where: { slug: "chapter-01" },
    update: {},
    create: {
      name: "Chapter 01 / Socks",
      slug: "chapter-01",
      description: "The everyday starts here. A considered first chapter.",
      image: "/media/life-02.jpg",
    },
  });
  await db.siteSettings.upsert({
    where: { id: "site" },
    update: {},
    create: { id: "site" },
  });
  const items = [
    [
      "The Everyday Crew",
      "everyday-crew",
      "cream",
      "Chalk",
      "#e9e5da",
      22000,
      "An easy place to start. A clean crew silhouette, made for the space between plans.",
    ],
    [
      "The Quiet Stripe",
      "quiet-stripe",
      "stripe",
      "Ecru / Forest",
      "#d8d5c5",
      25000,
      "A familiar shape. A small point of difference.",
    ],
    [
      "The After Hours",
      "after-hours",
      "black",
      "Ink",
      "#252525",
      22000,
      "A darker note for whatever comes next.",
    ],
    [
      "The City Rib",
      "city-rib",
      "grey",
      "Concrete",
      "#999892",
      24000,
      "A tonal essential. Nothing extra.",
    ],
    [
      "The Daily Form",
      "daily-form",
      "stone",
      "Stone",
      "#c9bcaa",
      22000,
      "A neutral foundation for your own way of moving.",
    ],
    [
      "The Fine Line",
      "fine-line",
      "white",
      "Off-white",
      "#e7e4da",
      25000,
      "One quiet detail. A different perspective.",
    ],
  ] as const;
  for (const [name, slug, img, color, hex, price, story] of items) {
    await db.product.upsert({
      where: { slug },
      update: {},
      create: {
        name,
        slug,
        price,
        story,
        description:
          "Chapter 01 concept. A ribbed crew sock with a considered, understated finish. Demo product; final specifications and pricing will be confirmed before launch.",
        images: [
          `/media/${img}.jpg`,
          "/media/life-02.jpg",
          "/media/packaging-detail.jpg",
        ],
        features: [
          "Ribbed profile",
          "Subtle brand detail",
          "Everyday silhouette",
        ],
        composition: "Final composition will be published before launch.",
        fit: "Crew profile. Demo sizes EU 36–40 and EU 41–45; final fit to be confirmed.",
        care: "Follow the care label supplied with the final product.",
        category: "Socks",
        chapter: "01",
        status: "ACTIVE",
        collectionId: collection.id,
        variants: {
          create: ["36–40", "41–45"].map((size, i) => ({
            sku: `MSH-${slug.toUpperCase()}-${i}`,
            color,
            colorHex: hex,
            size,
            stock: slug === "fine-line" ? 0 : slug === "city-rib" ? 4 : 40,
            image: `/media/${img}.jpg`,
          })),
        },
      },
    });
  }
  const rates = [
    "Cairo",
    "Giza",
    "Alexandria",
    "Dakahlia",
    "Red Sea",
    "Beheira",
    "Fayoum",
    "Gharbia",
    "Ismailia",
    "Monufia",
    "Minya",
    "Qalyubia",
    "New Valley",
    "Suez",
    "Aswan",
    "Assiut",
    "Beni Suef",
    "Port Said",
    "Damietta",
    "Sharqia",
    "South Sinai",
    "Kafr El Sheikh",
    "Matrouh",
    "Luxor",
    "Qena",
    "North Sinai",
    "Sohag",
  ];
  for (const [i, governorate] of rates.entries())
    await db.shippingRate.upsert({
      where: { governorate },
      update: {},
      create: { governorate, price: i < 2 ? 6000 : i === 2 ? 7500 : 9000 },
    });
  const content = [
    [
      "hero",
      "EVERYDAY,\nIN MOTION.",
      "Life changes. Plans change. You keep going.",
      "/media/life-01.jpg",
    ],
    [
      "philosophy",
      "SIMPLE THINGS.\nDONE PROPERLY.",
      "We believe the things you reach for every day deserve a little more thought. Less noise. More intention.",
      "/media/packaging.jpg",
    ],
    [
      "chapter",
      "THE EVERYDAY\nSTARTS HERE.",
      "Some of the things we wear the most get the least attention. We’re starting there.",
      "/media/life-02.jpg",
    ],
    [
      "story",
      "BORN FROM A WORD.\nMADE FOR A WAY OF LIFE.",
      "Mashy comes from a simple Egyptian word — ماشي. Moving. Going. Okay. Continuing. A small word for all the ways we move through a changing day. We make everyday essentials to move with real life. 24 hours. Your pace. Your way.",
      "/media/life-03.jpg",
    ],
    ["footer", "WHATEVER TODAY LOOKS LIKE.", "KEEP MASHY.", ""],
    [
      "faq-sizing",
      "How do I find my size?",
      "See the size guide on every product page. Current products are concepts; final fit and measurements will be confirmed before launch.",
      "",
    ],
    [
      "faq-delivery",
      "Where do you deliver?",
      "Our first chapter is Egypt. Select your governorate at checkout to see the configured delivery rate. Demo shipping rates are illustrative.",
      "",
    ],
    [
      "faq-returns",
      "Can I return an order?",
      "Contact our team with your order number. A final returns policy, including any hygiene restrictions, must be approved before live sales begin.",
      "",
    ],
    [
      "faq-payment",
      "How can I pay?",
      "Cash on delivery and simulated card or wallet payments are available in demo mode. Live card and wallet options depend on the configured payment provider.",
      "",
    ],
  ];
  for (const [key, title, body, image] of content)
    await db.content.upsert({
      where: { key },
      update: {},
      create: { key, title, body, image },
    });
  await db.discount.upsert({
    where: { code: "FIRSTMOVE" },
    update: {},
    create: {
      code: "FIRSTMOVE",
      type: "PERCENT",
      value: 10,
      minimum: 30000,
      usageLimit: 100,
      singleUse: true,
    },
  });
  console.log(
    "Seed complete. Existing records preserved. No admin password was created.",
  );
}
main().finally(() => db.$disconnect());

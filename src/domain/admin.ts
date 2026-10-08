import { z } from "zod";
const text = z.string().trim();
const optional = text.default("");
const cents = z.number().int().min(0).max(100000000);
const media = text.refine(
  (s) =>
    s === "" ||
    s.startsWith("/media/") ||
    s.startsWith("/uploads/") ||
    /^https:\/\/[^\s]+$/.test(s),
  "Use a local media path or HTTPS URL",
);
export const adminSchemas = {
  products: z.object({
    name: text.min(2).max(150),
    slug: text.regex(/^[a-z0-9-]+$/),
    description: text.max(4000),
    story: optional,
    price: cents,
    comparePrice: cents.nullable().optional(),
    category: text.min(1),
    chapter: optional,
    composition: optional,
    fit: optional,
    care: optional,
    features: z.array(text).max(30),
    images: z.array(media).min(1).max(20),
    video: media.nullable().optional(),
    status: z.enum(["DRAFT", "ACTIVE", "ARCHIVED"]),
    seoTitle: optional,
    seoDescription: optional,
    collectionId: text.min(1),
  }),
  variants: z.object({
    productId: text.min(1),
    sku: text.min(1),
    color: text.min(1),
    colorHex: text.regex(/^#[a-fA-F0-9]{6}$/),
    size: text.min(1),
    stock: z.number().int().min(0).max(1000000),
    price: cents.nullable().optional(),
    image: media.nullable().optional(),
  }),
  collections: z.object({
    name: text.min(2),
    slug: text.regex(/^[a-z0-9-]+$/),
    description: optional,
    image: media,
  }),
  discounts: z
    .object({
      code: text
        .min(2)
        .max(50)
        .transform((s) => s.toUpperCase()),
      type: z.enum(["PERCENT", "FIXED"]),
      value: cents,
      minimum: cents,
      startsAt: z.coerce.date(),
      endsAt: z.coerce.date().nullable(),
      usageLimit: z.number().int().min(1).nullable(),
      singleUse: z.boolean(),
      automatic: z.boolean(),
      active: z.boolean(),
    })
    .refine(
      (d) => d.type !== "PERCENT" || d.value <= 100,
      "Percentage must not exceed 100",
    )
    .refine(
      (d) => !d.endsAt || d.endsAt > d.startsAt,
      "End date must follow start date",
    ),
  shipping: z.object({
    governorate: text.min(2),
    price: cents,
    active: z.boolean(),
  }),
  content: z.object({
    key: text.regex(/^[a-z0-9-]+$/),
    title: text.max(500),
    body: text.max(20000),
    image: media,
  }),
  settings: z.object({
    freeShippingThreshold: cents,
    lowStockThreshold: z.number().int().min(0).max(1000),
    announcement: text.max(200),
    shippingNote: text.max(1000),
    whatsapp: text.regex(/^\+?\d{0,15}$/),
    email: z.email(),
    seoTitle: text.max(150),
    seoDescription: text.max(500),
  }),
};
export type EditableResource = keyof typeof adminSchemas;
export const editorResources = [
  "products",
  "variants",
  "collections",
  "content",
  "media",
];
export const resources = [
  "products",
  "variants",
  "collections",
  "orders",
  "customers",
  "discounts",
  "shipping",
  "content",
  "settings",
  "media",
  "inquiries",
  "audit",
] as const;
export type Field = {
  name: string;
  label: string;
  type?: string;
  options?: string[];
};
export const fields: Record<EditableResource, Field[]> = {
  products: [
    { name: "name", label: "Product name" },
    { name: "slug", label: "URL slug" },
    { name: "description", label: "Description", type: "textarea" },
    { name: "story", label: "Short story", type: "textarea" },
    { name: "price", label: "Price (piasters / EGP × 100)", type: "number" },
    {
      name: "comparePrice",
      label: "Compare price (piasters, optional)",
      type: "nullable-number",
    },
    { name: "category", label: "Category" },
    { name: "chapter", label: "Chapter" },
    { name: "collectionId", label: "Collection ID" },
    { name: "images", label: "Image URLs (one per line)", type: "array" },
    { name: "video", label: "Video URL (optional)" },
    { name: "features", label: "Features (one per line)", type: "array" },
    { name: "composition", label: "Composition", type: "textarea" },
    { name: "fit", label: "Fit", type: "textarea" },
    { name: "care", label: "Care", type: "textarea" },
    {
      name: "status",
      label: "Status",
      type: "select",
      options: ["DRAFT", "ACTIVE", "ARCHIVED"],
    },
    { name: "seoTitle", label: "SEO title" },
    { name: "seoDescription", label: "SEO description", type: "textarea" },
  ],
  variants: [
    { name: "productId", label: "Product ID" },
    { name: "sku", label: "SKU" },
    { name: "color", label: "Color name" },
    { name: "colorHex", label: "Color hex (e.g. #24251f)" },
    { name: "size", label: "Size" },
    { name: "stock", label: "Available stock", type: "number" },
    {
      name: "price",
      label: "Price override (piasters, optional)",
      type: "nullable-number",
    },
    { name: "image", label: "Image URL" },
  ],
  collections: [
    { name: "name", label: "Name" },
    { name: "slug", label: "URL slug" },
    { name: "description", label: "Description", type: "textarea" },
    { name: "image", label: "Image URL" },
  ],
  discounts: [
    { name: "code", label: "Code" },
    {
      name: "type",
      label: "Type",
      type: "select",
      options: ["PERCENT", "FIXED"],
    },
    { name: "value", label: "Value (% or piasters)", type: "number" },
    { name: "minimum", label: "Minimum subtotal (piasters)", type: "number" },
    { name: "startsAt", label: "Start date", type: "datetime-local" },
    { name: "endsAt", label: "End date (optional)", type: "datetime-local" },
    {
      name: "usageLimit",
      label: "Usage limit (optional)",
      type: "nullable-number",
    },
    {
      name: "singleUse",
      label: "One use per customer email",
      type: "checkbox",
    },
    { name: "automatic", label: "Automatic discount", type: "checkbox" },
    { name: "active", label: "Active", type: "checkbox" },
  ],
  shipping: [
    { name: "governorate", label: "Governorate" },
    { name: "price", label: "Delivery price (piasters)", type: "number" },
    { name: "active", label: "Available", type: "checkbox" },
  ],
  content: [
    {
      name: "key",
      label: "Section key (hero, chapter, story, faq-…, policy-…)",
    },
    { name: "title", label: "Title", type: "textarea" },
    { name: "body", label: "Body", type: "textarea" },
    { name: "image", label: "Image URL" },
  ],
  settings: [
    {
      name: "freeShippingThreshold",
      label: "Free-shipping threshold (piasters)",
      type: "number",
    },
    { name: "lowStockThreshold", label: "Low-stock threshold", type: "number" },
    { name: "announcement", label: "Announcement" },
    { name: "shippingNote", label: "Shipping note", type: "textarea" },
    { name: "whatsapp", label: "WhatsApp number (country code, optional)" },
    { name: "email", label: "Support email" },
    { name: "seoTitle", label: "Site title" },
    { name: "seoDescription", label: "Site description", type: "textarea" },
  ],
};

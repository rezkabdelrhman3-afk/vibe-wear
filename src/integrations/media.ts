import { randomUUID } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
export interface MediaStorage {
  put(key: string, data: Buffer, contentType: string): Promise<string>;
}
class LocalStorage implements MediaStorage {
  async put(key: string, data: Buffer) {
    if (process.env.NODE_ENV === "production")
      throw new Error("Production uploads require S3 storage");
    const dir = path.join(process.cwd(), "public", "uploads");
    await mkdir(dir, { recursive: true });
    await writeFile(path.join(dir, key), data);
    return `/uploads/${key}`;
  }
}
class S3Storage implements MediaStorage {
  async put(key: string, data: Buffer, contentType: string) {
    if (!process.env.S3_BUCKET || !process.env.S3_PUBLIC_URL)
      throw new Error("S3 configuration required");
    const client = new S3Client({
      region: process.env.S3_REGION || "auto",
      endpoint: process.env.S3_ENDPOINT || undefined,
      credentials: {
        accessKeyId: process.env.S3_ACCESS_KEY_ID || "",
        secretAccessKey: process.env.S3_SECRET_ACCESS_KEY || "",
      },
    });
    await client.send(
      new PutObjectCommand({
        Bucket: process.env.S3_BUCKET,
        Key: key,
        Body: data,
        ContentType: contentType,
      }),
    );
    return `${process.env.S3_PUBLIC_URL!.replace(/\/$/, "")}/${key}`;
  }
}
export async function storeImage(file: File) {
  if (file.size > 10 * 1024 * 1024)
    throw new Error("Image size limit is 10 MB");
  if (
    !["image/jpeg", "image/png", "image/webp", "image/avif"].includes(file.type)
  )
    throw new Error("Invalid image type");
  const data = await sharp(Buffer.from(await file.arrayBuffer()), {
    limitInputPixels: 40000000,
  })
    .rotate()
    .resize({
      width: 2400,
      height: 2400,
      fit: "inside",
      withoutEnlargement: true,
    })
    .webp({ quality: 86 })
    .toBuffer();
  const storage =
    process.env.STORAGE_PROVIDER === "s3"
      ? new S3Storage()
      : new LocalStorage();
  return storage.put(`${randomUUID()}.webp`, data, "image/webp");
}

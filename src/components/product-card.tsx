import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { CatalogProduct } from "@/lib/catalog";
import { money } from "@/lib/utils";
export function ProductCard({
  product,
  index = 0,
}: {
  product: CatalogProduct;
  index?: number;
}) {
  const colors = [
    ...new Map(product.variants.map((v) => [v.color, v.colorHex])).entries(),
  ];
  const stock = product.variants.reduce((s, v) => s + v.stock, 0);
  return (
    <article className="product-card">
      <Link href={`/products/${product.slug}`} className="product-visual">
        <Image
          src={product.images[0] || "/media/cream.jpg"}
          alt={product.name}
          fill
          sizes="(max-width: 600px) 50vw, (max-width: 1000px) 50vw, 33vw"
        />
        <span className="product-index">
          {String(index + 1).padStart(2, "0")} / CH.01
        </span>
        {!stock && <span className="stock-badge">CURRENTLY AWAY</span>}
        <span className="product-arrow" aria-hidden="true">
          <ArrowUpRight size={20} />
        </span>
      </Link>
      <div className="product-meta">
        <div>
          <Link href={`/products/${product.slug}`}>
            <h3>{product.name}</h3>
          </Link>
          <p>
            {product.category} / {colors.map((c) => c[0]).join(", ")}
          </p>
        </div>
        <span>{money(product.price)}</span>
      </div>
      <div className="swatches">
        {colors.map(([name, hex]) => (
          <span key={name} style={{ background: hex }} title={name} />
        ))}
        <span className="swatch-label">
          {stock ? "Two sizes. Your fit." : "Back in a future chapter."}
        </span>
      </div>
    </article>
  );
}

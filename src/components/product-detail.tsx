"use client";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { ArrowUpRight, Plus, Minus, Check } from "lucide-react";
import { CatalogProduct } from "@/lib/catalog";
import { useBag } from "./cart-provider";
import { money } from "@/lib/utils";
import { track } from "@/lib/analytics";
export function ProductDetail({
  product,
  lowStock,
}: {
  product: CatalogProduct;
  lowStock: number;
}) {
  const router = useRouter();
  const [color, setColor] = useState(product.variants[0]?.color || "");
  const [size, setSize] = useState("");
  const [qty, setQty] = useState(1);
  const [active, setActive] = useState(0);
  const [error, setError] = useState("");
  const bag = useBag();
  const variant = product.variants.find(
    (v) => v.color === color && v.size === size,
  );
  const colors = [
    ...new Map(product.variants.map((v) => [v.color, v.colorHex])).entries(),
  ];
  const sizes = [...new Set(product.variants.map((v) => v.size))];
  const images = product.images;
  useEffect(() => track("view_product", { id: product.id }), [product.id]);
  function add() {
    if (!variant) {
      setError("Choose your size to find your fit.");
      return false;
    }
    if (!variant.stock) return false;
    bag.add({
      variantId: variant.id,
      name: product.name,
      slug: product.slug,
      image: variant.image || images[0],
      color,
      size,
      price: variant.price ?? product.price,
      quantity: Math.min(qty, variant.stock),
      stock: variant.stock,
    });
    setError("");
    return true;
  }
  return (
    <div className="product-detail">
      <div className="gallery">
        <div className="main-product-image">
          <Image
            src={images[active] || images[0]}
            alt={`${product.name} — view ${active + 1}`}
            fill
            priority
            sizes="(max-width:750px) 100vw, 55vw"
          />
          <span className="eyebrow">MASHY / CHAPTER {product.chapter}</span>
        </div>
        <div className="gallery-thumbs">
          {images.map((img, i) => (
            <button
              key={img}
              aria-label={`View image ${i + 1}`}
              aria-pressed={active === i}
              onClick={() => setActive(i)}
            >
              <Image src={img} alt="" width={90} height={110} />
            </button>
          ))}
        </div>
        {product.video && (
          <video controls preload="none" poster={images[0]} src={product.video}>
            Your browser does not support video.
          </video>
        )}
      </div>
      <div className="product-info">
        <p className="eyebrow">
          CHAPTER {product.chapter} / {product.category.toUpperCase()}
        </p>
        <h1>{product.name}</h1>
        <p className="product-price">
          {money(variant?.price ?? product.price)}{" "}
          {product.comparePrice && <del>{money(product.comparePrice)}</del>}
        </p>
        <p className="product-story">{product.story}</p>
        <fieldset className="variant-group">
          <legend>
            Color <span>/ {color}</span>
          </legend>
          <div className="color-options">
            {colors.map(([c, hex]) => (
              <button
                key={c}
                type="button"
                aria-label={c}
                aria-pressed={color === c}
                style={{ background: hex }}
                onClick={() => {
                  setColor(c);
                  setSize("");
                  const image = product.variants.find(
                    (v) => v.color === c,
                  )?.image;
                  const index = image ? images.indexOf(image) : -1;
                  if (index >= 0) setActive(index);
                }}
              >
                {color === c && (
                  <Check
                    size={14}
                    color={hex === "#252525" ? "white" : "black"}
                  />
                )}
              </button>
            ))}
          </div>
        </fieldset>
        <fieldset className="variant-group">
          <legend>
            Size <Link href="/size-guide">Find your fit ↗︎</Link>
          </legend>
          <div className="size-options">
            {sizes.map((s) => {
              const v = product.variants.find(
                (v) => v.color === color && v.size === s,
              );
              return (
                <button
                  disabled={!v?.stock}
                  type="button"
                  key={s}
                  aria-pressed={size === s}
                  onClick={() => {
                    setSize(s);
                    setError("");
                    track("select_variant", { id: v?.id });
                  }}
                >
                  EU {s}
                  {!v?.stock ? " / Sold out" : ""}
                </button>
              );
            })}
          </div>
        </fieldset>
        <div className="stock-line">
          {variant
            ? variant.stock <= lowStock
              ? `Only ${variant.stock} left in this size.`
              : "In stock. Ready for your everyday."
            : "Choose a size. Make it yours."}
        </div>
        <div className="purchase-row">
          <div className="quantity">
            <button
              aria-label="Decrease quantity"
              disabled={qty === 1}
              onClick={() => setQty((q) => q - 1)}
            >
              <Minus size={15} />
            </button>
            <span>{qty}</span>
            <button
              aria-label="Increase quantity"
              disabled={qty >= Math.min(10, variant?.stock ?? 10)}
              onClick={() => setQty((q) => q + 1)}
            >
              <Plus size={15} />
            </button>
          </div>
          <button
            className="button dark"
            disabled={product.variants.every((v) => !v.stock)}
            onClick={add}
          >
            Add to bag <ArrowUpRight size={18} />
          </button>
        </div>
        {error && (
          <p role="alert" className="form-error">
            {error}
          </p>
        )}
        <button
          className="buy-now text-button"
          onClick={() => {
            if (add()) {
              bag.close();
              router.push("/checkout");
            }
          }}
          disabled={product.variants.every((v) => !v.stock)}
        >
          Buy now
        </button>
        <p className="product-delivery">
          EGYPT DELIVERY · GUEST CHECKOUT · YOUR PACE
        </p>
        <div className="product-accordions">
          {[
            ["The details", product.description],
            ["Composition & fit", `${product.composition}\n${product.fit}`],
            ["Care", product.care],
            [
              "Shipping & returns",
              "Delivery rates are calculated by governorate at checkout. Visit Shipping & Returns for the current policy.",
            ],
          ].map(([title, body]) => (
            <details key={title}>
              <summary>
                {title}
                <Plus size={16} />
              </summary>
              <p>{body}</p>
            </details>
          ))}
        </div>
        <ul className="features">
          {product.features.map((f) => (
            <li key={f}>{f}</li>
          ))}
        </ul>
      </div>
      <div className="mobile-purchase">
        <div>
          {product.name}
          <strong>{money(variant?.price ?? product.price)}</strong>
        </div>
        <button
          className="button dark"
          onClick={add}
          disabled={product.variants.every((v) => !v.stock)}
        >
          Add to bag ↗︎
        </button>
      </div>
    </div>
  );
}

import { CatalogEvent } from "./analytics-event";
import { products } from "@/lib/catalog";
import { db } from "@/lib/db";
import { ProductCard } from "./product-card";
import { ArrowUpRight, SlidersHorizontal } from "lucide-react";
import Link from "next/link";
export async function CatalogView({
  params,
  title = "THE EVERYDAY\nCOLLECTION.",
  collection,
}: {
  params: Record<string, string | undefined>;
  title?: string;
  collection?: string;
}) {
  const [all, collections] = await Promise.all([
    products(),
    db.collection.findMany(),
  ]);
  const filtered = all.filter(
    (p) =>
      (!collection || p.collection.slug === collection) &&
      (!params.q ||
        `${p.name} ${p.category} ${p.description}`
          .toLowerCase()
          .includes(params.q.toLowerCase())) &&
      (!params.collection || p.collection.slug === params.collection) &&
      (!params.color || p.variants.some((v) => v.color === params.color)) &&
      (!params.size || p.variants.some((v) => v.size === params.size)) &&
      (!params.stock || p.variants.some((v) => v.stock > 0)) &&
      (!params.max || p.price <= Number(params.max) * 100),
  );
  if (params.sort === "price-asc") filtered.sort((a, b) => a.price - b.price);
  if (params.sort === "price-desc") filtered.sort((a, b) => b.price - a.price);
  return (
    <main id="main" className="shop-page">
      <CatalogEvent query={params.q} collection={collection} />
      <div className="page-intro">
        <div>
          <p className="eyebrow">CHAPTER 01 / SOCKS</p>
          <h1>{title}</h1>
        </div>
        <p>
          Good essentials should disappear into your day.
          <br />
          Find your everyday rotation.
        </p>
      </div>
      <form
        action={collection ? `/collections/${collection}` : "/shop"}
        className="filter-form"
      >
        <div className="search-field">
          <input
            name="q"
            aria-label="Search products"
            placeholder="Find your essential"
            defaultValue={params.q}
          />
          <button aria-label="Search products">
            <ArrowUpRight size={19} />
          </button>
        </div>
        <details className="filters" open>
          <summary>
            <SlidersHorizontal size={14} /> Filter & sort
          </summary>
          <div>
            <label>
              Collection
              <select name="collection" defaultValue={params.collection || ""}>
                <option value="">All chapters</option>
                {collections.map((c) => (
                  <option key={c.id} value={c.slug}>
                    {c.name}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Color
              <select
                aria-label="Color"
                name="color"
                defaultValue={params.color || ""}
              >
                <option value="">All colors</option>
                {[
                  ...new Set(
                    all.flatMap((p) => p.variants.map((v) => v.color)),
                  ),
                ].map((c) => (
                  <option key={c}>{c}</option>
                ))}
              </select>
            </label>
            <label>
              Size
              <select
                aria-label="Size"
                name="size"
                defaultValue={params.size || ""}
              >
                <option value="">All sizes</option>
                {[
                  ...new Set(all.flatMap((p) => p.variants.map((v) => v.size))),
                ].map((s) => (
                  <option key={s}>{s}</option>
                ))}
              </select>
            </label>
            <label>
              Maximum EGP
              <input
                type="number"
                min="0"
                name="max"
                placeholder="Any price"
                defaultValue={params.max}
              />
            </label>
            <label>
              Sort
              <select name="sort" defaultValue={params.sort || ""}>
                <option value="">Our selection</option>
                <option value="price-asc">Price: low to high</option>
                <option value="price-desc">Price: high to low</option>
              </select>
            </label>
            <label className="check-label">
              <input
                type="checkbox"
                name="stock"
                value="1"
                defaultChecked={!!params.stock}
              />{" "}
              In stock
            </label>
            <button className="small-button">Apply</button>
            <Link
              className="text-button"
              href={collection ? `/collections/${collection}` : "/shop"}
            >
              Reset
            </Link>
          </div>
        </details>
      </form>
      <p className="catalog-count eyebrow">
        {filtered.length} CONSIDERED ESSENTIALS{" "}
        <span>YOUR PACE. YOUR PICK.</span>
      </p>
      {filtered.length ? (
        <div className="product-grid shop-grid">
          {filtered.map((p, i) => (
            <ProductCard key={p.id} product={p} index={i} />
          ))}
        </div>
      ) : (
        <div className="empty-state">
          <h2>Not on this route.</h2>
          <p>Try a different search or give your filters a little room.</p>
          <Link className="button dark" href="/shop">
            See all essentials
          </Link>
        </div>
      )}
      <div className="shop-end">
        <span>MASHY / 24</span>
        <p>
          THE FIRST CHAPTER.
          <br />
          MORE LIFE TO COME.
        </p>
      </div>
    </main>
  );
}

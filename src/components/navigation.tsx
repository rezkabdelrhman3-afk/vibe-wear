"use client";
import Link from "next/link";
import { useRef } from "react";
import { usePathname } from "next/navigation";
import { ArrowUpRight, Search, Menu, X } from "lucide-react";
import { useBag } from "./cart-provider";
export function Navigation() {
  const bag = useBag();
  const menu = useRef<HTMLDialogElement>(null);
  const path = usePathname();
  return (
    <>
      <header className="site-header">
        <Link href="/" className="wordmark" aria-label="Mashy home">
          MASHY
        </Link>
        <nav className="desktop-nav" aria-label="Main navigation">
          <Link className={path === "/shop" ? "active" : ""} href="/shop">
            Shop <span className="tiny">↗︎</span>
          </Link>
          <Link href="/about">Our story</Link>
          <Link href="/24">The /24 philosophy</Link>
        </nav>
        <div className="header-actions">
          <Link className="search-link" href="/search" aria-label="Search">
            <Search size={19} />
          </Link>
          <button onClick={bag.open} className="bag-trigger">
            Bag <span>({bag.items.reduce((s, i) => s + i.quantity, 0)})</span>
          </button>
          <button
            className="mobile-menu icon-button"
            onClick={() => menu.current?.showModal()}
            aria-label="Open navigation"
          >
            <Menu size={22} />
          </button>
        </div>
      </header>
      <dialog ref={menu} className="menu-dialog" aria-label="Navigation">
        <div className="drawer-heading">
          <span className="wordmark">MASHY</span>
          <button
            onClick={() => menu.current?.close()}
            aria-label="Close navigation"
            className="icon-button"
          >
            <X />
          </button>
        </div>
        <nav>
          {[
            ["Shop", "/shop"],
            ["Our story", "/about"],
            ["The /24 philosophy", "/24"],
            ["Search", "/search"],
            ["Contact", "/contact"],
          ].map(([label, url]) => (
            <Link href={url} key={url} onClick={() => menu.current?.close()}>
              {label}
              <ArrowUpRight />
            </Link>
          ))}
        </nav>
        <p className="eyebrow">24 HOURS. YOUR PACE. YOUR WAY.</p>
      </dialog>
    </>
  );
}

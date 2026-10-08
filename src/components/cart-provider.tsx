"use client";
import {
  createContext,
  useContext,
  useEffect,
  useState,
  useRef,
  useCallback,
  type ReactNode,
} from "react";
import Link from "next/link";
import Image from "next/image";
import { X, ArrowUpRight, Minus, Plus, ShoppingBag } from "lucide-react";
import { money } from "@/lib/utils";
import { track } from "@/lib/analytics";
export type BagItem = {
  variantId: string;
  name: string;
  slug: string;
  image: string;
  color: string;
  size: string;
  price: number;
  quantity: number;
  stock: number;
};
type BagContext = {
  items: BagItem[];
  add: (item: BagItem) => void;
  update: (id: string, qty: number) => void;
  clear: () => void;
  open: () => void;
  close: () => void;
  subtotal: number;
  threshold: number;
  ready: boolean;
};
const Context = createContext<BagContext | null>(null);
export function useBag() {
  const v = useContext(Context);
  if (!v) throw new Error("Bag provider missing");
  return v;
}
export function CartProvider({
  children,
  threshold,
}: {
  children: ReactNode;
  threshold: number;
}) {
  const [items, setItems] = useState<BagItem[]>([]);
  const [ready, setReady] = useState(false);
  const dialog = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem("mashy-bag") || "[]");
      if (Array.isArray(saved))
        setItems(
          saved
            .filter(
              (i) =>
                typeof i.variantId === "string" &&
                typeof i.price === "number" &&
                Number.isInteger(i.quantity) &&
                i.quantity > 0 &&
                i.quantity <= 10 &&
                typeof i.image === "string" &&
                (i.image.startsWith("/media/") ||
                  i.image.startsWith("/uploads/") ||
                  i.image.startsWith("https://")),
            )
            .slice(0, 30),
        );
    } catch {}
    setReady(true);
  }, []);
  useEffect(() => {
    if (ready) localStorage.setItem("mashy-bag", JSON.stringify(items));
  }, [items, ready]);
  const clear = useCallback(() => setItems([]), []);
  const subtotal = items.reduce((sum, i) => sum + i.price * i.quantity, 0);
  const close = () => dialog.current?.close();
  function add(item: BagItem) {
    setItems((old) => {
      const found = old.find((i) => i.variantId === item.variantId);
      return found
        ? old.map((i) =>
            i.variantId === item.variantId
              ? {
                  ...i,
                  quantity: Math.min(
                    10,
                    item.stock,
                    i.quantity + item.quantity,
                  ),
                }
              : i,
          )
        : [...old, item];
    });
    track("add_to_cart", {
      variantId: item.variantId,
      quantity: item.quantity,
    });
    dialog.current?.showModal();
  }
  function update(id: string, qty: number) {
    setItems((old) =>
      old.flatMap((i) =>
        i.variantId !== id
          ? [i]
          : qty > 0
            ? [{ ...i, quantity: Math.min(10, i.stock, qty) }]
            : [],
      ),
    );
    if (qty === 0) track("remove_from_cart", { variantId: id });
  }
  return (
    <Context.Provider
      value={{
        items,
        add,
        update,
        clear,
        ready,
        open: () => dialog.current?.showModal(),
        close,
        subtotal,
        threshold,
      }}
    >
      {children}
      <dialog
        className="bag-dialog"
        ref={dialog}
        aria-labelledby="bag-title"
        onClick={(e) => {
          if (e.target === dialog.current) close();
        }}
      >
        <div className="bag-panel">
          <div className="drawer-heading">
            <h2 id="bag-title">
              YOUR BAG <sup>({items.reduce((s, i) => s + i.quantity, 0)})</sup>
            </h2>
            <button
              aria-label="Close bag"
              onClick={close}
              className="icon-button"
            >
              <X />
            </button>
          </div>
          {items.length ? (
            <>
              <div className="shipping-progress">
                <p>
                  {subtotal >= threshold
                    ? "A little further, on us. Free shipping unlocked."
                    : `${money(threshold - subtotal)} away from complimentary shipping.`}
                </p>
                <div>
                  <span
                    style={{
                      width: `${Math.min(100, (subtotal / threshold) * 100)}%`,
                    }}
                  />
                </div>
                <small>Calculated after discounts at checkout.</small>
              </div>
              <div className="bag-items">
                <BagItems />
              </div>
              <div className="bag-bottom">
                <p className="row">
                  <span>Subtotal</span>
                  <strong>{money(subtotal)}</strong>
                </p>
                <small>Shipping and discounts calculated at checkout.</small>
                <Link
                  onClick={close}
                  className="button dark full"
                  href="/checkout"
                >
                  Continue to checkout <ArrowUpRight size={18} />
                </Link>
                <button onClick={close} className="text-button">
                  Keep exploring
                </button>
              </div>
            </>
          ) : (
            <div className="empty-state">
              <ShoppingBag size={40} strokeWidth={1} />
              <h3>A little room for the everyday.</h3>
              <p>Your next essential is out there.</p>
              <Link href="/shop" className="button dark" onClick={close}>
                Explore Chapter 01 <ArrowUpRight size={17} />
              </Link>
            </div>
          )}
        </div>
      </dialog>
    </Context.Provider>
  );
}
export function BagItems() {
  const { items, update } = useBag();
  return (
    <>
      {items.map((i) => (
        <article className="bag-item" key={i.variantId}>
          <Link href={`/products/${i.slug}`}>
            <Image src={i.image} alt={i.name} width={100} height={125} />
          </Link>
          <div>
            <h3>{i.name}</h3>
            <p>
              {i.color} / EU {i.size}
            </p>
            <div className="quantity">
              <button
                aria-label={`Decrease ${i.name}`}
                onClick={() => update(i.variantId, i.quantity - 1)}
              >
                <Minus size={12} />
              </button>
              <span>{i.quantity}</span>
              <button
                aria-label={`Increase ${i.name}`}
                disabled={i.quantity >= Math.min(10, i.stock)}
                onClick={() => update(i.variantId, i.quantity + 1)}
              >
                <Plus size={12} />
              </button>
            </div>
            <button className="remove" onClick={() => update(i.variantId, 0)}>
              Remove
            </button>
          </div>
          <span>{money(i.price * i.quantity)}</span>
        </article>
      ))}
    </>
  );
}

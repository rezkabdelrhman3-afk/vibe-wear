import Link from "next/link";
export function Footer({ title, body }: { title: string; body: string }) {
  return (
    <footer className="site-footer">
      <div className="footer-statement">
        <p className="eyebrow">{title}</p>
        <Link href="/shop">
          {body}
          <span>↗︎</span>
        </Link>
      </div>
      <div className="footer-grid">
        <div>
          <Link href="/" className="wordmark">
            MASHY
          </Link>
          <p>
            Everyday essentials.
            <br />A little more considered.
          </p>
          <a
            href="https://www.instagram.com/mashy24/"
            target="_blank"
            rel="noreferrer"
          >
            Instagram ↗︎
          </a>
        </div>
        <div>
          <h3>EXPLORE</h3>
          <Link href="/shop">Chapter 01 / Socks</Link>
          <Link href="/about">Our story</Link>
          <Link href="/24">MASHY /24</Link>
        </div>
        <div>
          <h3>HERE TO HELP</h3>
          <Link href="/contact">Contact</Link>
          <Link href="/faq">FAQs</Link>
          <Link href="/shipping-returns">Shipping & returns</Link>
          <Link href="/size-guide">Size guide</Link>
        </div>
        <div>
          <h3>OUR FIRST CHAPTER</h3>
          <p>
            Born from an Egyptian word.
            <br />
            Built for everyday movement.
          </p>
          <span className="eyebrow">EGYPT · EGP</span>
        </div>
      </div>
      <div className="footer-bottom">
        <span>© {new Date().getFullYear()} MASHY / 24</span>
        <span>YOUR PACE. YOUR WAY.</span>
        <div>
          <Link href="/privacy">Privacy</Link>
          <Link href="/terms">Terms</Link>
        </div>
      </div>
    </footer>
  );
}

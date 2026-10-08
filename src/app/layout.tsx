import type { Metadata } from "next";
import "./globals.css";
import { appUrl } from "@/lib/utils";
export const metadata: Metadata = {
  metadataBase: new URL(appUrl()),
  title: { default: "MASHY — Everyday, in motion.", template: "%s · MASHY" },
  description:
    "Modern lifestyle essentials. Born from an Egyptian word. Built for everyday movement. Keep Mashy.",
  openGraph: {
    type: "website",
    siteName: "MASHY",
    images: [{ url: "/media/life-01.jpg", width: 1024, height: 1536 }],
  },
  twitter: { card: "summary_large_image" },
};
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <a className="skip-link" href="#main">
          Skip to content
        </a>
        {children}
      </body>
    </html>
  );
}

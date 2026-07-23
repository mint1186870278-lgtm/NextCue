import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import ClerkLayoutWrapper from "@/components/ClerkLayoutWrapper";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "NextCue",
  description: "A minimalist, interactive web application designed to help users with ADHD manage tasks.",
  icons: {
    icon: "/logo.png",
    shortcut: "/logo.png",
    apple: "/logo.png",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="mobile-web-optimized">
      <body className={inter.className}>
        <ClerkLayoutWrapper>{children}</ClerkLayoutWrapper>
      </body>
    </html>
  );
}

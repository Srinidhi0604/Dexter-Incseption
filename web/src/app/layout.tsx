import type { Metadata, Viewport } from "next";
import { Manrope, Sora } from "next/font/google";

import { AuthProvider } from "@/components/auth/auth-provider";
import { ServiceWorkerRegister } from "@/components/pwa/sw-register";
import "./globals.css";

const sora = Sora({
  variable: "--font-display",
  subsets: ["latin"],
});

const manrope = Manrope({
  variable: "--font-body",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "CivicPulse+",
    template: "%s | CivicPulse+",
  },
  description:
    "CivicPulse+ is a mobile-first civic engagement PWA that blends habit loops, missions, and real-world city impact.",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "CivicPulse+",
  },
  icons: {
    icon: "/icons/icon-192.svg",
    apple: "/icons/icon-192.svg",
  },
};

export const viewport: Viewport = {
  themeColor: "#0B0B0B",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${sora.variable} ${manrope.variable} h-full antialiased`}>
      <body className="min-h-full bg-[var(--cp-bg)] text-[var(--cp-text)]">
        <AuthProvider>
          <ServiceWorkerRegister />
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}

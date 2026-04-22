import type { Metadata, Viewport } from "next";
import "./globals.css";
import SiteHeader from "@/components/SiteHeader";

export const metadata: Metadata = {
  title: "Takhaial — Visionary Intelligence",
  description:
    "Takhaial fuses Spatial Computing and Artificial Intelligence to build the next interface between humans and machines.",
  icons: {
    icon: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'%3E%3Ccircle cx='16' cy='16' r='6' fill='%236B4CE6'/%3E%3Ccircle cx='16' cy='16' r='2' fill='%23FF3366'/%3E%3C/svg%3E",
  },
};

export const viewport: Viewport = {
  themeColor: "#05050A",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-ink-900 text-white antialiased">
        <SiteHeader />
        {children}
      </body>
    </html>
  );
}

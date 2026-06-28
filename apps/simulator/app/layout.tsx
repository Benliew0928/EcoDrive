import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "EcoDrive+ Simulator",
  description: "Eco GP Route Chase driving simulator prototype"
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}

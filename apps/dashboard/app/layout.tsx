import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "EcoDrive+ Cockpit HMI",
  description: "Static cockpit dashboard shell for the EcoDrive+ pitch demo"
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


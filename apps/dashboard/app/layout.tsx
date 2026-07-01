import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "EcoDrive+ Cockpit HMI",
  description: "Integration-ready cockpit dashboard shell for EcoDrive+ simulator telemetry"
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

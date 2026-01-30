import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Drainr Quote Tool",
  description: "Automated quote generation from ServiceM8 to Qwilr",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}

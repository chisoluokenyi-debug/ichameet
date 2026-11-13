import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "IchaMeet — Meet someone meaningful",
  description: "A welcoming place to meet people and build meaningful connections around the world.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}

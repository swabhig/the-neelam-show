import type { Metadata } from "next";
import { Kavoon, Poppins, Cormorant_Garamond } from "next/font/google";
import "./globals.css";
import { ConvexClientProvider } from "./ConvexClientProvider";

const kavoon = Kavoon({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-kavoon",
});

const poppins = Poppins({
  weight: ["400", "500", "600", "700", "800"],
  subsets: ["latin"],
  variable: "--font-poppins",
});

const cormorantGaramond = Cormorant_Garamond({
  weight: "400",
  style: "italic",
  subsets: ["latin"],
  variable: "--font-cormorant-garamond",
});

export const metadata: Metadata = {
  title: "The Neelam Show",
  description: "A party game for people who talk before they think.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${kavoon.variable} ${poppins.variable} ${cormorantGaramond.variable}`}
    >
      <body>
        <ConvexClientProvider>{children}</ConvexClientProvider>
      </body>
    </html>
  );
}

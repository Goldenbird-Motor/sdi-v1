import type { Metadata } from "next";
import { Anton, Plus_Jakarta_Sans, JetBrains_Mono } from "next/font/google";
import "leaflet/dist/leaflet.css";
import "./globals.css";

const anton = Anton({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-display",
});

const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-sans",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
});

export const metadata: Metadata = {
  title: "Goldenbird SDI V1 | Open-Source Solar EV Commute Study (Thane)",
  description:
    "5-year (2021–2025) open-source physics simulation testing whether daily sunlight in Thane, India can power an urban commuter car without daily grid charging.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${anton.variable} ${jakarta.variable} ${jetbrainsMono.variable}`}
    >
      <body className="bg-[#221912] font-sans text-[#F2ECE1] antialiased selection:bg-[#E5A93B] selection:text-[#221912]">
        {children}
      </body>
    </html>
  );
}
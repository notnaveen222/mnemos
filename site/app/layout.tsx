import type { Metadata } from "next";
import { Plus_Jakarta_Sans, Instrument_Serif } from "next/font/google";
import Logo from "@/components/Logo";
import "./globals.css";

const jakarta = Plus_Jakarta_Sans({
  variable: "--font-jakarta",
  weight: ["400", "500", "600", "700", "800"],
  subsets: ["latin"],
});

const instrumentSerif = Instrument_Serif({
  variable: "--font-instrument",
  weight: "400",
  style: ["normal", "italic"],
  subsets: ["latin"],
});

const description =
  "Portable memory for your AI. Remembered once, recalled everywhere.";

export const metadata: Metadata = {
  title: {
    default: "mnemos",
    template: "%s — mnemos",
  },
  description,
  openGraph: {
    title: "mnemos",
    description,
    siteName: "mnemos",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "mnemos",
    description,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${jakarta.variable} ${instrumentSerif.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-black">
        <Logo />
        {children}
      </body>
    </html>
  );
}

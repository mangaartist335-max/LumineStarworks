import type { Metadata } from "next";
import { Libre_Baskerville, Montserrat, Nunito_Sans } from "next/font/google";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { ChatBubble } from "@/components/ChatBubble";
import "./globals.css";

const sans = Nunito_Sans({
  variable: "--font-sans",
  subsets: ["latin"],
});

const display = Libre_Baskerville({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["400", "700"],
  style: ["normal", "italic"],
});

const caps = Montserrat({
  variable: "--font-caps",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "NursesWeCare Academy",
    template: "%s · NursesWeCare Academy",
  },
  description:
    "Occupational health and respiratory protection education, developed and delivered by Registered Nurses. A community of caring and learning.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${sans.variable} ${display.variable} ${caps.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col font-sans">
        <SiteHeader />
        <main className="flex-1">{children}</main>
        <SiteFooter />
        <ChatBubble />
      </body>
    </html>
  );
}

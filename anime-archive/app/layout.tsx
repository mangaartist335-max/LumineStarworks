import type { Metadata, Viewport } from "next";
import { JetBrains_Mono, Noto_Sans_JP, Plus_Jakarta_Sans } from "next/font/google";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import "./globals.css";

const jakarta = Plus_Jakarta_Sans({ variable: "--font-jakarta", subsets: ["latin"] });
const notoJp = Noto_Sans_JP({ variable: "--font-noto-jp", weight: ["400", "600", "800"], preload: false });
const jetbrains = JetBrains_Mono({ variable: "--font-jetbrains", subsets: ["latin"] });

export const metadata: Metadata = {
  title: {
    default: "Lumine StarWorks Anime Archive",
    template: "%s · Lumine StarWorks Anime Archive",
  },
  description:
    "Browse every anime season from 2006 to 2026, open any production, explore its creative staff, follow its sequels and trace the production history of an entire anime industry.",
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: dark)", color: "#0d0e14" },
    { media: "(prefers-color-scheme: light)", color: "#fbfbfe" },
  ],
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" suppressHydrationWarning className={`${jakarta.variable} ${notoJp.variable} ${jetbrains.variable}`}>
      <body className="flex min-h-screen flex-col font-sans">
        <ThemeProvider>
          <TooltipProvider delayDuration={200}>
            <SiteHeader />
            <main id="main" className="flex-1">
              {children}
            </main>
            <SiteFooter />
            <Toaster />
          </TooltipProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}

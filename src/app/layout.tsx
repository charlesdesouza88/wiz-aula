import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import { Atkinson_Hyperlegible, Baloo_2 } from "next/font/google";
import { InlineScript } from "@/components/inline-script";
import { MainNav } from "@/components/main-nav";
import { PwaSetup } from "@/components/pwa-setup";
import { SizeButton } from "@/components/size-button";
import { PREF } from "@/lib/pref-keys";
import { BrandMark } from "@/components/icons";
import "./globals.css";

const baloo = Baloo_2({ variable: "--font-baloo", subsets: ["latin"], weight: ["600", "800"] });
const atkinson = Atkinson_Hyperlegible({ variable: "--font-atkinson", subsets: ["latin"], weight: ["400", "700"] });

export const metadata: Metadata = {
  title: "Wiz Aula",
  description: "Entre na sua aula do Google Meet com um toque.",
  applicationName: "Wiz Aula",
  // iPhone and iPad: opened from the Home Screen icon, it runs full screen and can receive alerts.
  appleWebApp: { capable: true, title: "Wiz Aula", statusBarStyle: "default" },
  formatDetection: { telephone: false },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#F6F1F7" },
    { media: "(prefers-color-scheme: dark)", color: "#170A20" },
  ],
};

// Applies the saved text size before the first paint.
const applySize = `try{var s=localStorage.getItem(${JSON.stringify(PREF.size)});if(s==="1"||s==="2")document.documentElement.classList.add("wa-size-"+s)}catch(e){}`;

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="pt-BR" className={`${baloo.variable} ${atkinson.variable}`} suppressHydrationWarning>
      <head>
        <InlineScript html={applySize} />
      </head>
      <body className="px-4 pb-12">
        <div className="mx-auto flex max-w-[34rem] flex-col gap-[18px] tablet:max-w-[40rem] desktop:max-w-[68rem]">
          <header className="flex items-center justify-between gap-3 pt-4">
            <div className="flex items-center gap-2.5">
              <BrandMark />
              <div>
                <div className="font-display text-[1.35rem] leading-none font-extrabold">Wiz Aula</div>
                <div className="text-[0.8rem] tracking-[0.04em] text-muted uppercase">Mister Wiz · Escola de Líderes</div>
              </div>
            </div>
            <SizeButton />
          </header>
          <MainNav />
          <main className="flex flex-col gap-4">{children}</main>
          <PwaSetup />
        </div>
      </body>
    </html>
  );
}

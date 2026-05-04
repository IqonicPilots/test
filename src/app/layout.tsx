import type { Metadata } from "next";
import "./globals.css";
import Script from "next/script";

import { QueryProvider } from "@/components/query-provider";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/sonner";
import { SidebarConfigProvider } from "@/contexts/sidebar-context";
import { SocketProvider } from "@/providers/socket-provider";
import { inter } from "@/lib/fonts";
import { ConnectivityToast } from "@/components/connectivity-toast";

import { seoSettingsApi } from "@/services/seo-settings.service";
import { fetchCustomizerSettingsPublicServer } from "@/services/customizer.service";

export async function generateMetadata(): Promise<Metadata> {
  try {
    const seo = await seoSettingsApi.getSettingsPublic();
    return {
      title: "KiviCare",
      description: "KiviCare Clinic Management dashboard built with Next.js and Tailwind CSS for healthcare professionals.",
      icons: {
        icon: seo.favicon || '/favicon.ico',
        apple: seo.apple_touch_icon || '/apple-touch-icon.png',
      },
    };
  } catch (error) {
    return {
      title: "KiviCare",
      description: "KiviCare Clinic Management dashboard built with Next.js and Tailwind CSS for healthcare professionals.",
    };
  }
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const customizer = await fetchCustomizerSettingsPublicServer();
  const initialThemeMode = customizer?.theme?.mode ?? "light";

  return (
    <html
      lang="en"
      suppressHydrationWarning
      data-scroll-behavior="smooth"
      data-initial-theme={initialThemeMode}
      className={`${inter.variable} antialiased h-full`}
    >
      <head>
        <Script
          id="theme-initializer"
          strategy="beforeInteractive"
          dangerouslySetInnerHTML={{
            __html: `(function () {
  try {
    var root = document.documentElement;
    var key = "nextjs-ui-theme";
    var path = window.location.pathname || "";
    var forcedLight = path === "/" || path === "/landing" || path.indexOf("/blogs-list") === 0 || path.indexOf("/sign-in") === 0 || path.indexOf("/sign-up") === 0 || path.indexOf("/forgot-password") === 0 || path.indexOf("/reset-password") === 0 || path.indexOf("/book-appointment") === 0 || path.indexOf("/doctor-list") === 0 || path.indexOf("/clinic-list") === 0;
    var stored = window.localStorage.getItem(key);
    var fallback = root.getAttribute("data-initial-theme") || "light";
    var preferred = forcedLight ? "light" : (stored || fallback);
    var mode = preferred === "system"
      ? (window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light")
      : preferred;
    root.classList.remove("light", "dark");
    root.classList.add(mode);
    root.style.colorScheme = mode;
  } catch (e) {}
})();`,
          }}
        />
      </head>
      <body suppressHydrationWarning className={`${inter.className} h-full`}>
        <QueryProvider>
          <ThemeProvider defaultTheme="system" storageKey="nextjs-ui-theme">
            <SidebarConfigProvider>
              <SocketProvider>
                <ConnectivityToast />
                {children}
              </SocketProvider>
            </SidebarConfigProvider>
            <Toaster position="top-right" />
          </ThemeProvider>
        </QueryProvider>
      </body>
    </html>
  );
}



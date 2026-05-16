import { cookies } from "next/headers";
import type { Metadata, Viewport } from "next";

import "./globals.css";

import { cn } from "@/lib/utils";

import { ThemeProvider } from "@/components/providers/theme-provider";
import { AuthProvider } from "@/components/providers/auth-provider";
import { ActiveThemeProvider } from "@/components/active-theme";
import { Toaster } from "sonner";

export const metadata: Metadata = {
  title: "Nashville ClearBra",
  description:
    "Nashville ClearBra — premium paint protection film (PPF), ceramic coating, and window tinting services in Nashville, TN. Protect your vehicle with the best clear bra installation in Middle Tennessee.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Nashville ClearBra",
  },
};

export const viewport: Viewport = {
  themeColor: "#E8601C",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const cookieStore = await cookies();
  const activeThemeValue = cookieStore.get("active_theme")?.value;
  const isScaled = activeThemeValue?.endsWith("-scaled");

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="icon" href="/icon.png" type="image/png" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="mobile-web-app-capable" content="yes" />
        <link rel="apple-touch-icon" href="/icon.png" />
      </head>
      <body
        className={cn(
          "bg-background overscroll-none font-sans antialiased h-screen overflow-hidden flex flex-col",
          activeThemeValue ? `theme-${activeThemeValue}` : "",
          isScaled ? "theme-scaled" : ""
        )}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
          enableColorScheme
        >
          <AuthProvider>
            <ActiveThemeProvider initialTheme={activeThemeValue}>
              {children}
              <Toaster richColors position="top-center" />
            </ActiveThemeProvider>
          </AuthProvider>
        </ThemeProvider>
        <script
          dangerouslySetInnerHTML={{
            __html: `if('serviceWorker' in navigator){navigator.serviceWorker.register('/sw.js')}`
          }}
        />
      </body>
    </html>
  );
}

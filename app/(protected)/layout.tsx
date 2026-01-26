import { SidebarProvider } from "@/components/ui/sidebar";
import "dotenv/config";
import type { Metadata } from "next";
import { ThemeProvider } from "next-themes";
import { Geist, Geist_Mono } from "next/font/google";
import Script from "next/script";
import "../globals.css";
import InactivityGuard from "./inactivity-guard";
import { Providers } from "./providers";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "xclntDesign Web Tools",
  description: "xclntDesign Web Tools",
};

export default function ProtectedLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html suppressHydrationWarning lang="en">
      <body
        className={`${geistSans.className} ${geistMono.variable} antialiased`}
      >
        <head>
          <Script
            src={`https://maps.googleapis.com/maps/api/js?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}`}
            strategy="afterInteractive"
          />
        </head>
        <Providers>
          <ThemeProvider defaultTheme="dark" attribute="class">
            <InactivityGuard>
              <SidebarProvider>
                  {children}
              </SidebarProvider>
            </InactivityGuard>
          </ThemeProvider>
        </Providers>
      </body>
    </html>
  );
}

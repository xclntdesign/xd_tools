import { SidebarProvider } from "@/components/ui/sidebar";
import "dotenv/config";
import type { Metadata } from "next";
import { ThemeProvider } from "next-themes";
import { Geist, Geist_Mono } from "next/font/google";
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
  title: "xclntDesign Traffic Reports",
  description: "xclntDesign Traffic Reports",
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

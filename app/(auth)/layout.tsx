import { RedirectToast } from "@/components/redirect-toast";
import { Toaster } from "@/components/ui/sonner";
import "dotenv/config";
import type { Metadata } from "next";
import { ThemeProvider } from "next-themes";
import { Geist, Geist_Mono } from "next/font/google";
import "../globals.css";

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
  description: "xclntDesign Web Tools. All rights reserved.",
};

export default function AdminLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html suppressHydrationWarning lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ThemeProvider defaultTheme="dark" attribute="class">
          <main className="w-full h-screen flex flex-col items-center justify-center">
            {children}
          </main>
          <Toaster expand richColors />
          <RedirectToast />
        </ThemeProvider>
      </body>
    </html>
  );
}
import { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";

export const metadata: Metadata = {
  title: 'Page Not Found | xclntDesign',
  description: 'The URL entered is invalid.',
}

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

function NotFound() {
    return (
        <html suppressHydrationWarning lang="en" className="dark" style={{ colorScheme: "dark" }}>
            <body
                className={`${geistSans.variable} ${geistMono.variable} antialiased`}
            >
                <main className="w-full h-screen flex flex-col items-center justify-center">
                    <div className="grid grid-cols-1 gap-6 px-8 py-30 xl:py-50 2xl:px-50 lg:items-center">
                        <div className="relative z-20">
                            <h1 className="text-5xl 2xl:text-7xl font-medium mb-6 text-red-500 dark:text-neutral-300 homePageHero___title **:pb-3 **:-mb-3 text-center">Looks like the void got this one.</h1>
                            <div className="dark:*:text-neutral-300 lg:text-lg 2xl:text-xl leading-7 2xl:leading-9 text-center">
                                <p className="mb-4">We're sorry, but we could not find the page you were looking for.</p>
                            </div>
                            <div className="absolute top-0 left-0 z-10 w-full opacity-15">
                                <h1 className="text-[13rem] lg:text-[30rem] lg:-mt-[15rem] text-center bg-gradient-to-b from-30% from-white to-black dark:from-black dark:to-white text-transparent bg-clip-text">404</h1>
                            </div>
                        </div>
                    </div>
                </main>
            </body>
        </html>
        
    );
}

export default NotFound;
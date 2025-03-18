import './globals.css';
import { Inter } from 'next/font/google';
import { cn } from "@/lib/utils";
import { Toaster } from "@/components/ui/toaster";
import { MainNav } from "@/components/ui/nav";
import { Footer } from "@/components/ui/footer";

const inter = Inter({ subsets: ['latin'] });

export const metadata = {
  title: "Image Converter - Online Image Processing Tool",
  description: "Online image processing tool with premium features. Basic options available for everyone, sign in to access all advanced features without limitations.",
  keywords: "image compression, format conversion, batch processing, WebP conversion, online image tool, premium image features",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </head>
      <body className={cn(
        "min-h-screen bg-background font-sans antialiased",
        inter.className
      )}>
        <div className="relative flex min-h-screen flex-col">
          <MainNav />
          <div className="flex-1">
            {children}
          </div>
          <Footer />
        </div>
        <Toaster />
      </body>
    </html>
  );
}

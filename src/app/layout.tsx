import './globals.css';
import { Inter } from 'next/font/google';
import { cn } from "@/lib/utils";
import { Toaster } from "@/components/ui/toaster";
import { MainNav } from "@/components/ui/nav";

const inter = Inter({ subsets: ['latin'] });

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh" suppressHydrationWarning>
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>JPEG Imager - 在线图片处理工具</title>
        <meta 
          name="description" 
          content="免费的在线图片处理工具，支持批量压缩、格式转换等功能" 
        />
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
        </div>
        <Toaster />
      </body>
    </html>
  );
}

'use client';

import Link from "next/link"
import { ImageIcon, MenuIcon, XIcon } from "lucide-react"
import { cn } from "@/lib/utils"
import { useState } from "react"

export function MainNav() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <div className="border-b sticky top-0 bg-background/95 backdrop-blur-sm z-50">
      <div className="container flex h-16 items-center justify-between">
        <Link href="/" className="flex items-center space-x-2">
          <div className="bg-primary p-2 rounded-md">
            <ImageIcon className="h-6 w-6 text-primary-foreground" />
          </div>
          <span className="font-bold text-xl">Image Converter</span>
        </Link>
        
        {/* 桌面端导航 */}
        <div className="hidden md:flex items-center space-x-6">
          <Link href="/" className="font-medium hover:text-primary transition-colors">
            Home
          </Link>
          <Link href="/#features" className="font-medium hover:text-primary transition-colors">
            Features
          </Link>
          <Link href="/#tools" className="font-medium hover:text-primary transition-colors">
            Tools
          </Link>
          <Link href="/#faq" className="font-medium hover:text-primary transition-colors">
            FAQ
          </Link>
        </div>
        
        {/* 移动端菜单按钮 */}
        <button 
          className="md:hidden p-2"
          onClick={() => setIsMenuOpen(!isMenuOpen)}
        >
          {isMenuOpen ? (
            <XIcon className="h-6 w-6" />
          ) : (
            <MenuIcon className="h-6 w-6" />
          )}
        </button>
      </div>
      
      {/* 移动端菜单 */}
      {isMenuOpen && (
        <div className="md:hidden border-t">
          <div className="container py-4 space-y-4">
            <Link 
              href="/" 
              className="block font-medium hover:text-primary transition-colors"
              onClick={() => setIsMenuOpen(false)}
            >
              Home
            </Link>
            <Link 
              href="/#features" 
              className="block font-medium hover:text-primary transition-colors"
              onClick={() => setIsMenuOpen(false)}
            >
              Features
            </Link>
            <Link 
              href="/#tools" 
              className="block font-medium hover:text-primary transition-colors"
              onClick={() => setIsMenuOpen(false)}
            >
              Tools
            </Link>
            <Link 
              href="/#faq" 
              className="block font-medium hover:text-primary transition-colors"
              onClick={() => setIsMenuOpen(false)}
            >
              FAQ
            </Link>
          </div>
        </div>
      )}
    </div>
  )
} 
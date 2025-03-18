'use client';

import Link from "next/link"
import { ImageIcon } from "lucide-react"

export function Footer() {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="border-t py-12 bg-muted/40">
      <div className="container grid gap-8 md:grid-cols-2 lg:grid-cols-4">
        <div className="space-y-4">
          <div className="flex items-center space-x-2">
            <div className="bg-primary p-2 rounded-md">
              <ImageIcon className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="font-bold">Image Converter</span>
          </div>
          <p className="text-sm text-muted-foreground">
            Professional online image processing tool. Compress, convert formats, and more using just your browser. No software downloads required, protecting your privacy.
          </p>
          <p className="text-sm text-muted-foreground">
            &copy; {currentYear} Image Converter. All rights reserved.
          </p>
        </div>

        <div>
          <h3 className="font-medium mb-4">Tools</h3>
          <ul className="space-y-2 text-sm">
            <li>
              <Link href="/" className="text-muted-foreground hover:text-foreground transition-colors">
                Image Compression
              </Link>
            </li>
            <li>
              <Link href="/" className="text-muted-foreground hover:text-foreground transition-colors">
                Format Conversion
              </Link>
            </li>
            <li>
              <Link href="/" className="text-muted-foreground hover:text-foreground transition-colors">
                Batch Processing
              </Link>
            </li>
          </ul>
        </div>

        <div>
          <h3 className="font-medium mb-4">Resources</h3>
          <ul className="space-y-2 text-sm">
            <li>
              <Link href="/#faq" className="text-muted-foreground hover:text-foreground transition-colors">
                FAQ
              </Link>
            </li>
            <li>
              <Link href="/" className="text-muted-foreground hover:text-foreground transition-colors">
                User Guide
              </Link>
            </li>
            <li>
              <a
                href="https://github.com/goudan1030/image-converter"
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                Source Code
              </a>
            </li>
          </ul>
        </div>

        <div>
          <h3 className="font-medium mb-4">About</h3>
          <ul className="space-y-2 text-sm">
            <li>
              <Link href="/" className="text-muted-foreground hover:text-foreground transition-colors">
                Privacy Policy
              </Link>
            </li>
            <li>
              <Link href="/" className="text-muted-foreground hover:text-foreground transition-colors">
                Terms of Use
              </Link>
            </li>
            <li>
              <Link href="/" className="text-muted-foreground hover:text-foreground transition-colors">
                Contact Us
              </Link>
            </li>
          </ul>
        </div>
      </div>
    </footer>
  )
} 
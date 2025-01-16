import Link from "next/link"
import { ImageIcon } from "lucide-react"
import { cn } from "@/lib/utils"

export function MainNav() {
  return (
    <div className="border-b">
      <div className="container flex h-16 items-center">
        <Link href="/" className="flex items-center space-x-2">
          <div className="bg-primary p-2 rounded-md">
            <ImageIcon className="h-6 w-6 text-primary-foreground" />
          </div>
          <span className="font-bold">JPEG Imager</span>
        </Link>
        <div className="ml-auto flex items-center space-x-4">
          <a
            href="https://github.com/goudan1030/image-converter"
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            GitHub
          </a>
        </div>
      </div>
    </div>
  )
} 
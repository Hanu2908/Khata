import React from 'react'
import { Heart } from 'lucide-react'

const Github = (props: React.SVGProps<SVGSVGElement>) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={props.className}
  >
    <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4" />
    <path d="M9 18c-4.51 2-5-2-7-2" />
  </svg>
)

export const LandingFooter: React.FC = () => {
  return (
    <footer className="w-full border-t border-border bg-card py-6 transition-colors duration-200 font-sans">
      <div className="max-w-6xl mx-auto px-4 lg:px-8 flex flex-col sm:flex-row justify-between items-center gap-4 text-xs text-text-tertiary">
        <div className="flex items-center gap-1.5 font-medium">
          <Heart className="w-4 h-4 text-accent fill-accent" />
          <span>Built for Indian college students with ☕ by Himanshu</span>
        </div>
        <div className="flex items-center gap-4">
          <a 
            href="https://github.com" 
            target="_blank" 
            rel="noopener noreferrer" 
            className="flex items-center gap-1.5 hover:text-text-primary transition-colors cursor-pointer"
          >
            <Github className="w-4.5 h-4.5" />
            <span>GitHub</span>
          </a>
          <span>&copy; {new Date().getFullYear()} Yaari Khaatha</span>
        </div>
      </div>
    </footer>
  )
}

'use client'

import Link from 'next/link'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Badge } from '@/components/ui/badge'
import { 
  Github, 
  ExternalLink, 
  Menu, 
  X, 
  Zap, 
  BookOpen, 
  Code, 
  Users,
  Star
} from 'lucide-react'

interface HeaderProps {
  className?: string
}

export default function Header({ className = '' }: HeaderProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const navigation = [
    { name: 'Generate', href: '#', icon: Zap, description: 'Create specifications' },
    { name: 'Documentation', href: '#', icon: BookOpen, description: 'Learn how to use OpenSpec' },
    { name: 'API Reference', href: '#', icon: Code, description: 'OpenRouter integration guide' },
    { name: 'Community', href: '#', icon: Users, description: 'Join our community' },
  ]

  return (
    <header className={`border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 ${className}`}>
      <nav className="mx-auto max-w-7xl px-6 lg:px-8" aria-label="Global">
        <div className="flex h-16 items-center justify-between">
          {/* Logo and Brand */}
          <div className="flex lg:flex-1">
            <Link href="/" className="flex items-center space-x-2 -m-1.5 p-1.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
                <Zap className="h-4 w-4 text-primary-foreground" />
              </div>
              <div className="flex flex-col">
                <span className="text-xl font-bold">OpenSpec</span>
                <div className="flex items-center space-x-1">
                  <Badge variant="secondary" className="text-xs px-1.5 py-0">
                    Beta
                  </Badge>
                  <Badge variant="outline" className="text-xs px-1.5 py-0">
                    Open Source
                  </Badge>
                </div>
              </div>
            </Link>
          </div>

          {/* Mobile menu button */}
          <div className="flex lg:hidden">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-expanded={mobileMenuOpen}
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? (
                <X className="h-5 w-5" />
              ) : (
                <Menu className="h-5 w-5" />
              )}
            </Button>
          </div>

          {/* Desktop navigation */}
          <div className="hidden lg:flex lg:gap-x-8">
            {navigation.map((item) => {
              const IconComponent = item.icon
              return (
                <DropdownMenu key={item.name}>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="flex items-center gap-2">
                      <IconComponent className="h-4 w-4" />
                      {item.name}
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start" className="w-64">
                    <DropdownMenuItem asChild>
                      <Link href={item.href} className="flex flex-col items-start p-3">
                        <div className="flex items-center gap-2 text-sm font-medium">
                          <IconComponent className="h-4 w-4" />
                          {item.name}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          {item.description}
                        </p>
                      </Link>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )
            })}
          </div>

          {/* Right side actions */}
          <div className="hidden lg:flex lg:flex-1 lg:justify-end lg:gap-x-3">
            <Button variant="ghost" size="sm" asChild>
              <Link 
                href="https://github.com/openspec/openspec" 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center gap-2"
              >
                <Github className="h-4 w-4" />
                <span className="hidden sm:inline">Star on GitHub</span>
              </Link>
            </Button>
            <Button variant="ghost" size="sm" asChild>
              <Link 
                href="https://openrouter.ai" 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center gap-2"
              >
                <ExternalLink className="h-4 w-4" />
                <span className="hidden sm:inline">OpenRouter</span>
              </Link>
            </Button>
            <Button size="sm" asChild>
              <Link href="#generate" className="flex items-center gap-2">
                <Zap className="h-4 w-4" />
                Get Started
              </Link>
            </Button>
          </div>
        </div>

        {/* Mobile navigation panel */}
        {mobileMenuOpen && (
          <div className="lg:hidden">
            <div className="space-y-2 px-2 pb-3 pt-2">
              {navigation.map((item) => {
                const IconComponent = item.icon
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className="flex items-start gap-3 rounded-lg p-3 hover:bg-accent"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <IconComponent className="h-5 w-5 mt-0.5 text-muted-foreground" />
                    <div className="flex flex-col">
                      <span className="text-sm font-medium">{item.name}</span>
                      <span className="text-xs text-muted-foreground">
                        {item.description}
                      </span>
                    </div>
                  </Link>
                )
              })}
              
              <div className="border-t pt-2 mt-2 space-y-2">
                <Link
                  href="https://github.com/openspec/openspec"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 rounded-lg p-3 hover:bg-accent"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <Github className="h-5 w-5 text-muted-foreground" />
                  <div className="flex flex-col">
                    <span className="text-sm font-medium">GitHub Repository</span>
                    <span className="text-xs text-muted-foreground">
                      Star and contribute
                    </span>
                  </div>
                </Link>
                
                <Link
                  href="https://openrouter.ai"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 rounded-lg p-3 hover:bg-accent"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <ExternalLink className="h-5 w-5 text-muted-foreground" />
                  <div className="flex flex-col">
                    <span className="text-sm font-medium">OpenRouter</span>
                    <span className="text-xs text-muted-foreground">
                      Get your API key
                    </span>
                  </div>
                </Link>
              </div>
              
              <div className="border-t pt-2 mt-2">
                <Link
                  href="#generate"
                  className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary p-3 text-primary-foreground hover:bg-primary/90"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <Zap className="h-4 w-4" />
                  Get Started
                </Link>
              </div>
            </div>
          </div>
        )}
      </nav>
    </header>
  )
}
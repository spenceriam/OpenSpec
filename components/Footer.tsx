'use client'

import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Github,
  ExternalLink,
  Heart,
  Zap,
  BookOpen,
  Users,
  MessageCircle,
  Mail,
  Shield,
  FileText
} from 'lucide-react'

interface FooterProps {
  className?: string
}

export default function Footer({ className = '' }: FooterProps) {
  const currentYear = new Date().getFullYear()

  const footerSections = [
    {
      title: 'Product',
      links: [
        { name: 'Features', href: '#features', icon: Zap },
        { name: 'Documentation', href: '#docs', icon: BookOpen },
        { name: 'Examples', href: '#examples', icon: FileText },
        { name: 'Pricing', href: '#pricing', icon: Shield },
      ]
    },
    {
      title: 'Community',
      links: [
        { name: 'GitHub Discussions', href: 'https://github.com/openspec/openspec/discussions', icon: MessageCircle, external: true },
        { name: 'Discord Server', href: '#discord', icon: Users },
        { name: 'Twitter', href: '#twitter', icon: ExternalLink, external: true },
        { name: 'Newsletter', href: '#newsletter', icon: Mail },
      ]
    },
    {
      title: 'Resources',
      links: [
        { name: 'OpenRouter', href: 'https://openrouter.ai', icon: ExternalLink, external: true },
        { name: 'Kiro IDE', href: 'https://kiro.ai', icon: ExternalLink, external: true },
        { name: 'API Reference', href: '#api', icon: BookOpen },
        { name: 'Tutorials', href: '#tutorials', icon: BookOpen },
      ]
    },
    {
      title: 'Legal',
      links: [
        { name: 'Privacy Policy', href: '#privacy', icon: Shield },
        { name: 'Terms of Service', href: '#terms', icon: FileText },
        { name: 'Open Source License', href: 'https://github.com/openspec/openspec/blob/main/LICENSE', icon: Github, external: true },
        { name: 'Cookie Policy', href: '#cookies', icon: Shield },
      ]
    }
  ]

  return (
    <footer className={`border-t bg-background ${className}`}>
      <div className="mx-auto max-w-7xl px-6 py-12 lg:px-8">
        {/* Main footer content */}
        <div className="xl:grid xl:grid-cols-3 xl:gap-8">
          {/* Brand section */}
          <div className="space-y-6">
            <div className="flex items-center space-x-2">
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
            </div>
            
            <p className="text-sm text-muted-foreground max-w-md">
              Democratizing spec-driven development with AI-powered specification generation. 
              Create comprehensive technical documentation using any AI model through OpenRouter's API.
            </p>

            <div className="flex space-x-3">
              <Button variant="outline" size="sm" asChild>
                <Link 
                  href="https://github.com/openspec/openspec"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2"
                >
                  <Github className="h-4 w-4" />
                  Star on GitHub
                </Link>
              </Button>
              <Button variant="outline" size="sm" asChild>
                <Link 
                  href="https://openrouter.ai"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2"
                >
                  <ExternalLink className="h-4 w-4" />
                  OpenRouter
                </Link>
              </Button>
            </div>
          </div>

          {/* Links grid */}
          <div className="mt-16 grid grid-cols-2 gap-8 xl:col-span-2 xl:mt-0">
            <div className="md:grid md:grid-cols-2 md:gap-8">
              {footerSections.slice(0, 2).map((section) => (
                <div key={section.title} className="mt-10 md:mt-0">
                  <h3 className="text-sm font-semibold leading-6">
                    {section.title}
                  </h3>
                  <ul className="mt-6 space-y-4">
                    {section.links.map((item) => {
                      const IconComponent = item.icon
                      return (
                        <li key={item.name}>
                          <Link
                            href={item.href}
                            target={item.external ? "_blank" : undefined}
                            rel={item.external ? "noopener noreferrer" : undefined}
                            className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-2 transition-colors"
                          >
                            <IconComponent className="h-3 w-3" />
                            {item.name}
                            {item.external && <ExternalLink className="h-3 w-3 ml-1" />}
                          </Link>
                        </li>
                      )
                    })}
                  </ul>
                </div>
              ))}
            </div>
            <div className="md:grid md:grid-cols-2 md:gap-8">
              {footerSections.slice(2, 4).map((section) => (
                <div key={section.title} className="mt-10 md:mt-0">
                  <h3 className="text-sm font-semibold leading-6">
                    {section.title}
                  </h3>
                  <ul className="mt-6 space-y-4">
                    {section.links.map((item) => {
                      const IconComponent = item.icon
                      return (
                        <li key={item.name}>
                          <Link
                            href={item.href}
                            target={item.external ? "_blank" : undefined}
                            rel={item.external ? "noopener noreferrer" : undefined}
                            className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-2 transition-colors"
                          >
                            <IconComponent className="h-3 w-3" />
                            {item.name}
                            {item.external && <ExternalLink className="h-3 w-3 ml-1" />}
                          </Link>
                        </li>
                      )
                    })}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Newsletter signup */}
        <div className="mt-12 border-t pt-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h3 className="text-sm font-semibold">Stay updated</h3>
              <p className="text-sm text-muted-foreground">
                Get the latest updates on new features and AI model integrations.
              </p>
            </div>
            <div className="flex gap-2">
              <input
                type="email"
                placeholder="Enter your email"
                className="flex-1 min-w-0 rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                style={{ minWidth: '200px' }}
              />
              <Button size="sm">
                Subscribe
              </Button>
            </div>
          </div>
        </div>

        {/* Bottom section */}
        <div className="mt-8 border-t pt-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-4">
            <p className="text-xs text-muted-foreground">
              © {currentYear} OpenSpec. All rights reserved.
            </p>
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              Made with <Heart className="h-3 w-3 text-red-500 fill-current" /> by the community
            </div>
          </div>
          
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <span>Powered by OpenRouter</span>
            <span className="hidden sm:inline">•</span>
            <span>Inspired by Kiro IDE</span>
            <span className="hidden sm:inline">•</span>
            <Link 
              href="#status" 
              className="hover:text-foreground transition-colors flex items-center gap-1"
            >
              <div className="h-2 w-2 rounded-full bg-green-500"></div>
              All systems operational
            </Link>
          </div>
        </div>
      </div>
    </footer>
  )
}
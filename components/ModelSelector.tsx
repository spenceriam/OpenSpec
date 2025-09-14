'use client'

import React, { useState, useEffect, useMemo, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  ChevronDown, 
  Check, 
  Search, 
  Zap, 
  Eye, 
  DollarSign, 
  Clock, 
  Cpu, 
  AlertCircle,
  Loader2,
  Filter,
  Star
} from 'lucide-react'
import { OpenRouterModel } from '@/types'
import { useAPIKeyStorage } from '../hooks/useSessionStorage'
import { OpenRouterClient } from '@/lib/openrouter/client'
import { filterModels, searchModels, categorizeModels, formatPrice } from '@/lib/openrouter/model-utils'

interface ModelSelectorProps {
  selectedModel?: OpenRouterModel
  onModelSelect: (model: OpenRouterModel) => void
  showCapabilities?: boolean
  showPricing?: boolean
  filterByCapability?: 'vision' | 'reasoning' | 'coding' | 'all'
  className?: string
}

type SortOption = 'popularity' | 'price-low' | 'price-high' | 'context-high' | 'name'

export function ModelSelector({
  selectedModel,
  onModelSelect,
  showCapabilities = true,
  showPricing = true,
  filterByCapability = 'all',
  className = ''
}: ModelSelectorProps) {
  const { value: apiKey } = useAPIKeyStorage()
  const [models, setModels] = useState<OpenRouterModel[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [categoryFilter, setCategoryFilter] = useState<string>('all')
  const [sortBy, setSortBy] = useState<SortOption>('popularity')
  const [isOpen, setIsOpen] = useState(false)

  // Fetch available models
  const fetchModels = useCallback(async () => {
    if (!apiKey) {
      setError('API key required to load models')
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const client = new OpenRouterClient(apiKey)
      const fetchedModels = await client.listModels()
      
      if (fetchedModels.length === 0) {
        setError('No models available with current API key')
      } else {
        setModels(fetchedModels)
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load models'
      setError(errorMessage)
      console.error('Model loading error:', err)
    } finally {
      setIsLoading(false)
    }
  }, [apiKey])

  // Load models when component mounts or API key changes
  useEffect(() => {
    if (apiKey) {
      fetchModels()
    } else {
      setModels([])
      setError(null)
    }
  }, [apiKey, fetchModels])

  // Filter and sort models
  const filteredAndSortedModels = useMemo(() => {
    let result = [...models]

    // Apply search filter
    if (searchQuery.trim()) {
      result = searchModels(result, searchQuery)
    }

    // Apply capability filter
    if (filterByCapability !== 'all') {
      result = filterModels(result, { capability: filterByCapability })
    }

    // Apply category filter
    if (categoryFilter !== 'all') {
      const categorized = categorizeModels(result)
      result = categorized[categoryFilter] || []
    }

    // Sort models
    result.sort((a, b) => {
      switch (sortBy) {
        case 'popularity':
          return (b.top_provider?.popularity || 0) - (a.top_provider?.popularity || 0)
        case 'price-low':
          return (a.pricing?.prompt || 0) - (b.pricing?.prompt || 0)
        case 'price-high':
          return (b.pricing?.prompt || 0) - (a.pricing?.prompt || 0)
        case 'context-high':
          return (b.context_length || 0) - (a.context_length || 0)
        case 'name':
          return a.name.localeCompare(b.name)
        default:
          return 0
      }
    })

    return result
  }, [models, searchQuery, filterByCapability, categoryFilter, sortBy])

  // Get model categories for filter
  const modelCategories = useMemo(() => {
    if (models.length === 0) return {}
    return categorizeModels(models)
  }, [models])

  // Handle model selection
  const handleModelSelect = (model: OpenRouterModel) => {
    onModelSelect(model)
    setIsOpen(false)
  }

  // Render model capability badges
  const renderCapabilityBadges = (model: OpenRouterModel) => {
    const badges = []

    if (model.architecture?.modality?.includes('vision')) {
      badges.push(
        <Badge key="vision" variant="secondary" className="text-xs">
          <Eye className="h-3 w-3 mr-1" />
          Vision
        </Badge>
      )
    }

    if (model.name.toLowerCase().includes('reasoning') || 
        model.description?.toLowerCase().includes('reasoning')) {
      badges.push(
        <Badge key="reasoning" variant="secondary" className="text-xs">
          <Zap className="h-3 w-3 mr-1" />
          Reasoning
        </Badge>
      )
    }

    if (model.name.toLowerCase().includes('code') || 
        model.description?.toLowerCase().includes('code')) {
      badges.push(
        <Badge key="coding" variant="secondary" className="text-xs">
          <Cpu className="h-3 w-3 mr-1" />
          Coding
        </Badge>
      )
    }

    return badges
  }

  // Render pricing information
  const renderPricingInfo = (model: OpenRouterModel) => {
    if (!showPricing || !model.pricing) return null

    return (
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <div className="flex items-center gap-1">
          <DollarSign className="h-3 w-3" />
          {formatPrice(model.pricing.prompt)}/1K tokens
        </div>
        {model.context_length && (
          <div className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {(model.context_length / 1000).toFixed(0)}K context
          </div>
        )}
      </div>
    )
  }

  // Render model item
  const renderModelItem = (model: OpenRouterModel) => {
    const isSelected = selectedModel?.id === model.id
    const isPopular = (model.top_provider?.popularity || 0) > 50

    return (
      <CommandItem
        key={model.id}
        value={model.id}
        onSelect={() => handleModelSelect(model)}
        className="flex flex-col items-start gap-2 p-3 cursor-pointer hover:bg-muted"
      >
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center gap-2">
            <Check
              className={`h-4 w-4 ${
                isSelected ? 'opacity-100' : 'opacity-0'
              }`}
            />
            <div className="flex items-center gap-2">
              <span className="font-medium">{model.name}</span>
              {isPopular && (
                <Badge variant="outline" className="text-xs">
                  <Star className="h-3 w-3 mr-1" />
                  Popular
                </Badge>
              )}
            </div>
          </div>
        </div>
        
        {model.description && (
          <p className="text-sm text-muted-foreground ml-6">
            {model.description}
          </p>
        )}
        
        <div className="flex items-center justify-between w-full ml-6">
          {showCapabilities && (
            <div className="flex items-center gap-1 flex-wrap">
              {renderCapabilityBadges(model)}
            </div>
          )}
          {renderPricingInfo(model)}
        </div>
      </CommandItem>
    )
  }

  if (!apiKey) {
    return (
      <Card className={`model-selector ${className}`}>
        <CardContent className="pt-6">
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Please enter your OpenRouter API key to view available models.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={`model-selector ${className}`}>
      <CardHeader>
        <CardTitle className="text-lg">AI Model Selection</CardTitle>
        <CardDescription>
          Choose from {models.length} available AI models for spec generation
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Current selection display */}
        {selectedModel && (
          <div className="p-3 bg-muted rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium">{selectedModel.name}</div>
                {selectedModel.description && (
                  <div className="text-sm text-muted-foreground">
                    {selectedModel.description}
                  </div>
                )}
                <div className="flex items-center gap-2 mt-2">
                  {showCapabilities && renderCapabilityBadges(selectedModel)}
                  {renderPricingInfo(selectedModel)}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Model selector */}
        <Popover open={isOpen} onOpenChange={setIsOpen}>
          <PopoverTrigger asChild>
            <Button 
              variant="outline" 
              className="w-full justify-between"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Loading models...
                </>
              ) : selectedModel ? (
                selectedModel.name
              ) : (
                'Select a model...'
              )}
              <ChevronDown className="h-4 w-4 opacity-50" />
            </Button>
          </PopoverTrigger>

          <PopoverContent className="w-96 p-0" align="start">
            <Command>
              <div className="border-b p-2 space-y-2">
                <CommandInput 
                  placeholder="Search models..." 
                  value={searchQuery}
                  onValueChange={setSearchQuery}
                />
                
                <div className="flex gap-2">
                  <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                    <SelectTrigger className="flex-1">
                      <div className="flex items-center gap-1">
                        <Filter className="h-3 w-3" />
                        <SelectValue />
                      </div>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Categories</SelectItem>
                      {Object.keys(modelCategories).map((category) => (
                        <SelectItem key={category} value={category}>
                          {category} ({modelCategories[category].length})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Select value={sortBy} onValueChange={(value) => setSortBy(value as SortOption)}>
                    <SelectTrigger className="flex-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="popularity">Most Popular</SelectItem>
                      <SelectItem value="price-low">Price: Low to High</SelectItem>
                      <SelectItem value="price-high">Price: High to Low</SelectItem>
                      <SelectItem value="context-high">Highest Context</SelectItem>
                      <SelectItem value="name">Name: A-Z</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <CommandList className="max-h-96">
                <CommandEmpty>
                  {error ? (
                    <div className="text-center py-4">
                      <AlertCircle className="h-4 w-4 mx-auto mb-2 text-destructive" />
                      <div className="text-sm text-destructive">{error}</div>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="mt-2"
                        onClick={fetchModels}
                        disabled={isLoading}
                      >
                        {isLoading ? 'Retrying...' : 'Retry'}
                      </Button>
                    </div>
                  ) : (
                    'No models found matching your criteria.'
                  )}
                </CommandEmpty>

                <CommandGroup>
                  {filteredAndSortedModels.map(renderModelItem)}
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>

        {/* Model statistics */}
        {models.length > 0 && (
          <div className="text-xs text-muted-foreground">
            Showing {filteredAndSortedModels.length} of {models.length} models
            {searchQuery && ` matching "${searchQuery}"`}
          </div>
        )}

        {error && !isLoading && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              <div className="flex items-center justify-between">
                <span>{error}</span>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={fetchModels}
                  disabled={isLoading}
                >
                  Retry
                </Button>
              </div>
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  )
}

export default ModelSelector
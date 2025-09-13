'use client'

import React, { useState, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Separator } from '@/components/ui/separator'
import { 
  MessageSquare,
  Send,
  Lightbulb,
  AlertCircle,
  CheckCircle,
  RefreshCw,
  ArrowRight,
  ArrowLeft,
  Eye,
  EyeOff,
  Wand2,
  FileText,
  GitCompare,
  Loader2
} from 'lucide-react'
import { WorkflowPhase, RefinementRequest } from '@/types'
import MarkdownPreview from './MarkdownPreview'

interface ContentRefinementProps {
  phase: WorkflowPhase
  originalContent: string
  refinedContent?: string
  onRefinementRequest: (request: RefinementRequest) => void
  onAcceptChanges?: () => void
  onRejectChanges?: () => void
  isRefining?: boolean
  showComparison?: boolean
  className?: string
}

const REFINEMENT_SUGGESTIONS = {
  requirements: [
    'Add more specific acceptance criteria',
    'Include edge cases and error scenarios',
    'Clarify user personas and use cases',
    'Add performance and scalability requirements',
    'Include security and compliance requirements',
    'Specify integration requirements'
  ],
  design: [
    'Add more detailed component interactions',
    'Include error handling strategies',
    'Specify performance considerations',
    'Add security design patterns',
    'Include scalability architecture',
    'Add monitoring and logging design'
  ],
  tasks: [
    'Break down complex tasks further',
    'Add testing requirements for each task',
    'Include deployment considerations',
    'Add time estimates',
    'Specify dependencies between tasks',
    'Include documentation tasks'
  ]
}

const COMMON_IMPROVEMENTS = [
  'Make it more specific and detailed',
  'Add implementation examples',
  'Include best practices',
  'Improve clarity and organization',
  'Add technical specifications',
  'Include error handling details'
]

export function ContentRefinement({
  phase,
  originalContent,
  refinedContent,
  onRefinementRequest,
  onAcceptChanges,
  onRejectChanges,
  isRefining = false,
  showComparison = true,
  className = ''
}: ContentRefinementProps) {
  const [feedbackText, setFeedbackText] = useState('')
  const [activeTab, setActiveTab] = useState(refinedContent ? 'comparison' : 'feedback')
  const [showSuggestions, setShowSuggestions] = useState(true)

  const handleSuggestionClick = (suggestion: string) => {
    if (feedbackText) {
      setFeedbackText(prev => `${prev}\n\n${suggestion}`)
    } else {
      setFeedbackText(suggestion)
    }
  }

  const handleSubmitRefinement = () => {
    if (!feedbackText.trim()) return

    const refinementRequest: RefinementRequest = {
      phase,
      feedback: feedbackText.trim(),
      requestedAt: new Date().toISOString()
    }

    onRefinementRequest(refinementRequest)
    setFeedbackText('')
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault()
      handleSubmitRefinement()
    }
  }

  const phaseSuggestions = REFINEMENT_SUGGESTIONS[phase] || []
  const allSuggestions = [...phaseSuggestions, ...COMMON_IMPROVEMENTS]

  const hasContent = originalContent.trim().length > 0
  const hasRefinedContent = refinedContent && refinedContent.trim().length > 0
  const hasFeedback = feedbackText.trim().length > 0

  if (!hasContent) {
    return (
      <Card className={`content-refinement ${className}`}>
        <CardContent className="py-8">
          <div className="text-center text-muted-foreground">
            <MessageSquare className="h-8 w-8 mx-auto mb-2" />
            <div>No content available for refinement</div>
            <div className="text-xs mt-1">Generate content first to enable refinement</div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={`content-refinement ${className}`}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Wand2 className="h-5 w-5" />
          Content Refinement
        </CardTitle>
        <CardDescription>
          Provide feedback to improve the {phase} content. Be specific about what you'd like to change or enhance.
        </CardDescription>
      </CardHeader>

      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="feedback" className="flex items-center gap-2">
              <MessageSquare className="h-4 w-4" />
              Feedback
            </TabsTrigger>
            <TabsTrigger 
              value="comparison" 
              disabled={!hasRefinedContent}
              className="flex items-center gap-2"
            >
              <GitCompare className="h-4 w-4" />
              Compare Changes
              {hasRefinedContent && <Badge variant="secondary" className="ml-1 text-xs">New</Badge>}
            </TabsTrigger>
          </TabsList>

          {/* Feedback Tab */}
          <TabsContent value="feedback" className="space-y-4">
            <div className="space-y-4">
              {/* Feedback input */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Your Feedback</label>
                <Textarea
                  value={feedbackText}
                  onChange={(e) => setFeedbackText(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder={`Describe what you'd like to improve in the ${phase} content...

Examples:
- "Add more detail about user authentication"
- "Include error handling scenarios"
- "Break down the complex tasks further"
- "Add performance requirements"`}
                  className="min-h-32 resize-y"
                  disabled={isRefining}
                />
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>{feedbackText.length} characters</span>
                  <span>Press Ctrl+Enter to submit</span>
                </div>
              </div>

              {/* Submit button */}
              <div className="flex items-center gap-2">
                <Button 
                  onClick={handleSubmitRefinement}
                  disabled={!hasFeedback || isRefining}
                  className="flex items-center gap-2"
                >
                  {isRefining ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Refining...
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4" />
                      Request Refinement
                    </>
                  )}
                </Button>

                {hasRefinedContent && (
                  <Button 
                    variant="outline"
                    onClick={() => setActiveTab('comparison')}
                    className="flex items-center gap-2"
                  >
                    <GitCompare className="h-4 w-4" />
                    View Changes
                  </Button>
                )}
              </div>

              <Separator />

              {/* Suggestions */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Lightbulb className="h-4 w-4" />
                    <span className="text-sm font-medium">Suggested Improvements</span>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowSuggestions(!showSuggestions)}
                    className="flex items-center gap-1"
                  >
                    {showSuggestions ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                    {showSuggestions ? 'Hide' : 'Show'}
                  </Button>
                </div>

                {showSuggestions && (
                  <div className="space-y-2">
                    <div className="text-xs text-muted-foreground mb-2">
                      Click any suggestion to add it to your feedback
                    </div>
                    <div className="grid gap-2">
                      {allSuggestions.map((suggestion, index) => (
                        <Button
                          key={index}
                          variant="outline"
                          size="sm"
                          onClick={() => handleSuggestionClick(suggestion)}
                          className="justify-start h-auto p-3 text-left whitespace-normal"
                          disabled={isRefining}
                        >
                          <div className="flex items-start gap-2">
                            <ArrowRight className="h-3 w-3 mt-0.5 flex-shrink-0" />
                            <span className="text-sm">{suggestion}</span>
                          </div>
                        </Button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </TabsContent>

          {/* Comparison Tab */}
          <TabsContent value="comparison" className="space-y-4">
            {hasRefinedContent ? (
              <div className="space-y-4">
                {/* Action buttons */}
                <div className="flex items-center justify-between">
                  <div className="text-sm text-muted-foreground">
                    Review the changes and decide whether to accept or request further refinements
                  </div>
                  <div className="flex items-center gap-2">
                    {onRejectChanges && (
                      <Button
                        variant="outline"
                        onClick={onRejectChanges}
                        disabled={isRefining}
                        className="flex items-center gap-2"
                      >
                        <ArrowLeft className="h-4 w-4" />
                        Reject Changes
                      </Button>
                    )}
                    {onAcceptChanges && (
                      <Button
                        onClick={onAcceptChanges}
                        disabled={isRefining}
                        className="flex items-center gap-2"
                      >
                        <CheckCircle className="h-4 w-4" />
                        Accept Changes
                      </Button>
                    )}
                  </div>
                </div>

                {/* Side-by-side comparison */}
                {showComparison ? (
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm font-medium">
                        <FileText className="h-4 w-4" />
                        Original Content
                      </div>
                      <div className="max-h-96 overflow-auto border rounded-lg">
                        <MarkdownPreview
                          content={originalContent}
                          showTitle={false}
                          showStats={false}
                          showRawMarkdown={false}
                          className="border-0"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm font-medium">
                        <RefreshCw className="h-4 w-4" />
                        Refined Content
                        <Badge variant="secondary" className="text-xs">New</Badge>
                      </div>
                      <div className="max-h-96 overflow-auto border rounded-lg">
                        <MarkdownPreview
                          content={refinedContent}
                          showTitle={false}
                          showStats={false}
                          showRawMarkdown={false}
                          className="border-0"
                        />
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <MarkdownPreview
                      content={refinedContent}
                      title="Refined Content"
                      showStats={true}
                    />
                  </div>
                )}

                {/* Content statistics */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-muted/50 rounded-lg">
                  <div className="text-center">
                    <div className="text-lg font-semibold">
                      {originalContent.split(/\s+/).length}
                    </div>
                    <div className="text-xs text-muted-foreground">Original Words</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-semibold">
                      {refinedContent.split(/\s+/).length}
                    </div>
                    <div className="text-xs text-muted-foreground">Refined Words</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-semibold">
                      {((refinedContent.split(/\s+/).length - originalContent.split(/\s+/).length) / originalContent.split(/\s+/).length * 100).toFixed(1)}%
                    </div>
                    <div className="text-xs text-muted-foreground">Change</div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <GitCompare className="h-8 w-8 mx-auto mb-2" />
                <div>No refined content available</div>
                <div className="text-xs mt-1">Submit feedback to generate refined content</div>
              </div>
            )}
          </TabsContent>
        </Tabs>

        {/* Status indicators */}
        {isRefining && (
          <Alert className="mt-4">
            <Loader2 className="h-4 w-4 animate-spin" />
            <AlertDescription>
              Refining content based on your feedback. This may take a moment...
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  )
}

export default ContentRefinement
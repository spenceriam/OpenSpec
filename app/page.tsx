'use client'

import { useState } from 'react'
import ApiKeyInput from '@/components/ApiKeyInput'
import ModelSelector from '@/components/ModelSelector'
import PromptInput from '@/components/PromptInput'
import WorkflowProgress from '@/components/WorkflowProgress'
import MarkdownPreview from '@/components/MarkdownPreview'
import ContentRefinement from '@/components/ContentRefinement'
import ApprovalControls from '@/components/ApprovalControls'
import ExportDialog from '@/components/ExportDialog'
import ErrorBoundary, { ComponentErrorBoundary } from '@/components/ErrorBoundary'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { FileText, Download, Zap, Settings } from 'lucide-react'

// This would normally come from your workflow state management
const mockWorkflowState = {
  currentPhase: 'requirements' as const,
  phaseContent: {
    requirements: '',
    design: '',
    tasks: ''
  },
  approvals: {
    requirements: 'pending' as const,
    design: 'pending' as const,
    tasks: 'pending' as const
  },
  isGenerating: false,
  lastUpdated: new Date().toISOString()
}

export default function Home() {
  const [apiKey, setApiKey] = useState('')
  const [selectedModel, setSelectedModel] = useState(null)
  const [prompt, setPrompt] = useState('')
  const [contextFiles, setContextFiles] = useState([])
  const [workflowState, setWorkflowState] = useState(mockWorkflowState)
  const [activeTab, setActiveTab] = useState('setup')
  const [showExportDialog, setShowExportDialog] = useState(false)

  const hasApiKey = Boolean(apiKey)
  const hasModel = Boolean(selectedModel)
  const hasPrompt = prompt.trim().length > 10
  const canStartGeneration = hasApiKey && hasModel && hasPrompt

  const handleApiKeyValidated = (isValid: boolean, key?: string) => {
    if (isValid && key) {
      setApiKey(key)
    }
  }

  const handleGenerate = () => {
    // This would trigger the actual generation process
    console.log('Starting generation with:', { apiKey, selectedModel, prompt, contextFiles })
    setActiveTab('workflow')
  }

  const handleExport = (options: any) => {
    console.log('Exporting with options:', options)
    setShowExportDialog(false)
  }

  return (
    <div className="container mx-auto py-8 space-y-8">
      {/* Hero Section */}
      <div className="text-center space-y-4 mb-12">
        <h1 className="text-4xl font-bold tracking-tight">
          Generate Technical Specifications with AI
        </h1>
        <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
          Create comprehensive requirements, design documents, and implementation tasks using 
          OpenRouter's AI models with automatic diagram generation.
        </p>
      </div>

      {/* Main Application */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-8">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="setup" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Setup
          </TabsTrigger>
          <TabsTrigger value="workflow" className="flex items-center gap-2" disabled={!canStartGeneration}>
            <Zap className="h-4 w-4" />
            Generate
          </TabsTrigger>
          <TabsTrigger value="preview" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Preview
          </TabsTrigger>
          <TabsTrigger value="export" className="flex items-center gap-2">
            <Download className="h-4 w-4" />
            Export
          </TabsTrigger>
        </TabsList>

        {/* Setup Tab */}
        <TabsContent value="setup" className="space-y-8">
          <div className="grid gap-8">
            <ComponentErrorBoundary name="ApiKeyInput">
              <ApiKeyInput
                onApiKeyValidated={handleApiKeyValidated}
                autoTest={true}
              />
            </ComponentErrorBoundary>

            {hasApiKey && (
              <ComponentErrorBoundary name="ModelSelector">
                <ModelSelector
                  selectedModel={selectedModel}
                  onModelSelect={setSelectedModel}
                />
              </ComponentErrorBoundary>
            )}

            {hasModel && (
              <ComponentErrorBoundary name="PromptInput">
                <PromptInput
                  prompt={prompt}
                  onPromptChange={setPrompt}
                  contextFiles={contextFiles}
                  onFilesChange={setContextFiles}
                />
              </ComponentErrorBoundary>
            )}

            {canStartGeneration && (
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium">Ready to Generate</div>
                      <div className="text-sm text-muted-foreground">
                        All setup complete. Click generate to create your specification.
                      </div>
                    </div>
                    <Button onClick={handleGenerate} size="lg" className="flex items-center gap-2">
                      <Zap className="h-4 w-4" />
                      Generate Specification
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        {/* Workflow Tab */}
        <TabsContent value="workflow" className="space-y-8">
          <div className="grid gap-8 lg:grid-cols-3">
            <div className="lg:col-span-1">
              <ComponentErrorBoundary name="WorkflowProgress">
                <WorkflowProgress
                  workflowState={workflowState}
                />
              </ComponentErrorBoundary>
            </div>
            <div className="lg:col-span-2 space-y-6">
              <ComponentErrorBoundary name="ApprovalControls">
                <ApprovalControls
                  phase={workflowState.currentPhase}
                  content={workflowState.phaseContent[workflowState.currentPhase]}
                  approvalState={workflowState.approvals[workflowState.currentPhase]}
                  onApprove={() => console.log('Approved')}
                  onReject={() => console.log('Rejected')}
                  onRequestRefinement={() => console.log('Request refinement')}
                />
              </ComponentErrorBoundary>
              
              {workflowState.phaseContent[workflowState.currentPhase] && (
                <ComponentErrorBoundary name="ContentRefinement">
                  <ContentRefinement
                    phase={workflowState.currentPhase}
                    originalContent={workflowState.phaseContent[workflowState.currentPhase]}
                    onRefinementRequest={() => console.log('Refinement requested')}
                  />
                </ComponentErrorBoundary>
              )}
            </div>
          </div>
        </TabsContent>

        {/* Preview Tab */}
        <TabsContent value="preview" className="space-y-8">
          <ComponentErrorBoundary name="MarkdownPreview">
            <MarkdownPreview
              content={workflowState.phaseContent[workflowState.currentPhase] || '# No content generated yet\n\nGenerate some content in the workflow tab to see it here.'}
              title={`${workflowState.currentPhase.charAt(0).toUpperCase() + workflowState.currentPhase.slice(1)} Preview`}
              showDiagrams={true}
              showStats={true}
            />
          </ComponentErrorBoundary>
        </TabsContent>

        {/* Export Tab */}
        <TabsContent value="export" className="space-y-8">
          <Card>
            <CardHeader>
              <CardTitle>Export Specification</CardTitle>
              <CardDescription>
                Download your generated specification in various formats
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={() => setShowExportDialog(true)} className="flex items-center gap-2">
                <Download className="h-4 w-4" />
                Open Export Dialog
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Export Dialog */}
      <ExportDialog
        open={showExportDialog}
        onOpenChange={setShowExportDialog}
        workflowState={workflowState}
        onExport={handleExport}
      />
    </div>
  )
}

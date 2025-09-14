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
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import { FileText, Download, Play, Key, Brain, MessageSquare, ArrowRight } from 'lucide-react'

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
  const [currentStep, setCurrentStep] = useState(1)
  const [showExportDialog, setShowExportDialog] = useState(false)

  const hasApiKey = Boolean(apiKey)
  const hasModel = Boolean(selectedModel)
  const hasPrompt = prompt.trim().length > 10
  const canStartGeneration = hasApiKey && hasModel && hasPrompt

  const handleApiKeyValidated = (isValid: boolean, key?: string) => {
    if (isValid && key) {
      setApiKey(key)
      setCurrentStep(2)
    }
  }

  const handleModelSelected = (model: any) => {
    setSelectedModel(model)
    setCurrentStep(3)
  }

  const handleGenerate = () => {
    console.log('Starting generation with:', { apiKey, selectedModel, prompt, contextFiles })
    setCurrentStep(4)
  }

  const handleExport = (options: any) => {
    console.log('Exporting with options:', options)
    setShowExportDialog(false)
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Clean Header */}
      <div className="border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center space-x-3">
              <div className="h-8 w-8 bg-black rounded-md flex items-center justify-center">
                <FileText className="h-5 w-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-semibold text-gray-900">OpenSpec</h1>
                <p className="text-sm text-gray-500">AI-Powered Specification Generator</p>
              </div>
            </div>
            <Badge variant="secondary">Beta</Badge>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            Generate Technical Specifications
          </h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Create comprehensive requirements, design documents, and implementation tasks using AI models with automatic diagram generation.
          </p>
        </div>

        {/* Step Progress */}
        <div className="mb-12">
          <div className="flex items-center justify-between mb-8">
            {[
              { step: 1, label: 'API Key', icon: Key, completed: hasApiKey },
              { step: 2, label: 'AI Model', icon: Brain, completed: hasModel },
              { step: 3, label: 'Prompt', icon: MessageSquare, completed: hasPrompt },
              { step: 4, label: 'Generate', icon: Play, completed: false }
            ].map(({ step, label, icon: Icon, completed }, index) => (
              <div key={step} className="flex items-center">
                <div className={`flex items-center justify-center w-10 h-10 rounded-full border-2 ${
                  currentStep > step || completed 
                    ? 'bg-black border-black text-white' 
                    : currentStep === step 
                      ? 'border-black text-black bg-white'
                      : 'border-gray-300 text-gray-300 bg-white'
                }`}>
                  <Icon className="w-5 h-5" />
                </div>
                <div className="ml-3">
                  <p className={`text-sm font-medium ${
                    currentStep >= step ? 'text-gray-900' : 'text-gray-400'
                  }`}>{label}</p>
                </div>
                {index < 3 && (
                  <ArrowRight className="w-5 h-5 text-gray-300 ml-8" />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Step Content */}
        <div className="space-y-8">
          {/* Step 1: API Key */}
          <div className={currentStep === 1 ? 'block' : 'hidden'}>
            <ComponentErrorBoundary name="ApiKeyInput">
              <ApiKeyInput
                onApiKeyValidated={handleApiKeyValidated}
                autoTest={true}
              />
            </ComponentErrorBoundary>
          </div>

          {/* Step 2: Model Selection */}
          {hasApiKey && (
            <div className={currentStep === 2 ? 'block' : 'hidden'}>
              <ComponentErrorBoundary name="ModelSelector">
                <ModelSelector
                  selectedModel={selectedModel}
                  onModelSelect={handleModelSelected}
                />
              </ComponentErrorBoundary>
            </div>
          )}

          {/* Step 3: Prompt Input */}
          {hasModel && (
            <div className={currentStep === 3 ? 'block' : 'hidden'}>
              <ComponentErrorBoundary name="PromptInput">
                <PromptInput
                  prompt={prompt}
                  onPromptChange={setPrompt}
                  contextFiles={contextFiles}
                  onFilesChange={setContextFiles}
                />
              </ComponentErrorBoundary>
              
              {hasPrompt && (
                <div className="mt-8">
                  <Card>
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-medium text-gray-900 mb-1">Ready to Generate</h3>
                          <p className="text-sm text-gray-600">
                            All setup complete. Click generate to create your specification.
                          </p>
                        </div>
                        <Button onClick={handleGenerate} size="lg" className="bg-black hover:bg-gray-800 text-white">
                          <Play className="h-4 w-4 mr-2" />
                          Generate Specification
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}
            </div>
          )}

          {/* Step 4: Generation/Results */}
          {currentStep === 4 && (
            <div className="space-y-8">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Play className="h-5 w-5" />
                    Generating Your Specification
                  </CardTitle>
                  <CardDescription>
                    AI is creating your technical specification based on your requirements.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    <ComponentErrorBoundary name="WorkflowProgress">
                      <WorkflowProgress workflowState={workflowState} />
                    </ComponentErrorBoundary>
                    
                    <Separator />
                    
                    <ComponentErrorBoundary name="MarkdownPreview">
                      <MarkdownPreview
                        content={workflowState.phaseContent[workflowState.currentPhase] || '# Generating content...\n\nYour specification is being created. This will appear here once generation begins.'}
                        title={`${workflowState.currentPhase.charAt(0).toUpperCase() + workflowState.currentPhase.slice(1)} Preview`}
                        showDiagrams={true}
                        showStats={true}
                      />
                    </ComponentErrorBoundary>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Export Options</CardTitle>
                  <CardDescription>
                    Download your generated specification in various formats
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button onClick={() => setShowExportDialog(true)} variant="outline" className="border-gray-300">
                    <Download className="h-4 w-4 mr-2" />
                    Export Specification
                  </Button>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </div>

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

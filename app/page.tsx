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
import { FileText, Download, Play, Key, Brain, MessageSquare } from 'lucide-react'

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
    <div className="h-full bg-white flex flex-col">
      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex-1 flex flex-col">
        {/* Compact Hero Section */}
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Generate Technical Specifications
          </h2>
          <p className="text-sm text-gray-600 max-w-xl mx-auto">
            Create comprehensive requirements, design documents, and tasks using AI models.
          </p>
        </div>

        {/* Step Progress */}
        <div className="mb-6">
          <div className="flex items-center justify-center gap-8 mb-6">
            {[
              { step: 1, label: 'API Key', icon: Key, completed: hasApiKey },
              { step: 2, label: 'AI Model', icon: Brain, completed: hasModel },
              { step: 3, label: 'Prompt', icon: MessageSquare, completed: hasPrompt },
              { step: 4, label: 'Generate', icon: Play, completed: false }
            ].map(({ step, label, icon: Icon, completed }) => (
              <div key={step} className="flex flex-col items-center">
                <div className={`flex items-center justify-center w-8 h-8 rounded-full border-2 mb-2 ${
                  currentStep > step || completed 
                    ? 'bg-black border-black text-white' 
                    : currentStep === step 
                      ? 'border-black text-black bg-white'
                      : 'border-gray-300 text-gray-300 bg-white'
                }`}>
                  <Icon className="w-4 h-4" />
                </div>
                <p className={`text-xs font-medium ${
                  currentStep >= step ? 'text-gray-900' : 'text-gray-400'
                }`}>{label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Step Content */}
        <div className="flex-1 flex flex-col justify-start">
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

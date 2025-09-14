'use client'

import { useState, useEffect } from 'react'
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
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { FileText, Download, Play, Key, Brain, MessageSquare, Check, X } from 'lucide-react'
import { useAPIKeyStorage, useModelStorage, usePromptStorage, useContextFilesStorage } from '@/hooks/useSessionStorage'
import { DotPattern } from '@/components/magicui/dot-pattern'

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
  const { value: apiKey, hasValidKey, clearAPIKey } = useAPIKeyStorage()
  const { selectedModel, setModel, clearModel } = useModelStorage()
  const { prompt, setPrompt, clearPrompt } = usePromptStorage()
  const { contextFiles, setFiles: setContextFiles, clearFiles: clearContextFiles } = useContextFilesStorage()
  const [workflowState, setWorkflowState] = useState(mockWorkflowState)
  const [currentStep, setCurrentStep] = useState(1)
  const [showExportDialog, setShowExportDialog] = useState(false)
  const [showContinueDialog, setShowContinueDialog] = useState(false)
  const [hasCheckedSession, setHasCheckedSession] = useState(false)
  const [apiKeyStatus, setApiKeyStatus] = useState<'loading' | 'success' | 'error' | null>(null)
  const [modelLoadStatus, setModelLoadStatus] = useState<'loading' | 'success' | 'error' | null>(null)

  const hasApiKey = Boolean(apiKey && hasValidKey)
  const hasModel = Boolean(selectedModel)
  const hasPrompt = prompt.trim().length > 10
  const canStartGeneration = hasApiKey && hasModel && hasPrompt

  // Debug logging for state tracking
  console.log('Main page render state:', {
    currentStep,
    hasApiKey,
    hasModel,
    hasPrompt,
    apiKeyStatus,
    modelLoadStatus,
    apiKeyValue: apiKey ? 'present' : 'missing',
    selectedModelName: selectedModel?.name || 'none'
  })

  // Check for existing session data on mount - ONLY ONCE
  useEffect(() => {
    if (hasCheckedSession) return // Don't check again if we've already checked
    
    const hasPromptData = prompt.trim().length > 10 // Meaningful prompt content
    const hasFiles = contextFiles.length > 0
    // Only show dialog if user has made meaningful progress beyond just API key + model selection
    const hasMeaningfulProgress = (hasApiKey && hasModel && (hasPromptData || hasFiles))
    
    if (hasMeaningfulProgress) {
      setShowContinueDialog(true)
    }
    
    // Set initial step based on what's already completed
    if (hasApiKey && selectedModel && hasPromptData) {
      setCurrentStep(3)
      setApiKeyStatus('success')
      setModelLoadStatus('success')
    } else if (hasApiKey && selectedModel) {
      setCurrentStep(3)
      setApiKeyStatus('success')
      setModelLoadStatus('success')
    } else if (hasApiKey) {
      setCurrentStep(2)
      setApiKeyStatus('success')
    }
    
    setHasCheckedSession(true) // Mark that we've checked the session
  }, [hasApiKey, selectedModel, prompt, contextFiles, hasCheckedSession])

  const handleApiKeyValidated = (isValid: boolean, key?: string) => {
    if (isValid && key) {
      setApiKeyStatus('success')
      setCurrentStep(2)
    } else {
      setApiKeyStatus('error')
    }
  }

  const handleModelSelected = (model: any) => {
    setModel(model)
    setModelLoadStatus('success')
    setCurrentStep(3)
  }

  const handleResetAndStartFresh = () => {
    // Reset: Clear ALL session data including API key, model, prompt, and context files
    clearAPIKey()
    clearModel()
    clearPrompt()
    clearContextFiles()
    
    // Clear current session state
    setApiKeyStatus(null)
    setModelLoadStatus(null)
    setCurrentStep(1)
    setShowContinueDialog(false)
    setHasCheckedSession(true) // Mark as checked so dialog won't show again
    
    // Reset workflow state if needed
    setWorkflowState(mockWorkflowState)
    
    console.log('Session reset - all data cleared, starting fresh')
  }

  const handleContinue = () => {
    setShowContinueDialog(false)
    setHasCheckedSession(true) // Mark as checked so dialog won't show again
    // Step is already set correctly in useEffect
  }

  const handleGenerate = () => {
    console.log('Starting generation with:', { apiKey, selectedModel, prompt, contextFiles })
    setCurrentStep(4)
  }

  const handleExport = (options: any) => {
    console.log('Exporting with options:', options)
    setShowExportDialog(false)
  }

  // Handle step navigation - allow going back to previous steps
  const handleStepClick = (step: number) => {
    // Only allow navigation to completed steps or the current step
    if (step <= currentStep || (step === 1) || 
        (step === 2 && hasApiKey) || 
        (step === 3 && hasApiKey && hasModel)) {
      setCurrentStep(step)
    }
  }

  // Check if step is clickable
  const isStepClickable = (step: number, completed: boolean) => {
    return step < currentStep || completed || 
           (step === 1) || 
           (step === 2 && hasApiKey) || 
           (step === 3 && hasApiKey && hasModel)
  }

  return (
    <div className="h-full bg-background flex flex-col relative overflow-hidden">
      {/* Subtle Dot Pattern Background */}
      <DotPattern 
        className="opacity-20 fill-muted-foreground/10" 
        width={32} 
        height={32} 
        cx={1} 
        cy={1} 
        cr={0.8}
      />
      
      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex-1 flex flex-col relative z-10">
        {/* Compact Hero Section */}
        <div className="text-center mb-4">
          <h2 className="text-xl font-bold text-foreground mb-1">
            Generate Technical Specifications
          </h2>
          <p className="text-xs text-muted-foreground max-w-xl mx-auto">
            Create comprehensive requirements, design documents, and tasks using AI models.
          </p>
        </div>

        {/* Step Progress */}
        <div className="mb-3">
          <div className="flex items-center justify-center gap-8 mb-3">
            {[
              { step: 1, label: 'API Key', icon: Key, completed: hasApiKey },
              { step: 2, label: 'AI Model', icon: Brain, completed: hasModel },
              { step: 3, label: 'Prompt', icon: MessageSquare, completed: hasPrompt },
              { step: 4, label: 'Generate', icon: Play, completed: false }
            ].map(({ step, label, icon: Icon, completed }) => {
              const clickable = isStepClickable(step, completed)
              const isGenerateStep = step === 4
              const isReadyToGenerate = isGenerateStep && canStartGeneration
              
              // Determine status for each step
              let stepStatus: 'success' | 'error' | 'loading' | null = null
              if (step === 1) stepStatus = apiKeyStatus
              if (step === 2) stepStatus = modelLoadStatus
              if (step === 3 && hasPrompt) stepStatus = 'success'
              
              // Choose icon based on status
              let DisplayIcon = Icon
              if (stepStatus === 'success') DisplayIcon = Check
              if (stepStatus === 'error') DisplayIcon = X
              
              return (
                <div 
                  key={step} 
                  className={`flex flex-col items-center ${
                    clickable || isReadyToGenerate ? 'cursor-pointer group' : 'cursor-default'
                  }`}
                  onClick={() => {
                    if (isReadyToGenerate) {
                      handleGenerate()
                    } else if (clickable) {
                      handleStepClick(step)
                    }
                  }}
                >
                  <div className={`flex items-center justify-center w-8 h-8 rounded-full border-2 mb-2 transition-all duration-200 ${
                    stepStatus === 'success' 
                      ? 'bg-green-500 border-green-500 text-white' 
                      : stepStatus === 'error'
                        ? 'bg-red-500 border-red-500 text-white'
                        : stepStatus === 'loading'
                          ? 'bg-blue-500 border-blue-500 text-white animate-spin'
                          : currentStep === step 
                            ? 'border-primary text-primary bg-background'
                            : isReadyToGenerate
                              ? 'bg-blue-400 border-blue-400 text-white shadow-lg animate-pulse-slow'
                              : 'border-muted-foreground text-muted-foreground bg-background'
                  } ${
                    (clickable || isReadyToGenerate) ? 'group-hover:scale-110' : ''
                  } ${
                    isReadyToGenerate ? 'ring-2 ring-blue-200' : ''
                  }`}>
                    <DisplayIcon className="w-4 h-4" />
                  </div>
                  <p className={`text-xs font-medium ${
                    stepStatus === 'success' ? 'text-green-400' 
                      : stepStatus === 'error' ? 'text-red-400'
                        : currentStep >= step ? 'text-foreground' : 'text-muted-foreground'
                  } ${
                    isReadyToGenerate ? 'text-blue-400 font-bold' : ''
                  } ${
                    (clickable || isReadyToGenerate) ? 'group-hover:text-primary' : ''
                  }`}>{isReadyToGenerate ? 'Generate!' : label}</p>
                </div>
              )
            })}
          </div>
        </div>

        {/* Step Content */}
        <div className="flex-1 flex flex-col justify-start">
          {/* Step 1: API Key */}
            <div className={currentStep === 1 ? 'block' : 'hidden'}>
              <ComponentErrorBoundary name="ApiKeyInput">
                <ApiKeyInput
                  onApiKeyValidated={handleApiKeyValidated}
                  onLoadingChange={(loading) => setApiKeyStatus(loading ? 'loading' : null)}
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
                  onLoadingChange={(loading) => setModelLoadStatus(loading ? 'loading' : null)}
                  onError={() => setModelLoadStatus('error')}
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
            </div>
          )}

          {/* Step 4: Generation/Results */}
          {currentStep === 4 && (
            <div className="flex-1 flex gap-4 min-h-0">
              {/* Left Panel: Workflow Progress & Export */}
              <div className="w-80 flex-shrink-0 space-y-4">
                <Card className="h-fit">
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2 text-base">
                      <Play className="h-4 w-4" />
                      Generation Progress
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ComponentErrorBoundary name="WorkflowProgress">
                      <WorkflowProgress workflowState={workflowState} />
                    </ComponentErrorBoundary>
                  </CardContent>
                </Card>

                <Card className="h-fit">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">Export Options</CardTitle>
                    <CardDescription className="text-xs">
                      Download your generated specification
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Button onClick={() => setShowExportDialog(true)} variant="outline" size="sm" className="w-full">
                      <Download className="h-4 w-4 mr-2" />
                      Export Specification
                    </Button>
                  </CardContent>
                </Card>
              </div>

              {/* Right Panel: Content Preview */}
              <Card className="flex-1 min-w-0">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">
                    {workflowState.currentPhase.charAt(0).toUpperCase() + workflowState.currentPhase.slice(1)} Preview
                  </CardTitle>
                </CardHeader>
                <CardContent className="h-[calc(100vh-320px)]">
                  <div className="h-full overflow-auto">
                    <ComponentErrorBoundary name="MarkdownPreview">
                      <MarkdownPreview
                        content={workflowState.phaseContent[workflowState.currentPhase] || '# Generating content...\n\nYour specification is being created. This will appear here once generation begins.'}
                        title=""
                        showDiagrams={true}
                        showStats={true}
                      />
                    </ComponentErrorBoundary>
                  </div>
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

      {/* Continue/Start Over Dialog */}
      <Dialog open={showContinueDialog} onOpenChange={setShowContinueDialog}>
        <DialogContent className="bg-card border-border">
          <DialogHeader>
            <DialogTitle className="text-foreground">Welcome back!</DialogTitle>
            <DialogDescription className="text-muted-foreground">
              We found some saved information from your previous session:
              <div className="mt-3 space-y-1">
                {hasApiKey && <div className="text-green-400 text-sm flex items-center gap-2">✓ API Key saved and validated</div>}
                {selectedModel && <div className="text-green-400 text-sm flex items-center gap-2">✓ AI Model: {selectedModel.name}</div>}
                {prompt.trim() && <div className="text-green-400 text-sm flex items-center gap-2">✓ Prompt saved ({prompt.length} characters)</div>}
                {contextFiles.length > 0 && <div className="text-green-400 text-sm flex items-center gap-2">✓ Context files: {contextFiles.length} file{contextFiles.length !== 1 ? 's' : ''}</div>}
              </div>
              <div className="mt-3 text-sm">
                <strong>Continue</strong> will restore all your saved data, or <strong>Reset & Start Fresh</strong> will clear everything and begin anew.
              </div>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button 
              variant="outline" 
              onClick={handleResetAndStartFresh}
              className="border-border text-foreground hover:bg-muted"
            >
              Reset & Start Fresh
            </Button>
            <Button 
              onClick={handleContinue}
              className="bg-primary hover:bg-primary/80 text-primary-foreground"
            >
              Continue Where I Left Off
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

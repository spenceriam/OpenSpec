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
import { FileText, Download, Play, Key, Brain, MessageSquare, Check, X, AlertCircle, CheckCircle, Layers, List } from 'lucide-react'
import { useModelStorage, usePromptStorage, useContextFilesStorage } from '@/hooks/useSessionStorage'
import { useSimpleApiKeyStorage } from '@/hooks/useSimpleApiKeyStorage'
import { useSpecWorkflow } from '@/hooks/useSpecWorkflow'
import { DotPattern } from '@/components/magicui/dot-pattern'

export default function Home() {
  const { value: apiKey, hasValidKey, setAPIKey, clearAPIKey } = useSimpleApiKeyStorage()
  
  const { selectedModel, setModel, clearModel } = useModelStorage()
  const { prompt, setPrompt, clearPrompt } = usePromptStorage()
  const { contextFiles, setFiles: setContextFiles, clearFiles: clearContextFiles } = useContextFilesStorage()
  
  // Initialize the actual spec workflow
  const workflow = useSpecWorkflow({
    selectedModel,
  })
  const [currentStep, setCurrentStep] = useState(1)
  const [showExportDialog, setShowExportDialog] = useState(false)
  const [showContinueDialog, setShowContinueDialog] = useState(false)
  const [hasCheckedSession, setHasCheckedSession] = useState(false)
  const [apiKeyStatus, setApiKeyStatus] = useState<'loading' | 'success' | 'error' | null>(null)
  const [modelLoadStatus, setModelLoadStatus] = useState<'loading' | 'success' | 'error' | null>(null)
  const [forceUpdate, setForceUpdate] = useState(0)
  const [isRegenerating, setIsRegenerating] = useState(false)
  const [lastGenerationTime, setLastGenerationTime] = useState<number>(0)
  const [showRegenerateConfirm, setShowRegenerateConfirm] = useState(false)

  const hasApiKey = Boolean(apiKey && hasValidKey)
  const hasModel = Boolean(selectedModel)
  const hasPrompt = prompt.trim().length > 10
  const canStartGeneration = hasApiKey && hasModel && hasPrompt
  
  


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
      // Force component re-render after small delay to ensure storage hook updates
      setTimeout(() => {
        setForceUpdate(prev => prev + 1)
      }, 200)
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
    workflow.resetWorkflow()
    
  }

  const handleContinue = () => {
    setShowContinueDialog(false)
    setHasCheckedSession(true) // Mark as checked so dialog won't show again
    // Step is already set correctly in useEffect
  }

  const handleBackToPrompt = () => {
    // If generation has been used at least once, just go back and allow regeneration
    if (lastGenerationTime > 0) {
      setCurrentStep(3)
      setIsRegenerating(true)
      return
    }
    
    // Check if there's existing content that would be lost
    const hasExistingContent = workflow.phaseContent.requirements || 
                              workflow.phaseContent.design || 
                              workflow.phaseContent.tasks
    
    if (hasExistingContent) {
      setShowRegenerateConfirm(true)
    } else {
      // No content to lose, go back directly
      setCurrentStep(3)
      setIsRegenerating(false)
    }
  }

  const handleConfirmRegenerate = () => {
    // Clear existing workflow content
    workflow.resetWorkflow()
    setCurrentStep(3)
    setIsRegenerating(true)
    setShowRegenerateConfirm(false)
  }

  const handleCancelRegenerate = () => {
    setShowRegenerateConfirm(false)
  }

  const handleGenerate = async () => {
    console.log('=== HANDLE GENERATE DEBUG ===', {
      prompt: prompt || 'EMPTY',
      promptLength: prompt.length,
      contextFiles: contextFiles.length,
      contextFileNames: contextFiles.map(f => f.name),
      hasApiKey: !!apiKey,
      hasModel: !!selectedModel
    })
    
    // Gentle rate limiting: prevent rapid double-clicks (minimum 2 seconds between generations)
    const now = Date.now()
    const timeSinceLastGeneration = now - lastGenerationTime
    const minInterval = 2000 // 2 seconds
    
    if (timeSinceLastGeneration < minInterval && lastGenerationTime > 0) {
      return // Silently prevent rapid generation requests
    }
    
    setLastGenerationTime(now)
    setCurrentStep(4)
    
    // Extract feature name from prompt (first line or use default)
    const promptLines = prompt.trim().split('\n')
    const featureName = promptLines[0]?.replace(/^#+\s*/, '').trim() || 'Technical Specification'
    
    // FUNDAMENTAL FIX: Pass data directly to generation instead of relying on async state
    console.log('=== DIRECT GENERATION APPROACH ===', {
      featureName,
      promptLength: prompt.length,
      contextFilesCount: contextFiles.length
    })
    
    // Filter to text files only for generation context
    const textFiles = contextFiles.filter(file => 
      !file.type?.startsWith('image/') && 
      file.type !== 'image/png' && 
      file.type !== 'image/jpeg'
    )
    
    console.log('Filtered to text files for AI context:', {
      originalFiles: contextFiles.length,
      textFiles: textFiles.length,
      filteredImages: contextFiles.length - textFiles.length
    })
    
    const workflowContextFiles = textFiles.map(file => ({
      id: file.id,
      name: file.name,
      type: file.type as any,
      content: file.content,
      size: file.size,
      lastModified: file.lastModified || Date.now(),
      mimeType: file.mimeType || 'text/plain'
    }))
    
    // Start generation for the requirements phase with direct data
    try {
      await workflow.generateWithData(featureName, prompt, workflowContextFiles)
    } catch (error) {
      // Error handling is managed by the workflow hook
    }
  }

  const handleExport = (options: any) => {
    setShowExportDialog(false)
  }

  // Handle step navigation - allow going back to previous steps
  const handleStepClick = (step: number) => {
    // Special handling for going back to Prompt from Generation step
    if (currentStep === 4 && step === 3) {
      handleBackToPrompt()
      return
    }
    
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
              {isRegenerating && (
                <div className="mb-4 p-3 bg-primary/10 border border-primary/20 rounded-lg">
                  <div className="flex items-center gap-2 text-primary">
                    <MessageSquare className="h-4 w-4" />
                    <span className="text-sm font-medium">Regeneration Mode</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Edit your prompt or files below, then click Generate to create a new specification.
                  </p>
                </div>
              )}
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

          {/* Step 4: Generation/Results with Approval Workflow */}
          {currentStep === 4 && (
            <div className="flex-1 flex flex-col gap-4 min-h-0">
              {/* Top Panel: Current Phase Status */}
              <Card className="h-fit">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center justify-between text-base">
                    <div className="flex items-center gap-2">
                      <Play className="h-4 w-4" />
                      {workflow.currentPhase === 'requirements' && 'Requirements Generation'}
                      {workflow.currentPhase === 'design' && 'Design Generation'}
                      {workflow.currentPhase === 'tasks' && 'Tasks Generation'}
                      {workflow.currentPhase === 'complete' && 'Workflow Complete'}
                    </div>
                    <div className="flex items-center gap-2">
                      {/* Phase-specific action buttons */}
                      {workflow.currentPhase !== 'complete' && (
                        <>
                          <Button 
                            onClick={() => {
                              workflow.clearError()
                              // Generate based on current phase
                              if (workflow.currentPhase === 'requirements') {
                                const promptLines = prompt.trim().split('\n')
                                const featureName = promptLines[0]?.replace(/^#+\s*/, '').trim() || 'Technical Specification'
                                const textFiles = contextFiles.filter(file => 
                                  !file.type?.startsWith('image/') && 
                                  file.type !== 'image/png' && 
                                  file.type !== 'image/jpeg'
                                )
                                const workflowContextFiles = textFiles.map(file => ({
                                  id: file.id,
                                  name: file.name,
                                  type: file.type as any,
                                  content: file.content,
                                  size: file.size,
                                  lastModified: file.lastModified || Date.now(),
                                  mimeType: file.mimeType || 'text/plain'
                                }))
                                workflow.generateWithData(featureName, prompt, workflowContextFiles)
                              } else {
                                // For design and tasks phases, use empty data since content comes from previous phases
                                workflow.generateWithData('', '', [])
                              }
                            }} 
                            variant="default" 
                            size="sm"
                            disabled={workflow.isGenerating}
                          >
                            <Play className="h-4 w-4 mr-2" />
                            {workflow.isGenerating ? 'Generating...' : `Generate ${workflow.currentPhase.charAt(0).toUpperCase() + workflow.currentPhase.slice(1)}`}
                          </Button>
                          
                          <Button 
                            onClick={handleBackToPrompt} 
                            variant="outline" 
                            size="sm"
                            disabled={workflow.isGenerating}
                          >
                            <MessageSquare className="h-4 w-4 mr-2" />
                            Edit Prompt
                          </Button>
                        </>
                      )}
                    </div>
                  </CardTitle>
                </CardHeader>
                
                {/* Current Phase Content & Approval */}
                <CardContent>
                  {workflow.error && (
                    <div className="mb-4 p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
                      <div className="flex items-center gap-2 text-destructive mb-2">
                        <AlertCircle className="h-4 w-4" />
                        <span className="text-sm font-medium">Generation Error</span>
                      </div>
                      <p className="text-sm text-muted-foreground">{workflow.error}</p>
                    </div>
                  )}
                  
                  {/* Phase content display with approval controls */}
                  {workflow.currentPhase === 'requirements' && (
                    <div className="space-y-4">
                      {workflow.state.requirements ? (
                        <>
                          <div className="prose prose-sm max-w-none">
                            <div className="bg-muted/50 p-4 rounded-lg">
                              <h4 className="font-semibold mb-2">Generated Requirements:</h4>
                              <div className="whitespace-pre-wrap text-sm">{workflow.state.requirements}</div>
                            </div>
                          </div>
                          
                          {/* Approval Controls */}
                          <div className="border-t pt-4">
                            <div className="flex items-center justify-between">
                              <div>
                                <h4 className="font-semibold">Review Requirements</h4>
                                <p className="text-sm text-muted-foreground">Approve to proceed to Design phase</p>
                              </div>
                              <div className="flex items-center gap-2">
                                <Button
                                  variant="outline"
                                  onClick={() => {
                                    workflow.rejectCurrentPhase()
                                  }}
                                >
                                  Reject & Regenerate
                                </Button>
                                <Button
                                  onClick={() => {
                                    workflow.approveCurrentPhase()
                                    // Auto-progress to next phase
                                    if (workflow.nextPhase) {
                                      workflow.proceedToNextPhase()
                                    }
                                  }}
                                >
                                  Approve & Continue to Design
                                </Button>
                              </div>
                            </div>
                          </div>
                        </>
                      ) : (
                        <div className="text-center py-8 text-muted-foreground">
                          <FileText className="h-8 w-8 mx-auto mb-2" />
                          <div>No requirements generated yet</div>
                          <div className="text-xs mt-1">Click Generate Requirements to start</div>
                        </div>
                      )}
                    </div>
                  )}
                  
                  {/* Similar blocks for Design and Tasks phases... */}
                  {workflow.currentPhase === 'design' && (
                    <div className="space-y-4">
                      {workflow.state.design ? (
                        <>
                          <div className="prose prose-sm max-w-none">
                            <div className="bg-muted/50 p-4 rounded-lg">
                              <h4 className="font-semibold mb-2">Generated Design:</h4>
                              <div className="whitespace-pre-wrap text-sm">{workflow.state.design}</div>
                            </div>
                          </div>
                          
                          <div className="border-t pt-4">
                            <div className="flex items-center justify-between">
                              <div>
                                <h4 className="font-semibold">Review Design</h4>
                                <p className="text-sm text-muted-foreground">Approve to proceed to Tasks phase</p>
                              </div>
                              <div className="flex items-center gap-2">
                                <Button
                                  variant="outline"
                                  onClick={() => workflow.rejectCurrentPhase()}
                                >
                                  Reject & Regenerate
                                </Button>
                                <Button
                                  onClick={() => {
                                    workflow.approveCurrentPhase()
                                    if (workflow.nextPhase) {
                                      workflow.proceedToNextPhase()
                                    }
                                  }}
                                >
                                  Approve & Continue to Tasks
                                </Button>
                              </div>
                            </div>
                          </div>
                        </>
                      ) : (
                        <div className="text-center py-8 text-muted-foreground">
                          <Layers className="h-8 w-8 mx-auto mb-2" />
                          <div>No design generated yet</div>
                          <div className="text-xs mt-1">Click Generate Design to start</div>
                        </div>
                      )}
                    </div>
                  )}
                  
                  {workflow.currentPhase === 'tasks' && (
                    <div className="space-y-4">
                      {workflow.state.tasks ? (
                        <>
                          <div className="prose prose-sm max-w-none">
                            <div className="bg-muted/50 p-4 rounded-lg">
                              <h4 className="font-semibold mb-2">Generated Tasks:</h4>
                              <div className="whitespace-pre-wrap text-sm">{workflow.state.tasks}</div>
                            </div>
                          </div>
                          
                          <div className="border-t pt-4">
                            <div className="flex items-center justify-between">
                              <div>
                                <h4 className="font-semibold">Review Tasks</h4>
                                <p className="text-sm text-muted-foreground">Approve to complete the workflow</p>
                              </div>
                              <div className="flex items-center gap-2">
                                <Button
                                  variant="outline"
                                  onClick={() => workflow.rejectCurrentPhase()}
                                >
                                  Reject & Regenerate
                                </Button>
                                <Button
                                  onClick={() => {
                                    workflow.approveCurrentPhase()
                                    workflow.proceedToNextPhase() // Complete workflow
                                  }}
                                >
                                  Approve & Complete
                                </Button>
                              </div>
                            </div>
                          </div>
                        </>
                      ) : (
                        <div className="text-center py-8 text-muted-foreground">
                          <List className="h-8 w-8 mx-auto mb-2" />
                          <div>No tasks generated yet</div>
                          <div className="text-xs mt-1">Click Generate Tasks to start</div>
                        </div>
                      )}
                    </div>
                  )}
                  
                  {workflow.currentPhase === 'complete' && (
                    <div className="text-center py-8">
                      <CheckCircle className="h-12 w-12 mx-auto mb-4 text-green-600" />
                      <h3 className="text-lg font-semibold mb-2">Workflow Complete!</h3>
                      <p className="text-muted-foreground mb-4">All phases have been generated and approved</p>
                      <Button onClick={() => setShowExportDialog(true)}>
                        Export Specifications
                      </Button>
                    </div>
                  )}
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
        workflowState={{
          currentPhase: workflow.currentPhase,
          phaseContent: workflow.phaseContent,
          approvals: {
            requirements: workflow.approvals.requirements,
            design: workflow.approvals.design,
            tasks: workflow.approvals.tasks
          },
          isGenerating: workflow.isGenerating,
          lastUpdated: new Date().toISOString()
        }}
        onExport={handleExport}
      />

      {/* Regenerate Confirmation Dialog */}
      <Dialog open={showRegenerateConfirm} onOpenChange={setShowRegenerateConfirm}>
        <DialogContent className="bg-card border-border">
          <DialogHeader>
            <DialogTitle className="text-foreground flex items-center gap-2">
              <MessageSquare className="h-5 w-5 text-primary" />
              Start Over?
            </DialogTitle>
            <DialogDescription className="text-muted-foreground">
              <div className="space-y-3">
                <p>This will clear your current specification and let you create a new one.</p>
                <p className="text-sm">
                  You'll be able to edit your prompt and files before generating again.
                </p>
              </div>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button 
              variant="outline" 
              onClick={handleCancelRegenerate}
              className="border-border text-foreground hover:bg-muted"
            >
              Cancel
            </Button>
            <Button 
              onClick={handleConfirmRegenerate}
              className="bg-primary hover:bg-primary/80 text-primary-foreground"
            >
              Yes, Start Over
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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

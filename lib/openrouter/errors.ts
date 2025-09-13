export class OpenRouterError extends Error {
  public status?: number
  public code?: string

  constructor(message: string, status?: number, code?: string) {
    super(message)
    this.name = 'OpenRouterError'
    this.status = status
    this.code = code
  }
}
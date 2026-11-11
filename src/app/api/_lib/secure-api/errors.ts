export class SecureApiError extends Error {
  status: number
  /** Optional full JSON body override, for routes whose existing error shape is richer than
   *  { success: false, message } (e.g. system-service's { code, message: string[], dataresponse }).
   *  Falls back to { success: false, message } when omitted. */
  body?: unknown

  constructor(message: string, status = 400, body?: unknown) {
    super(message)
    this.name = 'SecureApiError'
    this.status = status
    this.body = body
  }
}

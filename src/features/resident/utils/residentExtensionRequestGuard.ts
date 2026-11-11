/** Coordinates UI requests across record/project changes, including old finally blocks. */
export class ResidentExtensionRequestGuard {
    private revision = 0
    busy = false

    constructor(private context: string) {}

    setContext(context: string) {
        if (context === this.context) return
        this.context = context
        this.revision++
        this.busy = false
    }

    ticket() { return this.revision }
    isCurrent(ticket: number) { return ticket === this.revision }
    invalidate() { this.revision++ }

    beginMutation(): number | null {
        if (this.busy) return null
        this.busy = true

        return ++this.revision
    }

    finishMutation(ticket: number) {
        if (!this.isCurrent(ticket)) return false
        this.busy = false

        return true
    }
}

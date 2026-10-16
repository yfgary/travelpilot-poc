// Defense in depth: shared signed-out checklist logic never calls these transports.
export async function pullChecklist(): Promise<never> { throw new Error('Cloud checklist access is disabled in Preview') }
export async function pushChecklist(): Promise<never> { throw new Error('Cloud checklist access is disabled in Preview') }

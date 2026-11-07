export type Action = { name: 'pet' | 'wave' | 'dance' | 'sleep' | 'done'; start: number }

declare module 'claude-code' {
  interface PluginState {
    buddy: { tick: number; action: Action | null; lastActive: number }
  }
}

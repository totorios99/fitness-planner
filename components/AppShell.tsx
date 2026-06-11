import { TabBar } from './TabBar'

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="app-shell">
      {children}
      <TabBar />
    </div>
  )
}

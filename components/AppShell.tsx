import { TabBar } from './TabBar'
import { TopNav } from './TopNav'

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="app">
      <div className="wallpaper" />
      <TopNav />
      <main className="shell-main">{children}</main>
      <TabBar />
    </div>
  )
}

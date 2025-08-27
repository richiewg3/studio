
import { Cloud } from "lucide-react"
import { ThemeToggle } from "./theme-toggle"

export function Header() {
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 max-w-screen-2xl items-center justify-between">
        <h1 className="text-xl font-bold tracking-tight">Personal AI Workspace</h1>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Cloud className="h-5 w-5 text-green-500" />
            <span className="text-sm font-medium text-muted-foreground">Connected</span>
          </div>
          <ThemeToggle />
        </div>
      </div>
    </header>
  )
}

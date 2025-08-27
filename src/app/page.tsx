"use client"

import { useState } from "react"
import { PasscodeScreen } from "@/components/passcode-screen"
import { Workspace } from "@/components/workspace"
import { Header } from "@/components/header"

export default function Home() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)

  if (!isAuthenticated) {
    return <PasscodeScreen onSuccess={() => setIsAuthenticated(true)} />
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Header />
      <main className="flex-1">
        <Workspace />
      </main>
    </div>
  )
}

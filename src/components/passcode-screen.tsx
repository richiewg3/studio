
"use client"

import { useState, type FormEvent } from "react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Loader2 } from "lucide-react"

// For demo purposes, the passcode is hardcoded.
// In a real application, this should be handled via environment variables for security.
const CORRECT_PASSCODE = "1234"

interface PasscodeScreenProps {
  onSuccess: () => void
}

export function PasscodeScreen({ onSuccess }: PasscodeScreenProps) {
  const [passcode, setPasscode] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    setError("")
    setLoading(true)

    // Simulate an asynchronous check
    setTimeout(() => {
      if (passcode === CORRECT_PASSCODE) {
        onSuccess()
      } else {
        setError("Invalid passcode. Please try again.")
        setLoading(false)
        setPasscode("")
      }
    }, 500)
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle className="text-2xl">Personal AI Workspace</CardTitle>
          <CardDescription>
            Please enter your passcode to access your workspace.
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="passcode">Passcode</Label>
              <Input
                id="passcode"
                type="password"
                value={passcode}
                onChange={(e) => setPasscode(e.target.value)}
                required
                aria-describedby="passcode-error"
              />
            </div>
            {error && <p id="passcode-error" className="text-sm text-destructive">{error}</p>}
          </CardContent>
          <CardFooter>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Unlock Workspace
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}

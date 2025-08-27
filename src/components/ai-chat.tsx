"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { useToast } from "@/hooks/use-toast"
import { Bot, Loader2, Send, Sparkles, User } from "lucide-react"
import { chatWithDocument } from "@/ai/flows/chat-with-document"

interface AiChatProps {
  documentContent: string
  onApplyChanges: (newContent: string) => void
  disabled?: boolean
}

interface ChatMessage {
  role: "user" | "bot"
  content: string
}

export function AiChat({ documentContent, onApplyChanges, disabled }: AiChatProps) {
  const { toast } = useToast()
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState("")
  const [isProcessing, setIsProcessing] = useState(false)
  const [suggestion, setSuggestion] = useState<string | null>(null)

  const handleSend = async () => {
    if (!input.trim() || disabled) return
    
    const newUserMessage: ChatMessage = { role: "user", content: input }
    const newMessages = [...messages, newUserMessage]
    setMessages(newMessages)
    setInput("")
    setIsProcessing(true)
    setSuggestion(null)
    
    try {
      const result = await chatWithDocument({
        document: documentContent,
        instruction: input,
        chatHistory: newMessages.slice(0, -1).map(m => `${m.role}: ${m.content}`).join('\n')
      })

      const botResponse: ChatMessage = { role: "bot", content: result.reply }
      setMessages(prev => [...prev, botResponse])
      setSuggestion(result.rewrittenDocument)
      
    } catch (error) {
      console.error("AI Chat Error:", error)
      toast({ variant: "destructive", title: "Error", description: "The AI failed to respond." })
      const errorResponse: ChatMessage = { role: "bot", content: "Sorry, I encountered an error." }
      setMessages(prev => [...prev, errorResponse])
    } finally {
      setIsProcessing(false)
    }
  }

  const handleApply = () => {
    if (suggestion) {
      onApplyChanges(suggestion)
      toast({ title: "Success", description: "Changes applied to the document."})
      setSuggestion(null)
      setMessages([]) // Clear chat after applying
    }
  }

  return (
    <Card className="flex flex-col h-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><Sparkles /> AI Chat</CardTitle>
        <CardDescription>Chat with the AI to refine your document.</CardDescription>
      </CardHeader>
      <CardContent className="flex-grow flex flex-col gap-4">
        <ScrollArea className="h-[250px] w-full pr-4">
          <div className="space-y-4">
            {messages.map((message, index) => (
              <div key={index} className={`flex items-start gap-3 ${message.role === 'user' ? 'justify-end' : ''}`}>
                {message.role === 'bot' && <Bot className="flex-shrink-0" />}
                <div className={`rounded-lg px-3 py-2 ${message.role === 'user' ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
                  <p className="text-sm">{message.content}</p>
                </div>
                {message.role === 'user' && <User className="flex-shrink-0" />}
              </div>
            ))}
            {isProcessing && (
              <div className="flex items-center gap-3">
                <Bot className="flex-shrink-0" />
                <div className="rounded-lg px-3 py-2 bg-muted flex items-center">
                  <Loader2 className="h-4 w-4 animate-spin" />
                </div>
              </div>
            )}
          </div>
        </ScrollArea>
        {suggestion && (
          <div className="p-2 border rounded-lg bg-amber-50 dark:bg-amber-950">
            <p className="text-sm font-medium mb-2">Suggestion:</p>
            <ScrollArea className="h-20">
              <p className="text-xs p-1">{suggestion}</p>
            </ScrollArea>
            <div className="flex justify-end gap-2 mt-2">
                <Button variant="ghost" size="sm" onClick={() => setSuggestion(null)}>Discard</Button>
                <Button size="sm" onClick={handleApply}>Apply</Button>
            </div>
          </div>
        )}
      </CardContent>
      <CardFooter>
        <div className="flex w-full items-center space-x-2">
            <Input 
                id="ai-chat-input" 
                placeholder="e.g., Make this more concise" 
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSend()}
                disabled={isProcessing || disabled}
            />
            <Button onClick={handleSend} disabled={isProcessing || disabled || !input.trim()}>
                <Send className="h-4 w-4" />
            </Button>
        </div>
      </CardFooter>
    </Card>
  )
}

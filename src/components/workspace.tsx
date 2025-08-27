"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/hooks/use-toast"
import { BrainCircuit, FileText, Loader2, Sparkles, Table as TableIcon, Wand2 } from "lucide-react"
import { correctGrammar } from "@/ai/flows/correct-grammar"
import { rewriteDocument } from "@/ai/flows/rewrite-document"
import { manipulateData } from "@/ai/flows/data-manipulation"
import { createFormula } from "@/ai/flows/create-formula"

const initialDocumentContent = `Welcome to your Personal AI Workspace. This is a text document editor. You can write notes, draft articles, or brainstorm ideas here. Use the AI tools below to enhance your writing.`

const initialSpreadsheetData: Record<string, string | number>[] = [
  { "id": 1, "Product": "Laptop", "Quantity": 12, "Price": 1200 },
  { "id": 2, "Product": "Mouse", "Quantity": 75, "Price": 25 },
  { "id": 3, "Product": "Keyboard", "Quantity": 30, "Price": 75 },
  { "id": 4, "Product": "Monitor", "Quantity": 20, "Price": 300 },
  { "id": 5, "Product": "Webcam", "Quantity": 50, "Price": 50 },
];

// CSV Helper Functions
const toCSV = (data: Record<string, any>[]): string => {
  if (!data.length) return ""
  const headers = Object.keys(data[0])
  const csvRows = [
    headers.join(','),
    ...data.map(row => headers.map(header => JSON.stringify(row[header])).join(','))
  ]
  return csvRows.join('\n')
};

const fromCSV = (csv: string): Record<string, string>[] => {
  const lines = csv.split('\n')
  if (lines.length < 2) return []
  const headers = lines[0].split(',').map(h => h.trim())
  return lines.slice(1).map(line => {
    const values = line.split(',')
    return headers.reduce((obj, header, index) => {
      obj[header] = values[index] ? JSON.parse(values[index]) : ""
      return obj
    }, {} as Record<string, string>)
  })
};

export function Workspace() {
  const { toast } = useToast()
  const [docContent, setDocContent] = useState(initialDocumentContent)
  const [spreadsheetData, setSpreadsheetData] = useState(initialSpreadsheetData)
  const [isProcessing, setIsProcessing] = useState(false)
  const [rewriteInstruction, setRewriteInstruction] = useState("")
  const [manipulateInstruction, setManipulateInstruction] = useState("")
  const [formulaDescription, setFormulaDescription] = useState("")
  const [generatedFormula, setGeneratedFormula] = useState("")
  const [isRewriteDialogOpen, setRewriteDialogOpen] = useState(false)

  const handleCorrectGrammar = async () => {
    setIsProcessing(true)
    toast({ title: "AI is thinking...", description: "Correcting grammar." })
    try {
      const result = await correctGrammar({ text: docContent })
      setDocContent(result.correctedText)
      toast({ title: "Success", description: "Grammar corrected successfully." })
    } catch (error) {
      toast({ variant: "destructive", title: "Error", description: "Failed to correct grammar." })
    } finally {
      setIsProcessing(false)
    }
  }

  const handleRewrite = async () => {
    if (!rewriteInstruction) {
      toast({ variant: "destructive", title: "Error", description: "Please provide rewrite instructions." })
      return
    }
    setIsProcessing(true)
    setRewriteDialogOpen(false)
    toast({ title: "AI is thinking...", description: "Rewriting text." })
    try {
      const result = await rewriteDocument({ selectedText: docContent, instructions: rewriteInstruction })
      setDocContent(result.rewrittenText)
      setRewriteInstruction("")
      toast({ title: "Success", description: "Text rewritten successfully." })
    } catch (error) {
      toast({ variant: "destructive", title: "Error", description: "Failed to rewrite text." })
    } finally {
      setIsProcessing(false)
    }
  }

  const handleManipulateData = async () => {
    if (!manipulateInstruction) {
        toast({ variant: "destructive", title: "Error", description: "Please provide data manipulation instructions." })
        return
    }
    setIsProcessing(true)
    toast({ title: "AI is thinking...", description: "Manipulating data." })
    try {
      const csvData = toCSV(spreadsheetData)
      const result = await manipulateData({ spreadsheetData: csvData, selectedRange: "A1:D6", instruction: manipulateInstruction })
      setSpreadsheetData(fromCSV(result.manipulatedData))
      toast({ title: "Success", description: "Data manipulated successfully." })
    } catch (error) {
        console.error(error)
      toast({ variant: "destructive", title: "Error", description: "Failed to manipulate data." })
    } finally {
      setIsProcessing(false)
    }
  }

  const handleCreateFormula = async () => {
    if (!formulaDescription) {
        toast({ variant: "destructive", title: "Error", description: "Please provide a formula description." })
        return
    }
    setIsProcessing(true)
    toast({ title: "AI is thinking...", description: "Creating formula." })
    try {
      const headers = spreadsheetData.length > 0 ? Object.keys(spreadsheetData[0]) : []
      const result = await createFormula({ description: formulaDescription, columnNames: headers })
      setGeneratedFormula(result.formula)
      toast({ title: "Success", description: "Formula created successfully." })
    } catch (error) {
      toast({ variant: "destructive", title: "Error", description: "Failed to create formula." })
    } finally {
      setIsProcessing(false)
    }
  }

  const spreadsheetHeaders = spreadsheetData.length > 0 ? Object.keys(spreadsheetData[0]) : []

  return (
    <div className="container mx-auto max-w-7xl px-4 py-8">
      <Tabs defaultValue="document" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="document"><FileText className="mr-2" />Document</TabsTrigger>
          <TabsTrigger value="spreadsheet"><TableIcon className="mr-2" />Spreadsheet</TabsTrigger>
        </TabsList>
        
        <TabsContent value="document" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Document Editor</CardTitle>
              <CardDescription>Edit your text document. Use the AI tools below to enhance your writing.</CardDescription>
            </CardHeader>
            <CardContent>
              <Textarea
                value={docContent}
                onChange={(e) => setDocContent(e.target.value)}
                rows={15}
                className="resize-y"
                placeholder="Start writing..."
              />
            </CardContent>
            <CardFooter className="flex-wrap gap-2">
              <Button onClick={handleCorrectGrammar} disabled={isProcessing}>
                {isProcessing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2" />}
                Correct Grammar
              </Button>
              <Dialog open={isRewriteDialogOpen} onOpenChange={setRewriteDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" disabled={isProcessing}>
                    <Wand2 className="mr-2" />
                    Rewrite
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Rewrite Text</DialogTitle>
                    <DialogDescription>
                      Enter instructions for the AI to rewrite the document content. For example, "make it more professional" or "summarize it in three bullet points".
                    </DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <Label htmlFor="rewrite-instruction">Instructions</Label>
                    <Input id="rewrite-instruction" value={rewriteInstruction} onChange={(e) => setRewriteInstruction(e.target.value)} />
                  </div>
                  <DialogFooter>
                    <Button onClick={handleRewrite} disabled={isProcessing}>
                        {isProcessing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Wand2 className="mr-2" />}
                        Rewrite
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </CardFooter>
          </Card>
        </TabsContent>
        
        <TabsContent value="spreadsheet" className="mt-4">
          <div className="grid gap-6 lg:grid-cols-5">
            <div className="lg:col-span-3">
              <Card>
                <CardHeader>
                  <CardTitle>Spreadsheet</CardTitle>
                  <CardDescription>Here's your data. Use the AI tools to analyze and manage it.</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="relative w-full overflow-auto rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          {spreadsheetHeaders.map(header => <TableHead key={header}>{header}</TableHead>)}
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {spreadsheetData.map((row, rowIndex) => (
                          <TableRow key={rowIndex}>
                            {spreadsheetHeaders.map(header => <TableCell key={header}>{String(row[header])}</TableCell>)}
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            </div>
            <div className="lg:col-span-2 flex flex-col gap-6">
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2"><BrainCircuit /> Manipulate Data</CardTitle>
                        <CardDescription>Use natural language to modify your data.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="grid gap-2">
                           <Label htmlFor="manipulate-instruction">Instruction</Label>
                           <Input id="manipulate-instruction" placeholder="e.g., sort by price descending" value={manipulateInstruction} onChange={e => setManipulateInstruction(e.target.value)} />
                        </div>
                    </CardContent>
                    <CardFooter>
                        <Button onClick={handleManipulateData} disabled={isProcessing} className="w-full">
                            {isProcessing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2" />}
                            Apply Manipulation
                        </Button>
                    </CardFooter>
                </Card>
                 <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2"><Wand2 />Create Formula</CardTitle>
                        <CardDescription>Describe a calculation to generate a formula.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="grid gap-2">
                           <Label htmlFor="formula-description">Description</Label>
                           <Input id="formula-description" placeholder="e.g., sum of all prices" value={formulaDescription} onChange={e => setFormulaDescription(e.target.value)} />
                           {generatedFormula && (
                            <div className="mt-2 rounded-md bg-muted p-3">
                                <p className="text-sm font-semibold">Generated Formula:</p>
                                <code className="text-sm font-mono text-primary">{generatedFormula}</code>
                            </div>
                           )}
                        </div>
                    </CardContent>
                    <CardFooter>
                        <Button onClick={handleCreateFormula} disabled={isProcessing} className="w-full">
                            {isProcessing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2" />}
                            Generate Formula
                        </Button>
                    </CardFooter>
                </Card>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}

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
import { BrainCircuit, Download, FileText, Loader2, Save, Sparkles, Table as TableIcon, Wand2 } from "lucide-react"
import { correctGrammar } from "@/ai/flows/correct-grammar"
import { rewriteDocument } from "@/ai/flows/rewrite-document"
import { manipulateData } from "@/ai/flows/data-manipulation"
import { AiChat } from "./ai-chat"
import { FileList } from "./file-list"

const initialFiles = {
  "document-1.md": `Welcome to your Personal AI Workspace. This is a text document editor. You can write notes, draft articles, or brainstorm ideas here. Use the AI tools below to enhance your writing.`,
  "spreadsheet-1.csv": `id,Product,Quantity,Price
1,"Laptop",12,1200
2,"Mouse",75,25
3,"Keyboard",30,75
4,"Monitor",20,300
5,"Webcam",50,50`,
};

// CSV Helper Functions
const toCSV = (data: Record<string, any>[]): string => {
  if (!data.length) return ""
  const headers = Object.keys(data[0])
  const csvRows = [
    headers.join(','),
    ...data.map(row => headers.map(header => {
      const value = row[header];
      if (typeof value === 'string' && (value.includes(',') || value.includes('"') || value.includes('\n'))) {
        return `"${value.replace(/"/g, '""')}"`;
      }
      return value;
    }).join(','))
  ]
  return csvRows.join('\n')
};

const fromCSV = (csv: string): Record<string, any>[] => {
  const lines = csv.split('\n').filter(line => line.trim() !== '');
  if (lines.length < 2) return [];
  const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
  return lines.slice(1).map(line => {
    const values = line.match(/(".*?"|[^",]+)(?=\s*,|\s*$)/g) || line.split(',');
    return headers.reduce((obj, header, index) => {
      const value = values[index] ? values[index].trim().replace(/"/g, '') : "";
      obj[header] = isNaN(Number(value)) || value === "" ? value : Number(value);
      return obj;
    }, {} as Record<string, any>);
  });
};


export function Workspace() {
  const { toast } = useToast()
  const [files, setFiles] = useState(initialFiles)
  const [savedFiles, setSavedFiles] = useState(initialFiles);
  const [activeFile, setActiveFile] = useState<string | null>("document-1.md")
  
  const activeContent = activeFile ? files[activeFile] : "";
  const isDocument = activeFile?.endsWith('.md');
  const isSpreadsheet = activeFile?.endsWith('.csv');
  const spreadsheetData = isSpreadsheet ? fromCSV(activeContent) : [];

  const [isProcessing, setIsProcessing] = useState(false)
  const [rewriteInstruction, setRewriteInstruction] = useState("")
  const [manipulateInstruction, setManipulateInstruction] = useState("")
  const [isRewriteDialogOpen, setRewriteDialogOpen] = useState(false)

  const updateActiveContent = (newContent: string) => {
    if (activeFile) {
      setFiles(prevFiles => ({
        ...prevFiles,
        [activeFile]: newContent
      }));
    }
  };

  const handleSave = () => {
    setSavedFiles(files);
    toast({ title: "Saved!", description: "Your files have been saved." });
  };
  
  const handleExport = () => {
    if (!activeFile || !activeContent) return;

    const blob = new Blob([activeContent], { type: isDocument ? 'text/markdown' : 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = activeFile;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast({ title: "Exported!", description: `${activeFile} has been downloaded.` });
  };

  const handleSpreadsheetCellChange = (rowIndex: number, header: string, value: string | number) => {
    if (activeFile && isSpreadsheet) {
      const newData = [...spreadsheetData];
      newData[rowIndex] = { ...newData[rowIndex], [header]: value };
      updateActiveContent(toCSV(newData));
    }
  };

  const handleHeaderChange = (oldHeader: string, newHeader: string) => {
    if (!isSpreadsheet || !newHeader || oldHeader === newHeader) return;

    const newData = spreadsheetData.map(row => {
      const newRow = { ...row };
      // Create a new object with the new key
      const updatedRow: Record<string, any> = {};
      Object.keys(newRow).forEach(key => {
        if (key === oldHeader) {
          updatedRow[newHeader] = newRow[key];
        } else {
          updatedRow[key] = newRow[key];
        }
      });
      return updatedRow;
    });

    // Reorder headers to keep consistency
    const oldHeaders = spreadsheetHeaders;
    const newHeaders = oldHeaders.map(h => h === oldHeader ? newHeader : h);
    const reorderedData = newData.map(row => {
        const reorderedRow: Record<string, any> = {};
        newHeaders.forEach(header => {
            reorderedRow[header] = row[header];
        });
        return reorderedRow;
    });

    updateActiveContent(toCSV(reorderedData));
  };
  
  const handleCorrectGrammar = async () => {
    if (!isDocument) return;
    setIsProcessing(true)
    toast({ title: "AI is thinking...", description: "Correcting grammar." })
    try {
      const result = await correctGrammar({ text: activeContent })
      updateActiveContent(result.correctedText)
      toast({ title: "Success", description: "Grammar corrected successfully." })
    } catch (error) {
      toast({ variant: "destructive", title: "Error", description: "Failed to correct grammar." })
    } finally {
      setIsProcessing(false)
    }
  }

  const handleRewrite = async () => {
    if (!isDocument) return;
    if (!rewriteInstruction) {
      toast({ variant: "destructive", title: "Error", description: "Please provide rewrite instructions." })
      return
    }
    setIsProcessing(true)
    setRewriteDialogOpen(false)
    toast({ title: "AI is thinking...", description: "Rewriting text." })
    try {
      const result = await rewriteDocument({ selectedText: activeContent, instructions: rewriteInstruction })
      updateActiveContent(result.rewrittenText)
      setRewriteInstruction("")
      toast({ title: "Success", description: "Text rewritten successfully." })
    } catch (error) {
      toast({ variant: "destructive", title: "Error", description: "Failed to rewrite text." })
    } finally {
      setIsProcessing(false)
    }
  }

  const handleManipulateData = async () => {
    if (!isSpreadsheet) return;
    if (!manipulateInstruction) {
        toast({ variant: "destructive", title: "Error", description: "Please provide data manipulation instructions." })
        return
    }
    setIsProcessing(true)
    toast({ title: "AI is thinking...", description: "Manipulating data." })
    try {
      const result = await manipulateData({ spreadsheetData: activeContent, selectedRange: "A1:D6", instruction: manipulateInstruction })
      updateActiveContent(result.manipulatedData)
      toast({ title: "Success", description: "Data manipulated successfully." })
    } catch (error) {
        console.error(error)
      toast({ variant: "destructive", title: "Error", description: "Failed to manipulate data." })
    } finally {
      setIsProcessing(false)
    }
  }
  
  const spreadsheetHeaders = spreadsheetData.length > 0 ? Object.keys(spreadsheetData[0]) : []

  return (
    <div className="container mx-auto max-w-7xl px-4 py-8">
       <div className="flex justify-end gap-2 mb-4">
        <Button onClick={handleSave}><Save /> Save Work</Button>
        <Button onClick={handleExport} variant="outline"><Download /> Export File</Button>
      </div>
      <div className="grid gap-6 lg:grid-cols-12">
        <div className="lg:col-span-3">
            <FileList files={Object.keys(files)} activeFile={activeFile} onFileSelect={setActiveFile} />
        </div>
        <div className="lg:col-span-9">
          <Tabs value={isDocument ? "document" : "spreadsheet"} className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="document" disabled={!isDocument}><FileText />Document</TabsTrigger>
              <TabsTrigger value="spreadsheet" disabled={!isSpreadsheet}><TableIcon />Spreadsheet</TabsTrigger>
            </TabsList>
            
            <TabsContent value="document" className="mt-4">
              <div className="grid gap-6 lg:grid-cols-5">
                <div className="lg:col-span-3">
                  <Card>
                    <CardHeader>
                      <CardTitle>Document Editor</CardTitle>
                      <CardDescription>Edit your text document. Use the AI tools to enhance your writing.</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <Textarea
                        value={activeContent}
                        onChange={(e) => updateActiveContent(e.target.value)}
                        rows={15}
                        className="resize-y"
                        placeholder="Start writing..."
                        disabled={!isDocument}
                      />
                    </CardContent>
                    <CardFooter className="flex-wrap gap-2">
                      <Button onClick={handleCorrectGrammar} disabled={isProcessing || !isDocument}>
                        {isProcessing ? <Loader2 className="animate-spin" /> : <Sparkles />}
                        Correct Grammar
                      </Button>
                      <Dialog open={isRewriteDialogOpen} onOpenChange={setRewriteDialogOpen}>
                        <DialogTrigger asChild>
                          <Button variant="outline" disabled={isProcessing || !isDocument}>
                            <Wand2 />
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
                                {isProcessing ? <Loader2 className="animate-spin" /> : <Wand2 />}
                                Rewrite
                            </Button>
                          </DialogFooter>
                        </DialogContent>
                      </Dialog>
                    </CardFooter>
                  </Card>
                </div>
                <div className="lg:col-span-2">
                  <AiChat 
                    documentContent={activeContent} 
                    onApplyChanges={updateActiveContent} 
                    disabled={!isDocument}
                  />
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="spreadsheet" className="mt-4">
              <div className="grid gap-6 lg:grid-cols-5">
                <div className="lg:col-span-3">
                  <Card>
                    <CardHeader>
                      <CardTitle>Spreadsheet</CardTitle>
                      <CardDescription>Click on a cell or header to edit its value.</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="relative w-full overflow-auto rounded-md border">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              {spreadsheetHeaders.map(header => (
                                <TableHead key={header}>
                                   <Input
                                    type="text"
                                    defaultValue={header}
                                    onBlur={(e) => handleHeaderChange(header, e.target.value)}
                                    className="h-8 border-transparent font-bold focus:border-ring focus:bg-secondary"
                                    disabled={!isSpreadsheet}
                                  />
                                </TableHead>
                              ))}
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {spreadsheetData.map((row, rowIndex) => (
                              <TableRow key={rowIndex}>
                                {spreadsheetHeaders.map(header => (
                                  <TableCell key={header}>
                                    <Input
                                      type={typeof row[header] === 'number' ? 'number' : 'text'}
                                      value={row[header]}
                                      onChange={(e) => handleSpreadsheetCellChange(rowIndex, header, e.target.value)}
                                      className="h-8 border-transparent focus:border-ring focus:bg-secondary"
                                      disabled={!isSpreadsheet}
                                    />
                                  </TableCell>
                                ))}
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
                               <Input id="manipulate-instruction" placeholder="e.g., sort by price descending" value={manipulateInstruction} onChange={e => setManipulateInstruction(e.target.value)} disabled={!isSpreadsheet} />
                            </div>
                        </CardContent>
                        <CardFooter>
                            <Button onClick={handleManipulateData} disabled={isProcessing || !isSpreadsheet} className="w-full">
                                {isProcessing ? <Loader2 className="animate-spin" /> : <Sparkles />}
                                Apply Manipulation
                            </Button>
                        </CardFooter>
                    </Card>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  )
}

    
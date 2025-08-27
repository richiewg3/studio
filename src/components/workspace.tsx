"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/hooks/use-toast"
import { BrainCircuit, Download, FileText, Loader2, Plus, Save, Sparkles, Table as TableIcon, Wand2 } from "lucide-react"
import { correctGrammar } from "@/ai/flows/correct-grammar"
import { rewriteDocument } from "@/ai/flows/rewrite-document"
import { manipulateData } from "@/ai/flows/data-manipulation"
import { AiChat } from "./ai-chat"
import { FileList } from "./file-list"
import { Skeleton } from "./ui/skeleton"
import { Tooltip, TooltipProvider, TooltipTrigger, TooltipContent } from "./ui/tooltip"

const initialFiles = {
  "notes.md": `# Welcome to your Personal AI Workspace
This is a text document editor. You can write notes, draft articles, or brainstorm ideas here. Use the AI tools below to enhance your writing.`,
  "sales-data.csv": `id,Product,Quantity,Price
1,"Laptop",12,1200
2,"Mouse",75,25
3,"Keyboard",30,75
4,"Monitor",20,300
5,"Webcam",50,50`,
};

const newDocTemplate = `# New Document\n\nStart writing here...`;
const newSheetTemplate = `Column A,Column B,Column C\nValue 1,Value 2,Value 3`;

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
  // Ensure we handle trailing commas in header
  const headersRaw = lines[0].split(',');
  const headers = headersRaw.map(h => h.trim().replace(/"/g, ''));
  
  return lines.slice(1).map(line => {
    // This regex is more robust for CSV parsing
    const values = line.match(/(".*?"|[^",]+)(?=\s*,|\s*$)/g) || [];
    return headers.reduce((obj, header, index) => {
      if (header) { // Only process if header is not empty
        const valueRaw = values[index] ? values[index].trim() : "";
        const value = valueRaw.startsWith('"') && valueRaw.endsWith('"') 
            ? valueRaw.slice(1, -1).replace(/""/g, '"') 
            : valueRaw;
        obj[header] = isNaN(Number(value)) || value === "" ? value : Number(value);
      }
      return obj;
    }, {} as Record<string, any>);
  });
};


export function Workspace() {
  const { toast } = useToast()
  const [files, setFiles] = useState<Record<string, string>>({})
  const [activeFile, setActiveFile] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  
  // Load files from localStorage on initial render
  useEffect(() => {
    try {
      // Simulate a small delay for loading
      setTimeout(() => {
        const savedFiles = localStorage.getItem("ai-workspace-files")
        if (savedFiles && Object.keys(JSON.parse(savedFiles)).length > 0) {
            const parsedFiles = JSON.parse(savedFiles)
            setFiles(parsedFiles);
            setActiveFile(Object.keys(parsedFiles)[0] || null);
        } else {
            setFiles(initialFiles)
            setActiveFile(Object.keys(initialFiles)[0] || null)
        }
        setIsLoading(false)
      }, 500);
    } catch (error) {
        console.error("Failed to load files from localStorage", error)
        setFiles(initialFiles)
        setActiveFile(Object.keys(initialFiles)[0] || null)
        setIsLoading(false)
    }
  }, [])

  const activeContent = activeFile ? files[activeFile] : "";
  const isDocument = activeFile?.endsWith('.md');
  const isSpreadsheet = activeFile?.endsWith('.csv');
  const spreadsheetData = isSpreadsheet ? fromCSV(activeContent) : [];

  const [isProcessing, setIsProcessing] = useState(false)
  const [rewriteInstruction, setRewriteInstruction] = useState("")
  const [manipulateInstruction, setManipulateInstruction] = useState("")
  const [isRewriteDialogOpen, setRewriteDialogOpen] = useState(false)
  const [isAddColumnDialogOpen, setAddColumnDialogOpen] = useState(false)
  const [newColumnName, setNewColumnName] = useState("")

  const updateActiveContent = (newContent: string) => {
    if (activeFile) {
      setFiles(prevFiles => ({
        ...prevFiles,
        [activeFile]: newContent
      }));
    }
  };

  const handleSave = () => {
    try {
        localStorage.setItem("ai-workspace-files", JSON.stringify(files));
        toast({ title: "Saved!", description: "Your files have been saved to this browser." });
    } catch (error) {
        console.error("Failed to save files to localStorage", error);
        toast({ variant: "destructive", title: "Error", description: "Could not save files. Your browser's storage might be full." });
    }
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

  const handleFileCreate = (fileName: string, type: 'document' | 'spreadsheet'): boolean => {
    if (files[fileName]) {
        return false // File already exists
    }
    const newContent = type === 'document' ? newDocTemplate : newSheetTemplate
    setFiles(prev => ({ ...prev, [fileName]: newContent }))
    setActiveFile(fileName)
    return true
  }

  const handleFileDelete = (fileName: string) => {
    const newFiles = { ...files }
    delete newFiles[fileName]
    
    if (activeFile === fileName) {
        const nextFile = Object.keys(newFiles)[0] || null
        setActiveFile(nextFile)
    }
    setFiles(newFiles)
  }

  const handleFileRename = (oldName: string, newName: string): boolean => {
    if (files[newName] && oldName !== newName) {
        return false // New file name already exists
    }
    const newFiles: Record<string, string> = {}
    Object.keys(files).forEach(key => {
        if (key === oldName) {
            newFiles[newName] = files[oldName]
        } else {
            newFiles[key] = files[key]
        }
    })
    setFiles(newFiles)
    if (activeFile === oldName) {
        setActiveFile(newName)
    }
    return true
  }


  const handleSpreadsheetCellChange = (rowIndex: number, header: string, value: string | number) => {
    if (activeFile && isSpreadsheet) {
      const newData = [...spreadsheetData];
      newData[rowIndex] = { ...newData[rowIndex], [header]: value };
      updateActiveContent(toCSV(newData));
    }
  };

  const handleHeaderChange = (oldHeader: string, newHeader: string) => {
    if (!isSpreadsheet || !newHeader.trim() || oldHeader === newHeader) return;
    
    const oldHeaders = spreadsheetHeaders;
    if(oldHeaders.includes(newHeader.trim())) {
        toast({ variant: "destructive", title: "Error", description: "Column names must be unique." });
        return;
    }

    const newData = spreadsheetData.map(row => {
      const newRow = { ...row };
      const updatedRow: Record<string, any> = {};
      Object.keys(newRow).forEach(key => {
        if (key === oldHeader) {
          updatedRow[newHeader.trim()] = newRow[key];
        } else {
          updatedRow[key] = newRow[key];
        }
      });
      return updatedRow;
    });
    updateActiveContent(toCSV(newData));
  };
  
    const handleAddRow = () => {
    if (!isSpreadsheet) return;

    if (spreadsheetData.length > 0) {
      const newRow = Object.keys(spreadsheetData[0]).reduce((acc, key) => {
        acc[key] = "";
        return acc;
      }, {} as Record<string, any>);
      updateActiveContent(toCSV([...spreadsheetData, newRow]));
    } else {
      const headers = spreadsheetHeaders.filter(h => h);
      if (headers.length > 0) {
        const newRow = headers.reduce((acc, key) => {
          acc[key] = "";
          return acc;
        }, {} as Record<string, any>);
        updateActiveContent(toCSV([newRow]));
      } else {
        toast({variant: "destructive", title: "Cannot add row", description: "Add a column first to start building your sheet."})
      }
    }
    toast({ title: "Row Added" });
  };

  const handleAddColumn = () => {
    const trimmedName = newColumnName.trim()
    if (!isSpreadsheet || !trimmedName) {
      toast({ variant: "destructive", title: "Error", description: "Column name cannot be empty." });
      return;
    }
    if (spreadsheetHeaders.includes(trimmedName)) {
      toast({ variant: "destructive", title: "Error", description: "Column name must be unique." });
      return;
    }

    if (spreadsheetData.length > 0) {
        const newData = spreadsheetData.map(row => ({
            ...row,
            [trimmedName]: ""
        }));
        updateActiveContent(toCSV(newData));
    } else {
        const existingHeaders = spreadsheetHeaders.filter(h => h);
        const newHeaders = [...existingHeaders, trimmedName].join(',');
        updateActiveContent(`${newHeaders}\n`);
    }

    setNewColumnName("");
    setAddColumnDialogOpen(false);
    toast({ title: "Column Added", description: `Column "${trimmedName}" was added.` });
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
      // Find a reasonable range, for now just use the whole sheet
      const range = spreadsheetData.length > 0 ? `A1:${String.fromCharCode(64 + Object.keys(spreadsheetData[0]).length)}${spreadsheetData.length + 1}` : 'A1:A1'

      const result = await manipulateData({ spreadsheetData: activeContent, selectedRange: range, instruction: manipulateInstruction })
      updateActiveContent(result.manipulatedData)
      toast({ title: "Success", description: "Data manipulated successfully." })
    } catch (error) {
        console.error(error)
      toast({ variant: "destructive", title: "Error", description: "Failed to manipulate data." })
    } finally {
      setIsProcessing(false)
    }
  }
  
  const spreadsheetHeaders = activeContent.split('\n')[0].split(',').map(h => h.trim());

  if (isLoading) {
    return (
        <div className="container mx-auto max-w-7xl px-4 py-8">
            <div className="flex justify-end gap-2 mb-4">
                <Skeleton className="h-10 w-32" />
                <Skeleton className="h-10 w-36" />
            </div>
            <div className="grid gap-6 lg:grid-cols-12">
                <div className="lg:col-span-3">
                    <Skeleton className="h-[300px] w-full" />
                </div>
                <div className="lg:col-span-9">
                    <Skeleton className="h-[600px] w-full" />
                </div>
            </div>
        </div>
    )
  }

  return (
    <TooltipProvider>
    <div className="container mx-auto max-w-7xl px-4 py-8">
       <div className="flex justify-end gap-2 mb-4">
        <Tooltip>
            <TooltipTrigger asChild>
                <Button onClick={handleSave} disabled={Object.keys(files).length === 0}><Save /> Save Work</Button>
            </TooltipTrigger>
            <TooltipContent>
                <p>Save all files to your browser's local storage.</p>
            </TooltipContent>
        </Tooltip>
        <Tooltip>
            <TooltipTrigger asChild>
                <Button onClick={handleExport} variant="outline" disabled={!activeFile}><Download /> Export File</Button>
            </TooltipTrigger>
            <TooltipContent>
                <p>Download the current file to your computer.</p>
            </TooltipContent>
        </Tooltip>
      </div>
      <div className="grid gap-6 lg:grid-cols-12">
        <div className="lg:col-span-3">
            <FileList 
                files={Object.keys(files).sort()} 
                activeFile={activeFile} 
                onFileSelect={setActiveFile}
                onFileCreate={handleFileCreate}
                onFileDelete={handleFileDelete}
                onFileRename={handleFileRename}
            />
        </div>
        <div className="lg:col-span-9">
         {activeFile ? (
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
                      <CardTitle>{activeFile}</CardTitle>
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
                      <CardTitle>{activeFile}</CardTitle>
                      <CardDescription>Click on a cell or header to edit its value.</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="relative w-full overflow-auto rounded-md border max-h-[500px]">
                        <Table>
                          <TableHeader className="sticky top-0 bg-background z-10">
                            <TableRow>
                              {spreadsheetHeaders.map((header, index) => (
                                <TableHead key={`${header}-${index}`}>
                                   <Input
                                    type="text"
                                    defaultValue={header}
                                    onBlur={(e) => handleHeaderChange(header, e.target.value)}
                                    className="h-8 border-transparent font-bold focus:border-ring focus:bg-secondary p-2"
                                    disabled={!isSpreadsheet}
                                    placeholder="Enter column name..."
                                  />
                                </TableHead>
                              ))}
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {spreadsheetData.map((row, rowIndex) => (
                              <TableRow key={rowIndex}>
                                {spreadsheetHeaders.map((header, colIndex) => (
                                  header ? ( // Render cell only if header is not empty
                                  <TableCell key={`${header}-${rowIndex}-${colIndex}`} className="p-1">
                                    <Input
                                      type={typeof row[header] === 'number' ? 'number' : 'text'}
                                      value={row[header] || ''}
                                      onChange={(e) => handleSpreadsheetCellChange(rowIndex, header, e.target.value)}
                                      className="h-8 border-transparent focus:border-ring focus:bg-secondary p-2"
                                      disabled={!isSpreadsheet}
                                    />
                                  </TableCell>
                                  ) : null
                                ))}
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                       {(spreadsheetData.length === 0 && spreadsheetHeaders.length > 0 && spreadsheetHeaders[0] !== "") && (
                        <div className="text-center p-8 text-muted-foreground">
                            This sheet is empty. Add a new row to get started.
                        </div>
                       )}
                       {spreadsheetHeaders.length === 0 || (spreadsheetHeaders.length === 1 && spreadsheetHeaders[0] === "") && (
                        <div className="text-center p-8 text-muted-foreground">
                           This sheet has no columns. Add a column to begin.
                        </div>
                       )}
                    </CardContent>
                     <CardFooter className="flex-wrap gap-2">
                        <Button onClick={handleAddRow} disabled={!isSpreadsheet || spreadsheetHeaders.length === 0 || spreadsheetHeaders.every(h => !h)}>
                            <Plus /> Add Row
                        </Button>
                        <Dialog open={isAddColumnDialogOpen} onOpenChange={setAddColumnDialogOpen}>
                            <DialogTrigger asChild>
                                <Button variant="outline" disabled={!isSpreadsheet}>
                                    <Plus /> Add Column
                                </Button>
                            </DialogTrigger>
                            <DialogContent>
                                <DialogHeader>
                                    <DialogTitle>Add New Column</DialogTitle>
                                </DialogHeader>
                                <div className="grid gap-4 py-4">
                                    <Label htmlFor="new-column-name">Column Name</Label>
                                    <Input 
                                        id="new-column-name" 
                                        value={newColumnName} 
                                        onChange={e => setNewColumnName(e.target.value)} 
                                        onKeyDown={e => e.key === 'Enter' && handleAddColumn()}
                                        placeholder="e.g., Email Address"
                                    />
                                </div>
                                <DialogFooter>
                                    <Button onClick={handleAddColumn}>Add Column</Button>
                                </DialogFooter>
                            </DialogContent>
                        </Dialog>
                    </CardFooter>
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
                               <Input id="manipulate-instruction" placeholder="e.g., sort by price descending" value={manipulateInstruction} onChange={e => setManipulateInstruction(e.target.value)} disabled={!isSpreadsheet || spreadsheetData.length === 0} />
                            </div>
                        </CardContent>
                        <CardFooter>
                            <Button onClick={handleManipulateData} disabled={isProcessing || !isSpreadsheet || spreadsheetData.length === 0} className="w-full">
                                {isProcessing ? <Loader2 className="animate-spin" /> : <Sparkles />}
                                Apply Manipulation
                            </Button>
                        </CardFooter>
                    </Card>
                </div>
              </div>
            </TabsContent>
          </Tabs>
         ) : (
            <Card className="flex items-center justify-center h-96 border-dashed">
                <CardContent className="text-center p-6">
                    <h2 className="text-2xl font-semibold mb-2">Welcome to Your Workspace!</h2>
                    <p className="text-muted-foreground">Select a file from the list on the left, or create a new one to get started.</p>
                </CardContent>
            </Card>
         )}
        </div>
      </div>
    </div>
    </TooltipProvider>
  )
}

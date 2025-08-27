"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { FileText, MoreVertical, Pencil, PlusCircle, Table, Trash2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { useToast } from "@/hooks/use-toast"

interface FileListProps {
  files: string[]
  activeFile: string | null
  onFileSelect: (fileName: string) => void
  onFileCreate: (fileName: string, type: 'document' | 'spreadsheet') => boolean
  onFileDelete: (fileName: string) => void
  onFileRename: (oldName: string, newName: string) => boolean
}

export function FileList({ files, activeFile, onFileSelect, onFileCreate, onFileDelete, onFileRename }: FileListProps) {
  const { toast } = useToast()
  const [isCreateDialogOpen, setCreateDialogOpen] = useState(false)
  const [isRenameDialogOpen, setRenameDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setDeleteDialogOpen] = useState(false)

  const [newFileType, setNewFileType] = useState<'document' | 'spreadsheet'>('document')
  const [newFileName, setNewFileName] = useState("")

  const [fileToRename, setFileToRename] = useState<string | null>(null)
  const [renamedFileName, setRenamedFileName] = useState("")

  const [fileToDelete, setFileToDelete] = useState<string | null>(null)


  const handleCreatePrompt = (type: 'document' | 'spreadsheet') => {
    setNewFileType(type)
    setNewFileName("")
    setCreateDialogOpen(true)
  }

  const handleCreate = () => {
    const extension = newFileType === 'document' ? '.md' : '.csv'
    const finalName = newFileName.endsWith(extension) ? newFileName : `${newFileName}${extension}`

    if (!newFileName.trim()) {
      toast({ variant: "destructive", title: "Error", description: "File name cannot be empty."})
      return
    }

    if (onFileCreate(finalName, newFileType)) {
      setCreateDialogOpen(false)
      toast({ title: "Success", description: `File "${finalName}" created.` })
    } else {
      toast({ variant: "destructive", title: "Error", description: `File "${finalName}" already exists.` })
    }
  }

  const handleRenamePrompt = (fileName: string) => {
    setFileToRename(fileName)
    const extensionIndex = fileName.lastIndexOf('.')
    setRenamedFileName(extensionIndex > -1 ? fileName.substring(0, extensionIndex) : fileName)
    setRenameDialogOpen(true)
  }
  
  const handleRename = () => {
    if (!fileToRename || !renamedFileName.trim()) {
        toast({ variant: "destructive", title: "Error", description: "File name cannot be empty."})
        return
    }
    const extension = fileToRename.endsWith('.md') ? '.md' : '.csv'
    const finalNewName = renamedFileName.endsWith(extension) ? renamedFileName : `${renamedFileName}${extension}`

    if (onFileRename(fileToRename, finalNewName)) {
        setRenameDialogOpen(false)
        toast({ title: "Success", description: `File renamed to "${finalNewName}".`})
    } else {
        toast({ variant: "destructive", title: "Error", description: `File "${finalNewName}" already exists.` })
    }
  }

  const handleDeletePrompt = (fileName: string) => {
    setFileToDelete(fileName)
    setDeleteDialogOpen(true)
  }
  
  const handleDelete = () => {
    if (fileToDelete) {
        onFileDelete(fileToDelete)
        setDeleteDialogOpen(false)
        toast({ title: "Success", description: `File "${fileToDelete}" deleted.`})
    }
  }


  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>My Files</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-2">
            {files.map(file => (
              <div key={file} className="flex items-center group">
                <Button
                  variant={activeFile === file ? "secondary" : "ghost"}
                  className={cn("w-full justify-start flex-grow", activeFile === file && "font-bold")}
                  onClick={() => onFileSelect(file)}
                >
                  {file.endsWith('.md') && <FileText className="mr-2 h-4 w-4" />}
                  {file.endsWith('.csv') && <Table className="mr-2 h-4 w-4" />}
                  <span className="truncate">{file}</span>
                </Button>
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="opacity-0 group-hover:opacity-100 flex-shrink-0 h-8 w-8">
                            <MoreVertical className="h-4 w-4" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                        <DropdownMenuItem onSelect={() => handleRenamePrompt(file)}>
                            <Pencil className="mr-2 h-4 w-4"/> Rename
                        </DropdownMenuItem>
                        <DropdownMenuItem onSelect={() => handleDeletePrompt(file)} className="text-destructive focus:text-destructive focus:bg-destructive/10">
                            <Trash2 className="mr-2 h-4 w-4"/> Delete
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
              </div>
            ))}
             {files.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4">No files yet. Create one!</p>
            )}
          </div>
        </CardContent>
        <CardFooter className="flex flex-col gap-2">
            <Button variant="outline" className="w-full" onClick={() => handleCreatePrompt('document')}><PlusCircle /> New Document</Button>
            <Button variant="outline" className="w-full" onClick={() => handleCreatePrompt('spreadsheet')}><PlusCircle /> New Spreadsheet</Button>
        </CardFooter>
      </Card>

      {/* Create Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New {newFileType === 'document' ? 'Document' : 'Spreadsheet'}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <Label htmlFor="new-file-name">File Name</Label>
            <Input 
                id="new-file-name" 
                value={newFileName} 
                onChange={e => setNewFileName(e.target.value)} 
                onKeyDown={e => e.key === 'Enter' && handleCreate()}
                placeholder={newFileType === 'document' ? 'e.g., my-notes' : 'e.g., quarterly-sales'}
            />
          </div>
          <DialogFooter>
            <Button onClick={handleCreate}>Create File</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Rename Dialog */}
      <Dialog open={isRenameDialogOpen} onOpenChange={setRenameDialogOpen}>
        <DialogContent>
            <DialogHeader>
                <DialogTitle>Rename File</DialogTitle>
                <DialogDescription>
                    Enter a new name for the file "{fileToRename}".
                </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
                <Label htmlFor="rename-file-name">New File Name</Label>
                <Input 
                    id="rename-file-name" 
                    value={renamedFileName} 
                    onChange={e => setRenamedFileName(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleRename()}
                />
            </div>
            <DialogFooter>
                <Button onClick={handleRename}>Rename</Button>
            </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Delete Confirmation Dialog */}
       <Dialog open={isDeleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
            <DialogHeader>
                <DialogTitle>Are you sure?</DialogTitle>
                <DialogDescription>
                    This will permanently delete the file "{fileToDelete}". This action cannot be undone.
                </DialogDescription>
            </DialogHeader>
            <DialogFooter>
                <Button variant="ghost" onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
                <Button variant="destructive" onClick={handleDelete}>Delete</Button>
            </DialogFooter>
        </DialogContent>
       </Dialog>
    </>
  )
}

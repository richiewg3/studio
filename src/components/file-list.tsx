"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { FileText, Table } from "lucide-react"
import { cn } from "@/lib/utils"

interface FileListProps {
  files: string[]
  activeFile: string | null
  onFileSelect: (fileName: string) => void
}

export function FileList({ files, activeFile, onFileSelect }: FileListProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>My Files</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col gap-2">
          {files.map(file => (
            <Button
              key={file}
              variant={activeFile === file ? "secondary" : "ghost"}
              className={cn("w-full justify-start", activeFile === file && "font-bold")}
              onClick={() => onFileSelect(file)}
            >
              {file.endsWith('.md') && <FileText className="mr-2" />}
              {file.endsWith('.csv') && <Table className="mr-2" />}
              <span className="truncate">{file}</span>
            </Button>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

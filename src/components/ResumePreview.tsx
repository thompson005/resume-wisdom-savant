
import { motion } from "framer-motion";
import { FileText, Download } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ResumePreviewProps {
  filename?: string;
  uploadDate?: string;
}

export default function ResumePreview({ 
  filename = "my_resume.pdf", 
  uploadDate = "Today" 
}: ResumePreviewProps) {
  // This is a simplified preview - in a real app, you would render an actual preview
  
  return (
    <div className="glass-card rounded-xl overflow-hidden">
      <div className="px-4 py-3 bg-secondary/50 border-b border-border flex justify-between items-center">
        <div className="flex items-center space-x-2">
          <FileText className="h-4 w-4 text-purple-400" />
          <span className="text-sm font-medium truncate max-w-[200px]">{filename}</span>
        </div>
        <span className="text-xs text-muted-foreground">{uploadDate}</span>
      </div>
      
      <div className="p-4">
        <div className="bg-muted/60 rounded-lg p-6 flex flex-col items-center justify-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3 }}
            className="mb-3"
          >
            <FileText className="h-12 w-12 text-muted-foreground" />
          </motion.div>
          
          <p className="text-sm text-muted-foreground mb-4 text-center">
            Resume preview not available in this demo
          </p>
          
          <Button variant="outline" size="sm" className="text-xs">
            <Download className="h-3 w-3 mr-1" />
            Download
          </Button>
        </div>
      </div>
    </div>
  );
}

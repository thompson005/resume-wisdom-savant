
import { useState, useRef } from "react";
import { motion } from "framer-motion";
import { Upload, File, X, Check, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";

type ResumeUploaderProps = {
  onUploadComplete: (file: File) => void;
};

export default function ResumeUploader({ onUploadComplete }: ResumeUploaderProps) {
  const [dragActive, setDragActive] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const validateFile = (file: File): boolean => {
    const validTypes = ["application/pdf", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"];
    const maxSize = 10 * 1024 * 1024; // 10MB
    
    if (!validTypes.includes(file.type)) {
      toast({
        title: "Invalid file type",
        description: "Please upload a PDF or DOCX file.",
        variant: "destructive",
      });
      return false;
    }
    
    if (file.size > maxSize) {
      toast({
        title: "File too large",
        description: "Maximum file size is 10MB.",
        variant: "destructive",
      });
      return false;
    }
    
    return true;
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const droppedFile = e.dataTransfer.files[0];
      handleFile(droppedFile);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  const handleFile = (file: File) => {
    if (validateFile(file)) {
      setFile(file);
    }
  };

  const handleUpload = async () => {
    if (!file) return;
    
    setUploading(true);
    
    // Simulate upload delay
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // In a real app, you would upload the file to your server here
    
    toast({
      title: "Resume uploaded successfully",
      description: "We're analyzing your resume now.",
    });
    
    onUploadComplete(file);
    setUploading(false);
  };

  const removeFile = () => {
    setFile(null);
    if (inputRef.current) {
      inputRef.current.value = "";
    }
  };

  const getFileIcon = () => {
    if (!file) return null;
    
    if (file.type === "application/pdf") {
      return <File className="h-12 w-12 text-red-400" />;
    } else {
      return <File className="h-12 w-12 text-blue-400" />;
    }
  };
  
  return (
    <div className="w-full max-w-lg mx-auto">
      <div
        className={`relative rounded-xl border-2 border-dashed transition-all duration-200 p-8 
          ${dragActive ? "border-purple-400 bg-purple-400/10" : "border-border bg-muted/30"}
          ${file ? "bg-card" : ""}`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <input
          ref={inputRef}
          type="file"
          accept=".pdf,.docx"
          className="hidden"
          onChange={handleChange}
        />

        {file ? (
          <div className="flex flex-col items-center space-y-4">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.3 }}
              className="flex flex-col items-center"
            >
              {getFileIcon()}
              <h3 className="mt-2 font-medium text-foreground">{file.name}</h3>
              <p className="text-sm text-muted-foreground">
                {(file.size / 1024 / 1024).toFixed(2)} MB
              </p>
            </motion.div>

            <div className="flex gap-3">
              <Button
                variant="destructive"
                size="sm"
                className="flex items-center gap-1.5"
                onClick={removeFile}
                disabled={uploading}
              >
                <X size={16} />
                Remove
              </Button>
              
              <Button
                variant="default"
                size="sm"
                className="flex items-center gap-1.5 bg-purple-600 hover:bg-purple-700"
                onClick={handleUpload}
                disabled={uploading}
              >
                {uploading ? (
                  <>Processing</>
                ) : (
                  <>
                    <Check size={16} />
                    Analyze Resume
                  </>
                )}
              </Button>
            </div>
          </div>
        ) : (
          <div 
            className="flex flex-col items-center justify-center cursor-pointer"
            onClick={() => inputRef.current?.click()}
          >
            <motion.div
              animate={{ y: [0, -10, 0] }}
              transition={{ repeat: Infinity, duration: 2, repeatDelay: 1 }}
              className="mb-4 rounded-full bg-muted p-3"
            >
              <Upload className="h-6 w-6 text-purple-400" />
            </motion.div>
            
            <h3 className="mb-1 font-medium text-foreground">
              Upload your resume
            </h3>
            <p className="mb-4 text-sm text-center text-muted-foreground max-w-xs">
              Drag and drop your PDF or DOCX file here, or click to browse files
            </p>
            
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="border-purple-700/30 text-purple-400 hover:bg-purple-700/10"
              onClick={() => inputRef.current?.click()}
            >
              <Upload size={16} className="mr-2" />
              Select Resume
            </Button>
          </div>
        )}
      </div>
      
      {/* File requirements */}
      <div className="mt-3 flex justify-center">
        <p className="text-xs text-muted-foreground">
          Accepted formats: PDF, DOCX (up to 10MB)
        </p>
      </div>
    </div>
  );
}

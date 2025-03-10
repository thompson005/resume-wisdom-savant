
import { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { Upload, File, X, Check, ArrowRight, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { supabase, ensureSession } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";

type ResumeUploaderProps = {
  onUploadComplete: (file: File, resumeId: string) => void;
};

export default function ResumeUploader({ onUploadComplete }: ResumeUploaderProps) {
  const [dragActive, setDragActive] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [extractingText, setExtractingText] = useState(false);
  const [sessionReady, setSessionReady] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const navigate = useNavigate();

  // Ensure we have a session (anonymous if needed)
  useEffect(() => {
    const initSession = async () => {
      try {
        await ensureSession();
        setSessionReady(true);
      } catch (error) {
        console.error("Error initializing session:", error);
        toast({
          title: "Authentication error",
          description: "Failed to initialize session. Please try again.",
          variant: "destructive",
        });
      }
    };

    initSession();
  }, [toast]);

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

  const extractTextFromFile = async (file: File): Promise<string> => {
    setExtractingText(true);
    
    // For this demo, we'll simulate text extraction
    // In a real app, you would use a library like pdf.js or docx.js
    // or call an API to extract text from the resume
    
    return new Promise((resolve) => {
      setTimeout(() => {
        // Simple mock text extraction for demo purposes
        const mockResumeText = `
John Doe
Software Engineer
john.doe@email.com | (123) 456-7890 | linkedin.com/in/johndoe

SUMMARY
Results-driven Software Engineer with 5 years of experience in full-stack development, specializing in React, Node.js, and cloud technologies. Proven track record of delivering scalable, high-performance applications and leading development teams.

SKILLS
Programming: JavaScript, TypeScript, Python, Java
Frontend: React, Redux, HTML5, CSS3, Tailwind CSS
Backend: Node.js, Express, GraphQL, REST APIs
Databases: MongoDB, PostgreSQL, MySQL
DevOps: AWS, Docker, Kubernetes, CI/CD
Tools: Git, GitHub, JIRA, Figma

WORK EXPERIENCE
Senior Software Engineer | Tech Solutions Inc.
January 2021 - Present
- Architected and developed a customer portal that increased user engagement by 35%
- Led a team of 5 engineers in rebuilding the company's flagship product
- Implemented CI/CD pipelines that reduced deployment time by 70%
- Optimized database queries resulting in 50% reduction in API response times

Software Engineer | Digital Innovations LLC
June 2018 - December 2020
- Developed frontend components using React and TypeScript
- Created RESTful APIs using Node.js and Express
- Collaborated with UX designers to implement responsive designs
- Participated in Agile development processes and sprint planning

EDUCATION
Bachelor of Science in Computer Science
University of Technology | 2014 - 2018
- GPA: 3.8/4.0
- Dean's List: 2015-2018
- Senior Project: Developed a machine learning algorithm for text classification

PROJECTS
E-commerce Platform (2022)
- Built a full-stack e-commerce application using MERN stack
- Implemented payment processing using Stripe API
- Deployed on AWS using Docker containers

Weather Prediction App (2021)
- Created a weather forecasting application using React and weather APIs
- Implemented geolocation features and interactive maps
- Achieved 10,000+ downloads on Google Play Store

CERTIFICATIONS
- AWS Certified Solutions Architect (2023)
- MongoDB Certified Developer (2022)
- Google Cloud Professional Developer (2021)
        `;
        
        setExtractingText(false);
        resolve(mockResumeText);
      }, 1500);
    });
  };

  const handleUpload = async () => {
    if (!file || !sessionReady) return;
    
    try {
      setUploading(true);
      
      // Step 1: Extract text from resume
      const resumeText = await extractTextFromFile(file);
      
      // Step 2: Ensure we have a session
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
      if (sessionError) throw new sessionError;

      // Check if we have a session, if not create an anonymous one
      if (!sessionData.session) {
        await ensureSession();
      }
      
      // Step 3: Upload to Supabase
      const { data, error } = await supabase
        .from('user_resumes')
        .insert({
          user_id: sessionData.session?.user.id,
          filename: file.name,
          content: resumeText
        })
        .select()
        .single();
      
      if (error) {
        console.error("Supabase insert error:", error);
        throw new Error(error.message);
      }
      
      // Step 4: Start analysis
      toast({
        title: "Resume uploaded successfully",
        description: "We're analyzing your resume now.",
      });
      
      if (data) {
        onUploadComplete(file, data.id);
      
        // Navigate to dashboard after a short delay
        setTimeout(() => {
          navigate("/dashboard");
        }, 1000);
      }
      
    } catch (error) {
      console.error("Error processing resume:", error);
      toast({
        title: "Upload failed",
        description: "Something went wrong. Please try again.",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
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
                disabled={uploading || extractingText}
              >
                <X size={16} />
                Remove
              </Button>
              
              <Button
                variant="default"
                size="sm"
                className="flex items-center gap-1.5 bg-purple-600 hover:bg-purple-700"
                onClick={handleUpload}
                disabled={uploading || extractingText || !sessionReady}
              >
                {uploading || extractingText ? (
                  <div className="flex items-center gap-1.5">
                    <Loader2 size={16} className="animate-spin" />
                    {extractingText ? "Extracting Text..." : "Processing..."}
                  </div>
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

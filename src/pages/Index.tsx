
import { useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { ArrowRight, CheckCircle, UserCheck, LineChart, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import Navbar from "@/components/Navbar";
import ResumeUploader from "@/components/ResumeUploader";

export default function Index() {
  const [isUploading, setIsUploading] = useState(false);
  const navigate = useNavigate();

  const handleUploadComplete = (file: File) => {
    // In a real app, you would process the file here
    console.log("File uploaded:", file.name);
    
    // Navigate to dashboard after a short delay
    setTimeout(() => {
      navigate("/dashboard");
    }, 1000);
  };

  const features = [
    {
      icon: UserCheck,
      title: "Reddit-Based Feedback",
      description: "Get insights from thousands of real resume reviews on Reddit"
    },
    {
      icon: CheckCircle,
      title: "ATS Optimization",
      description: "Ensure your resume passes through Applicant Tracking Systems"
    },
    {
      icon: LineChart,
      title: "Industry Benchmarking",
      description: "Compare your resume against industry standards and expectations"
    }
  ];

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      
      {/* Hero Section */}
      <section className="pt-24 lg:pt-32 pb-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-center"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight">
                Elevate Your Resume with
                <span className="text-gradient block mt-2">Reddit-Powered Insights</span>
              </h1>
            </motion.div>
            
            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="mt-6 text-lg sm:text-xl text-muted-foreground max-w-3xl mx-auto"
            >
              Upload your resume and get personalized feedback based on thousands of Reddit 
              discussions. Improve your chances of landing interviews with actionable insights.
            </motion.p>
            
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="mt-8 sm:mt-10 flex justify-center"
            >
              <Button
                size="lg"
                className="bg-purple-600 hover:bg-purple-700 text-white"
                onClick={() => document.getElementById("upload-section")?.scrollIntoView({ behavior: "smooth" })}
              >
                Get Started
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </motion.div>
          </motion.div>
          
          {/* Features */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="mt-16 sm:mt-20 grid grid-cols-1 md:grid-cols-3 gap-8"
          >
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.5 + index * 0.1 }}
                className="glass-card rounded-xl p-6 flex flex-col items-center text-center"
              >
                <div className="rounded-full bg-purple-900/20 p-3 mb-4">
                  <feature.icon className="h-6 w-6 text-purple-400" />
                </div>
                <h3 className="text-lg font-medium mb-2">{feature.title}</h3>
                <p className="text-sm text-muted-foreground">{feature.description}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>
      
      {/* Upload Section */}
      <section id="upload-section" className="py-16 sm:py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-background to-muted/30">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="text-center mb-10"
          >
            <span className="inline-block px-3 py-1 text-xs font-medium rounded-full bg-purple-900/20 text-purple-400 mb-3">
              Begin Analysis
            </span>
            <h2 className="text-2xl sm:text-3xl font-bold">Upload Your Resume</h2>
            <p className="mt-3 text-muted-foreground max-w-2xl mx-auto">
              Get detailed feedback and actionable suggestions to enhance your resume and improve your job prospects.
            </p>
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <ResumeUploader onUploadComplete={handleUploadComplete} />
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="mt-10 text-center"
          >
            <p className="text-sm text-muted-foreground">
              By uploading your resume, you agree to our
              <a href="#" className="text-purple-400 hover:text-purple-300 ml-1">Terms of Service</a>
              {" "}and{" "}
              <a href="#" className="text-purple-400 hover:text-purple-300">Privacy Policy</a>.
            </p>
          </motion.div>
        </div>
      </section>
      
      {/* Footer */}
      <footer className="py-8 mt-auto border-t border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center space-x-2 text-purple-400">
              <FileText className="h-5 w-5" />
              <span className="font-bold">ResumeWisdom</span>
            </div>
            
            <div className="mt-4 md:mt-0 text-sm text-muted-foreground">
              © 2023 ResumeWisdom. All rights reserved.
            </div>
            
            <div className="mt-4 md:mt-0 flex space-x-4">
              <a href="#" className="text-muted-foreground hover:text-foreground transition-colors">
                Privacy
              </a>
              <a href="#" className="text-muted-foreground hover:text-foreground transition-colors">
                Terms
              </a>
              <a href="#" className="text-muted-foreground hover:text-foreground transition-colors">
                Contact
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

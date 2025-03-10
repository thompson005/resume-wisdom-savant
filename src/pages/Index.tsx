
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { ArrowRight, CheckCircle, UserCheck, LineChart, FileText, Database } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import Navbar from "@/components/Navbar";
import ResumeUploader from "@/components/ResumeUploader";
import { supabase } from "@/integrations/supabase/client";

export default function Index() {
  const [isUploading, setIsUploading] = useState(false);
  const [isCollectingInsights, setIsCollectingInsights] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    // Check if we have insights in the database
    checkInsightsCount();
  }, []);

  const checkInsightsCount = async () => {
    try {
      const { count, error } = await supabase
        .from('reddit_insights')
        .select('*', { count: 'exact', head: true });
      
      if (error) {
        console.error("Error checking insights count:", error);
        return;
      }
      
      console.log(`Found ${count} insights in the database`);
      
      // If we have no insights, trigger the collection process
      if (count === 0) {
        setIsCollectingInsights(true);
        await collectRedditInsights();
        setIsCollectingInsights(false);
      }
    } catch (error) {
      console.error("Error in insights check:", error);
    }
  };

  const collectRedditInsights = async () => {
    const subreddits = [
      'resumes', 'Resume', 'careeradvice', 'jobs', 'askHR',
      'internships', 'ITCareerQuestions', 'EngineeringResumes',
      'Accounting', 'marketing', 'finance'
    ];
    
    toast({
      title: "Collecting insights",
      description: "Gathering resume advice from Reddit communities...",
    });

    try {
      // For each subreddit, call the edge function to collect insights
      for (const subreddit of subreddits) {
        console.log(`Collecting insights from r/${subreddit}...`);
        
        const { data, error } = await supabase.functions.invoke('reddit-scraper', {
          body: { subreddit }
        });
        
        if (error) {
          console.error(`Error collecting insights from r/${subreddit}:`, error);
        } else {
          console.log(`Collected ${data.count} insights from r/${subreddit}`);
        }
      }
      
      toast({
        title: "Insights collection complete",
        description: "Resume insights have been gathered from Reddit communities.",
      });
    } catch (error) {
      console.error("Error collecting insights:", error);
      toast({
        title: "Error collecting insights",
        description: "There was a problem gathering insights from Reddit.",
        variant: "destructive",
      });
    }
  };

  const handleUploadComplete = async (file: File, resumeId: string) => {
    console.log("Resume uploaded:", file.name, "ID:", resumeId);
    
    try {
      // Trigger resume analysis
      const { data, error } = await supabase.functions.invoke('analyze-resume', {
        body: { 
          resumeId,
          resumeText: "This is a placeholder for the actual resume text that would be extracted."
        }
      });
      
      if (error) {
        console.error("Error analyzing resume:", error);
        toast({
          title: "Analysis failed",
          description: "We couldn't analyze your resume. Please try again.",
          variant: "destructive",
        });
        return;
      }
      
      console.log("Analysis complete:", data);
      
      // Navigate to dashboard to see results
      navigate("/dashboard");
    } catch (error) {
      console.error("Error in resume analysis:", error);
    }
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
              
              {isCollectingInsights && (
                <Button
                  size="lg"
                  variant="outline"
                  className="ml-4"
                  disabled
                >
                  <Database className="mr-2 h-4 w-4 animate-pulse" />
                  Collecting Reddit Insights...
                </Button>
              )}
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

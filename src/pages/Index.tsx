
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { ArrowRight, CheckCircle, UserCheck, LineChart, FileText, Database, RefreshCw, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import Navbar from "@/components/Navbar";
import ResumeUploader from "@/components/ResumeUploader";
import { supabase, ensureSession } from "@/integrations/supabase/client";

export default function Index() {
  const [isUploading, setIsUploading] = useState(false);
  const [isCollectingInsights, setIsCollectingInsights] = useState(false);
  const [isSessionReady, setIsSessionReady] = useState(false);
  const [insightsCount, setInsightsCount] = useState(0);
  const [isDataReady, setIsDataReady] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    // Initialize session and check for insights
    const initializeApp = async () => {
      try {
        console.log("Initializing app and checking for insights...");
        
        // Ensure we have a session (anonymous if needed)
        await ensureSession();
        setIsSessionReady(true);
        
        // Check if we have insights in the database
        await checkInsightsCount();
        setIsDataReady(true);
      } catch (error) {
        console.error("Error initializing app:", error);
        toast({
          title: "Initialization error",
          description: "There was a problem setting up the application. Please refresh the page.",
          variant: "destructive",
        });
        setIsDataReady(true);
      }
    };
    
    initializeApp();
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
      setInsightsCount(count || 0);
      
      // If we have no insights, trigger the collection process
      if (count === 0) {
        toast({
          title: "No insights available",
          description: "We need to collect resume insights before analyzing. This will start automatically.",
        });
        
        await collectRedditInsights();
      }
    } catch (error) {
      console.error("Error in insights check:", error);
    }
  };

  const collectRedditInsights = async () => {
    setIsCollectingInsights(true);
    
    const subreddits = [
      'resumes', 'Resume', 'jobs'
    ];
    
    toast({
      title: "Collecting insights",
      description: "Gathering resume advice from Reddit communities...",
    });

    try {
      // First, ensure we have a session
      await ensureSession();
      
      // For each subreddit, call the edge function to collect insights
      let totalInsights = 0;
      
      for (const subreddit of subreddits) {
        console.log(`Collecting insights from r/${subreddit}...`);
        
        try {
          const { data, error } = await supabase.functions.invoke('reddit-scraper', {
            body: { subreddit }
          });
          
          if (error) {
            console.error(`Error collecting insights from r/${subreddit}:`, error);
            
            // Try again with a different approach - add explicit .json to the URL
            try {
              const retryData = await supabase.functions.invoke('reddit-scraper', {
                body: { subreddit: `${subreddit}.json` }
              });
              
              if (retryData.error) {
                console.error(`Retry also failed for r/${subreddit}:`, retryData.error);
              } else if (retryData.data) {
                console.log(`Retry succeeded! Collected ${retryData.data.count || 0} insights from r/${subreddit}`);
                totalInsights += retryData.data.count || 0;
              }
            } catch (retryError) {
              console.error(`Error in retry for r/${subreddit}:`, retryError);
            }
          } else if (data) {
            console.log(`Collected ${data.count || 0} insights from r/${subreddit}`);
            totalInsights += data.count || 0;
          }
          
          // Add a small delay between requests to avoid rate limiting
          await new Promise(resolve => setTimeout(resolve, 1000));
          
        } catch (error) {
          console.error(`Error with r/${subreddit}:`, error);
        }
      }
      
      // Update the count after collection
      await checkInsightsCount();
      
      if (totalInsights > 0) {
        toast({
          title: "Insights collection complete",
          description: `${totalInsights} resume insights have been gathered from Reddit communities.`,
        });
      } else {
        // Try to fetch mock insights if no real ones could be collected
        try {
          const { data } = await supabase.functions.invoke('reddit-scraper', {
            body: { subreddit: "mock" }
          });
          
          if (data && data.count > 0) {
            toast({
              title: "Using sample insights",
              description: "We're using sample resume insights for analysis.",
            });
            await checkInsightsCount();
          } else {
            toast({
              title: "Insights collection issue",
              description: "We had trouble collecting insights. You can continue anyway with sample data.",
              variant: "destructive",
            });
          }
        } catch (mockError) {
          console.error("Error getting mock insights:", mockError);
          toast({
            title: "Insights collection issue",
            description: "We had trouble collecting insights. You can try again or continue anyway.",
            variant: "destructive",
          });
        }
      }
    } catch (error) {
      console.error("Error collecting insights:", error);
      toast({
        title: "Error collecting insights",
        description: "There was a problem gathering insights from Reddit.",
        variant: "destructive",
      });
    } finally {
      setIsCollectingInsights(false);
    }
  };

  const handleRefreshInsights = async () => {
    setIsCollectingInsights(true);
    await collectRedditInsights();
    setIsCollectingInsights(false);
  };

  const handleUploadComplete = async (file: File, resumeId: string, resumeText: string) => {
    console.log("Resume uploaded:", file.name, "ID:", resumeId);
    
    setIsUploading(true);
    
    try {
      // Ensure we have insights before analysis
      if (insightsCount === 0) {
        toast({
          title: "No insights available",
          description: "We need to collect insights before analyzing your resume.",
        });
        
        await collectRedditInsights();
        
        // Re-check if we have insights now
        const { count, error } = await supabase
          .from('reddit_insights')
          .select('*', { count: 'exact', head: true });
          
        if (error) {
          console.error("Error checking insights count:", error);
        }
        
        // If we still have no insights, we'll continue with mock data
        if (!count) {
          console.log("Still no insights available, continuing with mock data");
        }
      }
      
      toast({
        title: "Analyzing resume",
        description: "We're comparing your resume against Reddit insights...",
      });
      
      // Trigger resume analysis
      const { data, error } = await supabase.functions.invoke('analyze-resume', {
        body: { 
          resumeId,
          resumeText: resumeText
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
      
      toast({
        title: "Analysis complete",
        description: "Your resume has been analyzed. View your results on the dashboard.",
      });
      
      // Navigate to dashboard to see results
      navigate("/dashboard");
    } catch (error) {
      console.error("Error in resume analysis:", error);
      toast({
        title: "Analysis error",
        description: "There was an error analyzing your resume. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
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

  if (!isDataReady) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center">
        <div className="text-center">
          <RefreshCw className="h-10 w-10 animate-spin text-purple-500 mx-auto mb-4" />
          <h2 className="text-2xl font-semibold mb-2">Loading Application</h2>
          <p className="text-muted-foreground">Initializing and checking data...</p>
        </div>
      </div>
    );
  }

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
              Upload your resume and get personalized feedback based on Reddit 
              discussions. Improve your chances of landing interviews with actionable insights.
            </motion.p>
            
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="mt-8 sm:mt-10 flex flex-wrap justify-center gap-4"
            >
              <Button
                size="lg"
                className="bg-purple-600 hover:bg-purple-700 text-white"
                onClick={() => document.getElementById("upload-section")?.scrollIntoView({ behavior: "smooth" })}
              >
                Get Started
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
              
              {isCollectingInsights ? (
                <Button
                  size="lg"
                  variant="outline"
                  disabled
                >
                  <Database className="mr-2 h-4 w-4 animate-pulse" />
                  Collecting Reddit Insights...
                </Button>
              ) : (
                <Button
                  size="lg"
                  variant="outline"
                  onClick={handleRefreshInsights}
                  disabled={isCollectingInsights}
                >
                  <RefreshCw className={`mr-2 h-4 w-4 ${isCollectingInsights ? 'animate-spin' : ''}`} />
                  {insightsCount > 0 ? `Refresh Insights (${insightsCount})` : "Collect Insights"}
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
            
            {insightsCount > 0 ? (
              <div className="mt-2 text-sm text-green-500 flex items-center justify-center">
                <CheckCircle className="h-4 w-4 mr-1" />
                Ready with {insightsCount} insights from Reddit
              </div>
            ) : (
              <div className="mt-2 text-sm text-amber-500 flex items-center justify-center">
                <AlertCircle className="h-4 w-4 mr-1" />
                Using sample insights for analysis
              </div>
            )}
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <ResumeUploader onUploadComplete={handleUploadComplete} isLoading={isUploading} />
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

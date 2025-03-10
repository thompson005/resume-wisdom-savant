
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { 
  Loader2, 
  ArrowRight, 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  FileText 
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import Navbar from "@/components/Navbar";
import ResumePreview from "@/components/ResumePreview";
import ScoreDisplay from "@/components/ScoreDisplay";

export default function Dashboard() {
  const [loading, setLoading] = useState(true);
  const [analysisComplete, setAnalysisComplete] = useState(false);
  const [resume, setResume] = useState<any>(null);
  const [resumeScores, setResumeScores] = useState({
    overall: 0.73,
    content: 0.78,
    formatting: 0.65,
    impact: 0.71,
    ats: 0.80,
  });
  const [quickInsights, setQuickInsights] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    // Fetch the most recent resume and its analysis
    fetchResumeData();
  }, []);

  const fetchResumeData = async () => {
    try {
      setLoading(true);
      
      // Get the most recent resume
      const { data: resumeData, error: resumeError } = await supabase
        .from('user_resumes')
        .select('*')
        .order('upload_date', { ascending: false })
        .limit(1)
        .single();
      
      if (resumeError) {
        console.error("Error fetching resume:", resumeError);
        // If no resume found, we'll use default data
        setLoading(false);
        return;
      }
      
      setResume(resumeData);
      
      // Get the scores for this resume
      const { data: scoreData, error: scoreError } = await supabase
        .from('resume_scores')
        .select('*')
        .eq('resume_id', resumeData.id)
        .single();
      
      if (!scoreError && scoreData) {
        setResumeScores({
          overall: scoreData.overall_score,
          content: scoreData.content_score,
          formatting: scoreData.formatting_score,
          impact: scoreData.impact_score,
          ats: scoreData.ats_score,
        });
      }
      
      // Get a few feedback items for quick insights
      const { data: feedbackData, error: feedbackError } = await supabase
        .from('resume_feedback')
        .select('*')
        .eq('resume_id', resumeData.id)
        .limit(3);
      
      if (!feedbackError && feedbackData) {
        const insights = feedbackData.map(item => {
          let icon = CheckCircle;
          let color = "text-green-500";
          let bg = "bg-green-500/10";
          
          if (item.type === "warning") {
            icon = AlertTriangle;
            color = "text-yellow-500";
            bg = "bg-yellow-500/10";
          } else if (item.type === "improvement") {
            icon = Clock;
            color = "text-blue-400";
            bg = "bg-blue-500/10";
          }
          
          return {
            icon,
            color,
            bg,
            text: item.feedback
          };
        });
        
        setQuickInsights(insights);
      }
      
      // Set analysis complete
      setAnalysisComplete(true);
      setLoading(false);
      
    } catch (error) {
      console.error("Error loading resume data:", error);
      setLoading(false);
    }
  };

  // If no insights defined yet, use default ones
  const defaultInsights = [
    {
      icon: AlertTriangle,
      color: "text-yellow-500",
      bg: "bg-yellow-500/10",
      text: "Your resume may struggle with ATS systems due to complex formatting."
    },
    {
      icon: CheckCircle,
      color: "text-green-500",
      bg: "bg-green-500/10",
      text: "Work experience section is well structured with clear impact statements."
    },
    {
      icon: Clock,
      color: "text-blue-400",
      bg: "bg-blue-500/10",
      text: "Consider shortening your resume to fit on a single page for better readability."
    }
  ];

  // Use quick insights if available, otherwise use defaults
  const displayInsights = quickInsights.length > 0 ? quickInsights : defaultInsights;

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      
      <main className="flex-1 py-16 px-4 sm:px-6 lg:px-8 pt-24">
        <div className="max-w-7xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold">Resume Analysis</h1>
            <p className="text-muted-foreground mt-2">Overview of your resume performance and recommendations</p>
          </div>
          
          {loading ? (
            <div className="flex flex-col items-center justify-center py-16">
              <Loader2 className="h-12 w-12 text-purple-400 animate-spin mb-4" />
              <h3 className="text-xl font-medium mb-2">Analyzing your resume...</h3>
              <p className="text-muted-foreground text-center max-w-md">
                We're scanning Reddit discussions and applying AI analysis to generate personalized feedback.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Left column: Resume preview */}
              <div className="lg:col-span-1">
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.4 }}
                >
                  <h2 className="text-xl font-semibold mb-4">Your Resume</h2>
                  <ResumePreview 
                    filename={resume?.filename || "my_resume.pdf"}
                    uploadDate={resume ? new Date(resume.upload_date).toLocaleDateString() : "Today"}
                  />
                  
                  <div className="mt-6">
                    <h3 className="text-lg font-medium mb-3">Quick Analysis</h3>
                    <div className="space-y-3">
                      {displayInsights.map((insight, index) => (
                        <motion.div
                          key={index}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.4, delay: index * 0.1 }}
                          className={`${insight.bg} border border-border/50 rounded-lg p-3 flex items-start space-x-3`}
                        >
                          <div className="flex-shrink-0 mt-0.5">
                            <insight.icon className={`h-5 w-5 ${insight.color}`} />
                          </div>
                          <p className="text-sm">{insight.text}</p>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                </motion.div>
              </div>
              
              {/* Right column: Scores and actions */}
              <div className="lg:col-span-2">
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.4, delay: 0.1 }}
                >
                  <h2 className="text-xl font-semibold mb-4">Performance Overview</h2>
                  
                  <ScoreDisplay scores={resumeScores} />
                  
                  <div className="mt-8">
                    <h3 className="text-lg font-medium mb-3">Recommendations</h3>
                    
                    <motion.div
                      className="bg-gradient-to-br from-purple-500/20 to-purple-700/20 border border-purple-500/30 rounded-xl p-6"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.4, delay: 0.3 }}
                    >
                      <div className="flex items-center space-x-4">
                        {analysisComplete ? (
                          <>
                            <div className="rounded-full bg-purple-500/20 p-2">
                              <FileText className="h-6 w-6 text-purple-400" />
                            </div>
                            <div>
                              <h4 className="font-medium">Detailed Feedback Ready</h4>
                              <p className="text-sm text-muted-foreground mt-1">
                                We've analyzed your resume and compiled detailed feedback based on Reddit insights.
                              </p>
                            </div>
                            <div className="ml-auto">
                              <Button 
                                onClick={() => navigate("/feedback")}
                                className="bg-purple-600 hover:bg-purple-700"
                              >
                                View Feedback
                                <ArrowRight className="ml-2 h-4 w-4" />
                              </Button>
                            </div>
                          </>
                        ) : (
                          <>
                            <div className="rounded-full bg-purple-500/20 p-2">
                              <Loader2 className="h-6 w-6 text-purple-400 animate-spin" />
                            </div>
                            <div>
                              <h4 className="font-medium">Generating Detailed Feedback</h4>
                              <p className="text-sm text-muted-foreground mt-1">
                                We're compiling personalized recommendations based on Reddit insights.
                              </p>
                            </div>
                          </>
                        )}
                      </div>
                    </motion.div>
                    
                    <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                      <motion.div
                        className="glass-card rounded-lg p-4"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.4, delay: 0.4 }}
                      >
                        <h4 className="font-medium mb-2">Submit for Review</h4>
                        <p className="text-sm text-muted-foreground mb-3">
                          Get personalized feedback from our resume experts.
                        </p>
                        <Button variant="outline" className="w-full text-purple-400 border-purple-500/30 hover:bg-purple-500/10">
                          Request Expert Review
                        </Button>
                      </motion.div>
                      
                      <motion.div
                        className="glass-card rounded-lg p-4"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.4, delay: 0.5 }}
                      >
                        <h4 className="font-medium mb-2">Improve Your Resume</h4>
                        <p className="text-sm text-muted-foreground mb-3">
                          Apply AI-suggested improvements to your resume.
                        </p>
                        <Button variant="outline" className="w-full text-purple-400 border-purple-500/30 hover:bg-purple-500/10">
                          Open Resume Editor
                        </Button>
                      </motion.div>
                    </div>
                  </div>
                </motion.div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

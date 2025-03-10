
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { 
  ArrowLeft, 
  Filter, 
  Download, 
  Loader2,
  Share2,
  Search,
  FileText,
  CheckCircle
} from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import Navbar from "@/components/Navbar";
import FeedbackCard, { FeedbackItem } from "@/components/FeedbackCard";

export default function Feedback() {
  const [loading, setLoading] = useState(true);
  const [feedbackItems, setFeedbackItems] = useState<FeedbackItem[]>([]);
  const [filters, setFilters] = useState({
    types: {
      improvement: true,
      strength: true,
      insight: true,
      warning: true,
      suggestion: true
    },
    sections: {
      "Contact Information": true,
      "Summary": true,
      "Work Experience": true,
      "Skills": true,
      "Education": true,
      "Projects": true,
      "Formatting": true,
      "General": true
    }
  });
  const [searchQuery, setSearchQuery] = useState("");

  // Mock data loading
  useEffect(() => {
    const timer = setTimeout(() => {
      setFeedbackItems(mockFeedbackItems);
      setLoading(false);
    }, 1500);
    
    return () => clearTimeout(timer);
  }, []);

  // Filter and search logic
  const filteredFeedback = feedbackItems.filter(item => {
    // Type filter
    if (!filters.types[item.type]) return false;
    
    // Section filter
    if (!filters.sections[item.section as keyof typeof filters.sections]) return false;
    
    // Search
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        item.title.toLowerCase().includes(query) ||
        item.description.toLowerCase().includes(query) ||
        item.section.toLowerCase().includes(query)
      );
    }
    
    return true;
  });

  const toggleTypeFilter = (type: keyof typeof filters.types) => {
    setFilters(prev => ({
      ...prev,
      types: {
        ...prev.types,
        [type]: !prev.types[type]
      }
    }));
  };

  const toggleSectionFilter = (section: keyof typeof filters.sections) => {
    setFilters(prev => ({
      ...prev,
      sections: {
        ...prev.sections,
        [section]: !prev.sections[section]
      }
    }));
  };

  const resetFilters = () => {
    setFilters({
      types: {
        improvement: true,
        strength: true,
        insight: true,
        warning: true,
        suggestion: true
      },
      sections: {
        "Contact Information": true,
        "Summary": true,
        "Work Experience": true,
        "Skills": true,
        "Education": true,
        "Projects": true,
        "Formatting": true,
        "General": true
      }
    });
    setSearchQuery("");
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      
      <main className="flex-1 py-16 px-4 sm:px-6 lg:px-8 pt-24">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 gap-4">
            <div>
              <div className="flex items-center gap-2">
                <Link to="/dashboard" className="text-muted-foreground hover:text-foreground transition-colors">
                  <ArrowLeft className="h-5 w-5" />
                </Link>
                <h1 className="text-3xl font-bold">Detailed Feedback</h1>
              </div>
              <p className="text-muted-foreground mt-2">
                Insights based on Reddit discussions and AI analysis
              </p>
            </div>
            
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" className="text-sm gap-1.5">
                <Download className="h-4 w-4" />
                Export Report
              </Button>
              <Button variant="outline" className="text-sm gap-1.5">
                <Share2 className="h-4 w-4" />
                Share
              </Button>
            </div>
          </div>
          
          {loading ? (
            <div className="flex flex-col items-center justify-center py-16">
              <Loader2 className="h-12 w-12 text-purple-400 animate-spin mb-4" />
              <h3 className="text-xl font-medium mb-2">Generating detailed feedback...</h3>
              <p className="text-muted-foreground text-center max-w-md">
                We're compiling insights from thousands of Reddit discussions to provide you with actionable feedback.
              </p>
            </div>
          ) : (
            <>
              {/* Filters and search */}
              <div className="mb-8 flex flex-col sm:flex-row gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search feedback..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9"
                  />
                </div>
                
                <div className="flex gap-2">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" className="gap-1.5">
                        <Filter className="h-4 w-4" />
                        Filter
                        {Object.values(filters.types).some(v => !v) || 
                         Object.values(filters.sections).some(v => !v) ? (
                           <Badge variant="secondary" className="ml-1 h-5 px-1.5">!</Badge>
                         ) : null}
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="w-56">
                      <DropdownMenuLabel>Feedback Type</DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      {Object.keys(filters.types).map((type) => (
                        <DropdownMenuCheckboxItem
                          key={type}
                          checked={filters.types[type as keyof typeof filters.types]}
                          onCheckedChange={() => toggleTypeFilter(type as keyof typeof filters.types)}
                        >
                          {type.charAt(0).toUpperCase() + type.slice(1)}
                        </DropdownMenuCheckboxItem>
                      ))}
                      
                      <DropdownMenuSeparator />
                      <DropdownMenuLabel>Resume Sections</DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      
                      {Object.keys(filters.sections).map((section) => (
                        <DropdownMenuCheckboxItem
                          key={section}
                          checked={filters.sections[section as keyof typeof filters.sections]}
                          onCheckedChange={() => toggleSectionFilter(section as keyof typeof filters.sections)}
                        >
                          {section}
                        </DropdownMenuCheckboxItem>
                      ))}
                      
                      <DropdownMenuSeparator />
                      <div className="p-2">
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="w-full text-xs"
                          onClick={resetFilters}
                        >
                          Reset Filters
                        </Button>
                      </div>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
              
              {/* Feedback items */}
              {filteredFeedback.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                  {filteredFeedback.map((item, index) => (
                    <FeedbackCard key={item.id} feedback={item} index={index} />
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <FileText className="h-16 w-16 text-muted-foreground mb-4 opacity-30" />
                  <h3 className="text-xl font-medium mb-2">No feedback items found</h3>
                  <p className="text-muted-foreground max-w-md">
                    Try adjusting your filters or search query to see more feedback items.
                  </p>
                  <Button 
                    variant="outline" 
                    className="mt-4"
                    onClick={resetFilters}
                  >
                    Reset Filters
                  </Button>
                </div>
              )}
              
              {/* AI Enhancement suggestion */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="mt-12 bg-gradient-to-br from-purple-900/30 to-purple-700/10 rounded-xl p-6 sm:p-8 border border-purple-500/20"
              >
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                  <div className="rounded-full bg-purple-500/20 p-3">
                    <CheckCircle className="h-8 w-8 text-purple-400" />
                  </div>
                  
                  <div className="flex-1">
                    <h3 className="text-xl font-semibold mb-1">Ready to Enhance Your Resume?</h3>
                    <p className="text-muted-foreground">
                      Our AI can automatically improve your resume based on this feedback, optimizing it for ATS systems and hiring managers.
                    </p>
                  </div>
                  
                  <Button className="bg-purple-600 hover:bg-purple-700 shrink-0 mt-4 sm:mt-0">
                    Enhance Resume
                  </Button>
                </div>
              </motion.div>
            </>
          )}
        </div>
      </main>
    </div>
  );
}

// Mock feedback data
const mockFeedbackItems: FeedbackItem[] = [
  {
    id: "1",
    type: "warning",
    title: "ATS Compatibility Issue",
    description: "Your resume uses complex formatting that may confuse ATS systems. Reddit users consistently note that simpler formats perform better.",
    section: "Formatting",
    source: "r/resumes"
  },
  {
    id: "2",
    type: "improvement",
    title: "Quantify Your Achievements",
    description: "Add more specific metrics to your work experience. Many Reddit discussions emphasize the importance of quantifiable results rather than job duties.",
    section: "Work Experience",
    source: "r/jobs"
  },
  {
    id: "3",
    type: "strength",
    title: "Strong Skills Section",
    description: "Your skills section is well-organized and includes relevant keywords for your industry. Reddit users in similar roles confirm these are valuable skills.",
    section: "Skills",
    source: "r/cscareerquestions"
  },
  {
    id: "4",
    type: "suggestion",
    title: "Shorten Your Summary",
    description: "Your summary is too long. According to recruiters on Reddit, summaries should be 2-3 sentences maximum focusing on your unique value proposition.",
    section: "Summary",
    source: "r/recruiting"
  },
  {
    id: "5",
    type: "insight",
    title: "Education Placement",
    description: "As a professional with 5+ years of experience, Reddit discussions suggest moving your education section below work experience as recruiters focus more on recent work.",
    section: "Education",
    source: "r/careerguidance"
  },
  {
    id: "6",
    type: "improvement",
    title: "Contact Information Formatting",
    description: "Your contact information should be more prominent. Reddit users suggest a clean, clear format at the top with email, phone, LinkedIn and location.",
    section: "Contact Information",
    source: "r/resumes"
  },
  {
    id: "7",
    type: "warning",
    title: "Too Many Bullet Points",
    description: "Each position has too many bullet points (6+). Reddit feedback consistently shows 3-5 strong, achievement-focused bullets are more effective.",
    section: "Work Experience",
    source: "r/jobs"
  },
  {
    id: "8",
    type: "strength",
    title: "Relevant Projects",
    description: "Your projects section effectively demonstrates practical applications of your skills. Reddit users in your field respond positively to similar project descriptions.",
    section: "Projects",
    source: "r/cscareerquestions"
  },
  {
    id: "9",
    type: "suggestion",
    title: "Use Action Verbs",
    description: "Replace passive language with strong action verbs. Reddit discussions show that starting bullets with words like 'Developed,' 'Implemented,' or 'Achieved' creates more impact.",
    section: "Work Experience",
    source: "r/resumes"
  },
  {
    id: "10",
    type: "insight",
    title: "Skills Organization",
    description: "Consider grouping your skills by category. Reddit feedback suggests this improves readability and helps recruiters quickly identify relevant capabilities.",
    section: "Skills",
    source: "r/recruiting"
  }
];


import { motion } from "framer-motion";
import { Tooltip } from "@/components/ui/tooltip";
import { TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { InfoIcon } from "lucide-react";

interface ScoreCategoryProps {
  name: string;
  score: number;
  info: string;
  color: string;
  index: number;
}

function ScoreCategory({ name, score, info, color, index }: ScoreCategoryProps) {
  // Calculate score properties
  const scorePercent = score * 100;
  const scoreWidth = `${scorePercent}%`;
  
  // Dynamic classes based on score
  const getScoreColor = () => {
    if (score >= 0.8) return `bg-${color}-500`;
    if (score >= 0.6) return `bg-${color}-600`;
    if (score >= 0.4) return `bg-${color}-700`;
    return `bg-${color}-800`;
  };
  
  return (
    <motion.div 
      className="mb-4"
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.1, duration: 0.4 }}
    >
      <div className="flex justify-between items-center mb-1">
        <div className="flex items-center gap-1.5">
          <span className="text-sm font-medium text-foreground">{name}</span>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <InfoIcon size={14} className="text-muted-foreground hover:text-foreground cursor-help transition-colors" />
              </TooltipTrigger>
              <TooltipContent>
                <p className="max-w-xs text-xs">{info}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
        <span className="text-sm font-semibold">
          {score.toFixed(1)}/1.0
        </span>
      </div>
      <div className="h-2 w-full bg-secondary rounded-full overflow-hidden">
        <motion.div
          className={`h-full rounded-full ${color}`}
          style={{ width: "0%" }}
          animate={{ width: scoreWidth }}
          transition={{ 
            duration: 1,
            delay: index * 0.1 + 0.2,
            ease: "easeOut"
          }}
        />
      </div>
    </motion.div>
  );
}

interface ScoreDisplayProps {
  scores: {
    overall: number;
    content: number;
    formatting: number;
    impact: number;
    ats: number;
  };
}

export default function ScoreDisplay({ scores }: ScoreDisplayProps) {
  // Calculate overall score and letter grade
  const overallPercent = scores.overall * 100;
  
  const getGrade = (score: number) => {
    if (score >= 0.9) return "A+";
    if (score >= 0.8) return "A";
    if (score >= 0.7) return "B";
    if (score >= 0.6) return "C";
    if (score >= 0.5) return "D";
    return "F";
  };
  
  const getScoreColor = (score: number) => {
    if (score >= 0.8) return "text-green-400";
    if (score >= 0.7) return "text-blue-400";
    if (score >= 0.6) return "text-yellow-400";
    if (score >= 0.5) return "text-orange-400";
    return "text-red-400";
  };
  
  const scoreCategories = [
    {
      name: "Content Quality",
      score: scores.content,
      info: "Evaluates the quality, relevance, and strength of the content in your resume.",
      color: "bg-purple"
    },
    {
      name: "Formatting & Structure",
      score: scores.formatting,
      info: "Assesses the layout, organization, and visual appeal of your resume.",
      color: "bg-blue"
    },
    {
      name: "Impact Statements",
      score: scores.impact,
      info: "Measures how effectively your achievements and contributions are communicated.",
      color: "bg-green"
    },
    {
      name: "ATS Compatibility",
      score: scores.ats,
      info: "Evaluates how well your resume will perform with Applicant Tracking Systems.",
      color: "bg-yellow"
    }
  ];
  
  return (
    <div className="glass-card rounded-xl p-6">
      <div className="flex flex-col sm:flex-row gap-8 items-center mb-6">
        <motion.div 
          className="relative flex flex-col items-center justify-center"
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          <svg className="w-32 h-32">
            <circle
              className="text-secondary"
              strokeWidth="8"
              stroke="currentColor"
              fill="transparent"
              r="58"
              cx="64"
              cy="64"
            />
            <motion.circle
              className="text-purple-500"
              strokeWidth="8"
              strokeLinecap="round"
              stroke="currentColor"
              fill="transparent"
              r="58"
              cx="64"
              cy="64"
              initial={{ strokeDasharray: "365", strokeDashoffset: "365" }}
              animate={{ strokeDashoffset: 365 - (365 * scores.overall) }}
              transition={{ duration: 1, delay: 0.5, ease: "easeOut" }}
            />
          </svg>
          <div className="absolute flex flex-col items-center justify-center text-center">
            <span className={`text-3xl font-bold ${getScoreColor(scores.overall)}`}>
              {getGrade(scores.overall)}
            </span>
            <span className="text-sm text-muted-foreground">
              {overallPercent.toFixed(0)}%
            </span>
          </div>
        </motion.div>
        
        <div className="flex-1">
          <motion.h3 
            className="text-xl font-semibold mb-2"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            Resume Score
          </motion.h3>
          <motion.p 
            className="text-sm text-muted-foreground mb-4"
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.1 }}
          >
            Based on analysis of similar resumes and Reddit feedback
          </motion.p>
          
          <div className="space-y-3">
            {scoreCategories.map((category, index) => (
              <ScoreCategory
                key={category.name}
                name={category.name}
                score={category.score}
                info={category.info}
                color={category.color}
                index={index}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

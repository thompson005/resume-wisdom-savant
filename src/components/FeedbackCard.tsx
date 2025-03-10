
import { motion } from "framer-motion";
import { 
  AlertTriangle, 
  CheckCircle, 
  AlertCircle, 
  ThumbsUp, 
  Lightbulb
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export type FeedbackType = "improvement" | "strength" | "insight" | "warning" | "suggestion";

export interface FeedbackItem {
  id: string;
  type: FeedbackType;
  title: string;
  description: string;
  section: string;
  source?: string;
}

interface FeedbackCardProps {
  feedback: FeedbackItem;
  index: number;
}

export default function FeedbackCard({ feedback, index }: FeedbackCardProps) {
  const typeConfig = {
    improvement: {
      icon: AlertCircle,
      color: "text-yellow-500",
      bg: "bg-yellow-500/10",
      border: "border-yellow-500/20",
      badgeVariant: "outline" as const,
      badgeClass: "border-yellow-500/30 text-yellow-500 bg-yellow-500/10",
    },
    strength: {
      icon: ThumbsUp,
      color: "text-green-500",
      bg: "bg-green-500/10",
      border: "border-green-500/20",
      badgeVariant: "outline" as const,
      badgeClass: "border-green-500/30 text-green-500 bg-green-500/10",
    },
    insight: {
      icon: Lightbulb,
      color: "text-blue-400",
      bg: "bg-blue-500/10",
      border: "border-blue-500/20",
      badgeVariant: "outline" as const,
      badgeClass: "border-blue-400/30 text-blue-400 bg-blue-400/10",
    },
    warning: {
      icon: AlertTriangle,
      color: "text-red-500",
      bg: "bg-red-500/10",
      border: "border-red-500/20",
      badgeVariant: "outline" as const,
      badgeClass: "border-red-500/30 text-red-500 bg-red-500/10",
    },
    suggestion: {
      icon: CheckCircle,
      color: "text-purple-400",
      bg: "bg-purple-500/10",
      border: "border-purple-500/20",
      badgeVariant: "outline" as const,
      badgeClass: "border-purple-400/30 text-purple-400 bg-purple-400/10",
    },
  };

  const config = typeConfig[feedback.type];
  const Icon = config.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.1 }}
    >
      <Card className="glass-card overflow-hidden">
        <div className={`h-1 w-full ${config.bg}`} />
        <CardHeader className="pb-2">
          <div className="flex justify-between items-start">
            <div className="flex items-center gap-2">
              <div className={`p-1.5 rounded-full ${config.bg} ${config.border}`}>
                <Icon size={16} className={config.color} />
              </div>
              <CardTitle className="text-sm sm:text-base">{feedback.title}</CardTitle>
            </div>
            <Badge variant={config.badgeVariant} className={config.badgeClass}>
              {feedback.type}
            </Badge>
          </div>
          <CardDescription className="text-xs sm:text-sm">
            Section: {feedback.section}
            {feedback.source && <> • Source: {feedback.source}</>}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground leading-relaxed">{feedback.description}</p>
        </CardContent>
      </Card>
    </motion.div>
  );
}

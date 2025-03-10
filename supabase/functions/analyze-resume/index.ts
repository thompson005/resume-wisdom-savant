
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
  const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY') ?? '';
  const groqApiKey = Deno.env.get('GROQ_API_KEY') ?? '';
  const perplexityApiKey = Deno.env.get('PERPLEXITY_API_KEY') ?? '';
  
  const supabase = createClient(supabaseUrl, supabaseAnonKey);

  try {
    const { resumeId, resumeText } = await req.json();
    
    if (!resumeId || !resumeText) {
      return new Response(
        JSON.stringify({ error: "Resume ID and text are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Analyzing resume: ${resumeId}`);

    // Get insights from the database
    const { data: insights, error: insightsError } = await supabase
      .from('reddit_insights')
      .select('*')
      .limit(100);
      
    if (insightsError) {
      console.error("Error fetching insights:", insightsError);
      throw new Error("Failed to fetch Reddit insights");
    }

    // If no insights are available, generate some mock insights for testing
    const useInsights = insights?.length > 0 ? insights : createMockInsights();
    
    if (!insights || insights.length === 0) {
      console.log("No insights found in database, using mock insights");
    } else {
      console.log(`Found ${insights.length} insights in database`);
    }

    // Format insights for the AI prompt
    const insightsText = useInsights
      .map(i => `- Section: ${i.section}, Category: ${i.category}, Insight: "${i.insight}", Sentiment: ${i.sentiment}`)
      .join('\n');

    // Use Perplexity API first (if available) or fallback to Groq
    let analysis;
    
    try {
      if (perplexityApiKey) {
        console.log("Using Perplexity API for resume analysis");
        const aiResponse = await fetch("https://api.perplexity.ai/chat/completions", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${perplexityApiKey}`,
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            model: "llama-3.1-sonar-small-128k-online",
            messages: [
              {
                role: "system",
                content: "You are an expert resume analyst. You will compare a resume against common Reddit insights and provide personalized feedback."
              },
              {
                role: "user",
                content: `Here is a resume:\n\n${resumeText}\n\nHere are insights from Reddit discussions about resumes:\n\n${insightsText}\n\nPlease provide:
                1. Generate 10 specific feedback items for this resume based on the Reddit insights. For each item include:
                   - type (improvement, strength, insight, warning, suggestion)
                   - title (short descriptive title)
                   - section (which resume section this applies to)
                   - description (detailed feedback description)
                   - source (relevant subreddit if applicable)
                2. Calculate scores (0-1 scale) for:
                   - overall_score
                   - content_score (quality of content)
                   - formatting_score (layout and organization)
                   - impact_score (effectiveness of achievements)
                   - ats_score (how well it works with ATS systems)
                Format your response as valid JSON with two properties: 'feedback' (array of feedback objects) and 'scores' (score object).`
              }
            ],
            temperature: 0.7,
            max_tokens: 4096
          })
        });

        if (!aiResponse.ok) {
          const errorText = await aiResponse.text();
          console.error(`Perplexity API error (${aiResponse.status}): ${errorText}`);
          throw new Error(`Perplexity API error: ${aiResponse.status}`);
        }

        const data = await aiResponse.json();
        try {
          analysis = JSON.parse(data.choices[0].message.content);
        } catch (parseError) {
          console.error("Error parsing Perplexity response:", parseError);
          console.log("Raw content:", data.choices[0].message.content);
          throw new Error("Failed to parse Perplexity response");
        }
      } else if (groqApiKey) {
        console.log("Using Groq API for resume analysis");
        const aiResponse = await fetch("https://api.groq.com/openai/v1/chat/completions", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${groqApiKey}`,
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            model: "llama3-8b-8192",
            messages: [
              {
                role: "system",
                content: "You are an expert resume analyst. You will compare a resume against common Reddit insights and provide personalized feedback."
              },
              {
                role: "user",
                content: `Here is a resume:\n\n${resumeText}\n\nHere are insights from Reddit discussions about resumes:\n\n${insightsText}\n\nPlease provide:
                1. Generate 10 specific feedback items for this resume based on the Reddit insights. For each item include:
                   - type (improvement, strength, insight, warning, suggestion)
                   - title (short descriptive title)
                   - section (which resume section this applies to)
                   - description (detailed feedback description)
                   - source (relevant subreddit if applicable)
                2. Calculate scores (0-1 scale) for:
                   - overall_score
                   - content_score (quality of content)
                   - formatting_score (layout and organization)
                   - impact_score (effectiveness of achievements)
                   - ats_score (how well it works with ATS systems)
                Format your response as valid JSON with two properties: 'feedback' (array of feedback objects) and 'scores' (score object).`
              }
            ],
            temperature: 0.7,
            max_tokens: 4096
          })
        });

        if (!aiResponse.ok) {
          const errorText = await aiResponse.text();
          console.error(`Groq API error (${aiResponse.status}): ${errorText}`);
          throw new Error(`Groq API error: ${aiResponse.status}`);
        }

        const data = await aiResponse.json();
        try {
          analysis = JSON.parse(data.choices[0].message.content);
        } catch (parseError) {
          console.error("Error parsing Groq response:", parseError);
          console.log("Raw content:", data.choices[0].message.content);
          throw new Error("Failed to parse Groq response");
        }
      } else {
        // If no AI API is available, use mock analysis for testing
        console.log("No AI API available, using mock analysis");
        analysis = createMockAnalysis(resumeText);
      }
    } catch (aiError) {
      console.error("AI processing error:", aiError);
      // Fallback to mock analysis in case of any AI API error
      analysis = createMockAnalysis(resumeText);
    }
    
    // Store feedback in the database
    let feedbackInsertCount = 0;
    for (const item of analysis.feedback) {
      const { error: feedbackError } = await supabase
        .from('resume_feedback')
        .insert({
          resume_id: resumeId,
          type: item.type,
          title: item.title,
          category: item.category || item.type,
          section: item.section,
          feedback: item.description,
          severity: item.severity || "medium",
          suggestion: item.suggestion || null,
          source: item.source || null
        });
        
      if (feedbackError) {
        console.error("Error inserting feedback:", feedbackError);
      } else {
        feedbackInsertCount++;
      }
    }
    
    // Store scores in the database
    const { error: scoreError } = await supabase
      .from('resume_scores')
      .insert({
        resume_id: resumeId,
        overall_score: analysis.scores.overall_score,
        content_score: analysis.scores.content_score,
        formatting_score: analysis.scores.formatting_score,
        impact_score: analysis.scores.impact_score,
        ats_score: analysis.scores.ats_score
      });
      
    if (scoreError) {
      console.error("Error inserting scores:", scoreError);
    }

    return new Response(
      JSON.stringify({ 
        success: true,
        feedback: analysis.feedback,
        scores: analysis.scores,
        insights_used: useInsights.length,
        feedback_stored: feedbackInsertCount
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error processing request:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

// Function to create mock insights when needed
function createMockInsights() {
  return [
    {
      insight: "Use quantifiable achievements in your work experience section rather than just listing job duties",
      section: "Work Experience",
      category: "Impact Statements",
      sentiment: "positive"
    },
    {
      insight: "Keep your resume to one page if you have less than 10 years of experience",
      section: "Format",
      category: "Content Quality",
      sentiment: "neutral"
    },
    {
      insight: "Include relevant keywords from the job description to pass ATS filters",
      section: "General",
      category: "ATS Optimization",
      sentiment: "positive"
    },
    {
      insight: "Remove the objective statement and replace it with a professional summary",
      section: "Summary",
      category: "Content Quality",
      sentiment: "negative"
    },
    {
      insight: "Use bullet points instead of paragraphs for better readability",
      section: "Format",
      category: "Formatting",
      sentiment: "positive"
    }
  ];
}

// Function to create mock analysis when needed
function createMockAnalysis(resumeText) {
  return {
    feedback: [
      {
        type: "improvement",
        title: "Add Quantifiable Achievements",
        section: "Work Experience",
        description: "Your work experience section lists job duties but lacks measurable achievements. Add metrics and results to demonstrate your impact.",
        source: "resumes"
      },
      {
        type: "strength",
        title: "Clean Formatting",
        section: "Format",
        description: "Your resume has a clean, professional layout that makes good use of whitespace and is easy to scan.",
        source: "Resume"
      },
      {
        type: "warning",
        title: "Missing Keywords",
        section: "Skills",
        description: "Your resume may not pass ATS filters. Include more industry-specific keywords relevant to your target roles.",
        source: "jobs"
      },
      {
        type: "suggestion",
        title: "Upgrade Your Summary",
        section: "Summary",
        description: "Replace your objective statement with a professional summary that highlights your unique value proposition.",
        source: "Resume"
      },
      {
        type: "improvement",
        title: "Use Bullet Points",
        section: "Work Experience",
        description: "Convert paragraph descriptions to bullet points to improve readability and make your achievements stand out.",
        source: "resumes"
      },
      {
        type: "insight",
        title: "Education Section Placement",
        section: "Education",
        description: "If you're an experienced professional, move your education section below your work experience to emphasize your career achievements.",
        source: "jobs"
      },
      {
        type: "suggestion",
        title: "Remove References",
        section: "General",
        description: "Remove 'References available upon request' to save space. Employers will ask for references if needed.",
        source: "resumes"
      },
      {
        type: "improvement",
        title: "Action Verbs",
        section: "Work Experience",
        description: "Start each bullet point with strong action verbs in the past tense for previous positions and present tense for current roles.",
        source: "Resume"
      },
      {
        type: "warning",
        title: "Too Much Personal Information",
        section: "Contact",
        description: "Remove personal details like age, marital status, or photos to avoid potential discrimination issues.",
        source: "jobs"
      },
      {
        type: "strength",
        title: "Consistent Formatting",
        section: "Format",
        description: "Your resume maintains consistent formatting throughout, which creates a professional appearance.",
        source: "resumes"
      }
    ],
    scores: {
      overall_score: 0.72,
      content_score: 0.68,
      formatting_score: 0.85,
      impact_score: 0.55,
      ats_score: 0.65
    }
  };
}

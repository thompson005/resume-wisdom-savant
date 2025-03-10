
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

    if (!insights || insights.length === 0) {
      console.error("No insights found in database");
      return new Response(
        JSON.stringify({ error: "No insights available for analysis. Please run the Reddit scraper first." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Format insights for the AI prompt
    const insightsText = insights
      .map(i => `- Section: ${i.section}, Category: ${i.category}, Insight: "${i.insight}", Sentiment: ${i.sentiment}`)
      .join('\n');

    // Use Perplexity API first (if available) or fallback to Groq
    let aiResponse;
    let analysis;
    
    if (perplexityApiKey) {
      console.log("Using Perplexity API for resume analysis");
      aiResponse = await fetch("https://api.perplexity.ai/chat/completions", {
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
        throw new Error(`Perplexity API error: ${aiResponse.status}`);
      }

      const data = await aiResponse.json();
      analysis = JSON.parse(data.choices[0].message.content);
      
    } else if (groqApiKey) {
      console.log("Using Groq API for resume analysis");
      aiResponse = await fetch("https://api.groq.com/openai/v1/chat/completions", {
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
        const errorData = await aiResponse.text();
        console.error("Groq API error:", errorData);
        throw new Error(`Groq API error: ${aiResponse.status}`);
      }

      const data = await aiResponse.json();
      analysis = JSON.parse(data.choices[0].message.content);
      
    } else {
      throw new Error("No AI API key available (Perplexity or Groq)");
    }
    
    // Store feedback in the database
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
        scores: analysis.scores
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

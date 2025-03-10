
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
  
  const supabase = createClient(supabaseUrl, supabaseAnonKey);

  try {
    const { subreddit } = await req.json();
    
    if (!subreddit) {
      return new Response(
        JSON.stringify({ error: "Subreddit parameter is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Scraping insights from r/${subreddit}`);

    // Use Groq API to analyze Reddit content
    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
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
            content: "You are an expert in analyzing resume advice from Reddit. Extract key insights, categorize them, and determine sentiment."
          },
          {
            role: "user",
            content: `Extract 10 key resume insights from r/${subreddit}. For each insight, provide: 
            1. The insight itself (actionable advice)
            2. Which resume section it applies to (e.g., Summary, Work Experience, Education, Skills, Format, General)
            3. Category (e.g., ATS Optimization, Content Quality, Formatting, Impact Statements)
            4. Sentiment (positive, negative, neutral)
            Format your response as valid JSON with an array of objects.`
          }
        ],
        temperature: 0.7,
        max_tokens: 2048
      })
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error("Groq API error:", errorData);
      throw new Error(`Groq API error: ${response.status}`);
    }

    const data = await response.json();
    const insights = JSON.parse(data.choices[0].message.content);
    
    // Store insights in the database
    for (const insight of insights) {
      const { data: insertData, error } = await supabase
        .from('reddit_insights')
        .insert({
          subreddit: subreddit,
          insight: insight.insight,
          section: insight.section,
          category: insight.category,
          sentiment: insight.sentiment,
          source_url: `https://reddit.com/r/${subreddit}`
        });
        
      if (error) {
        console.error("Error inserting insight:", error);
      }
    }

    return new Response(
      JSON.stringify({ success: true, count: insights.length }),
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

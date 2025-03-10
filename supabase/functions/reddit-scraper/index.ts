
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
    const { subreddit } = await req.json();
    
    if (!subreddit) {
      return new Response(
        JSON.stringify({ error: "Subreddit parameter is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Scraping insights from r/${subreddit}`);

    // Fetch actual data from Reddit's JSON API
    const redditResponse = await fetch(`https://www.reddit.com/r/${subreddit}.json`);
    
    if (!redditResponse.ok) {
      throw new Error(`Reddit API error: ${redditResponse.status}`);
    }
    
    const redditData = await redditResponse.json();
    
    // Extract posts content for analysis
    const posts = redditData.data.children
      .filter(child => child.data && child.data.selftext)
      .map(child => ({
        title: child.data.title,
        content: child.data.selftext,
        url: `https://reddit.com${child.data.permalink}`
      }))
      .slice(0, 5); // Limit to 5 posts to avoid overloading the AI

    if (posts.length === 0) {
      console.log(`No valid posts found in r/${subreddit}`);
      return new Response(
        JSON.stringify({ success: false, message: "No valid posts found" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Compile post content for analysis
    const postsContent = posts
      .map(post => `Title: ${post.title}\nContent: ${post.content.substring(0, 1000)}...\nURL: ${post.url}`)
      .join('\n\n---------\n\n');

    // Use Perplexity API instead of Groq (preferred) or fallback to Groq if Perplexity key not available
    let aiResponse;
    let insights;
    
    if (perplexityApiKey) {
      console.log("Using Perplexity API for analysis");
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
              content: "You are an expert in analyzing resume advice from Reddit. Extract key insights, categorize them, and determine sentiment."
            },
            {
              role: "user",
              content: `I've collected the following resume discussions from r/${subreddit}:\n\n${postsContent}\n\nExtract 10 key resume insights from this content. For each insight, provide: 
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

      if (!aiResponse.ok) {
        throw new Error(`Perplexity API error: ${aiResponse.status}`);
      }

      const data = await aiResponse.json();
      insights = JSON.parse(data.choices[0].message.content);
      
    } else if (groqApiKey) {
      console.log("Using Groq API for analysis");
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
              content: "You are an expert in analyzing resume advice from Reddit. Extract key insights, categorize them, and determine sentiment."
            },
            {
              role: "user",
              content: `I've collected the following resume discussions from r/${subreddit}:\n\n${postsContent}\n\nExtract 10 key resume insights from this content. For each insight, provide: 
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

      if (!aiResponse.ok) {
        const errorData = await aiResponse.text();
        console.error("Groq API error:", errorData);
        throw new Error(`Groq API error: ${aiResponse.status}`);
      }

      const data = await aiResponse.json();
      insights = JSON.parse(data.choices[0].message.content);
      
    } else {
      throw new Error("No AI API key available (Perplexity or Groq)");
    }
    
    // Store insights in the database
    for (const insight of insights) {
      const sourceUrl = posts.length > 0 ? posts[0].url : `https://reddit.com/r/${subreddit}`;
      
      const { data: insertData, error } = await supabase
        .from('reddit_insights')
        .insert({
          subreddit: subreddit,
          insight: insight.insight,
          section: insight.section,
          category: insight.category,
          sentiment: insight.sentiment,
          source_url: sourceUrl
        });
        
      if (error) {
        console.error("Error inserting insight:", error);
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        count: insights.length, 
        posts_analyzed: posts.length,
        insights: insights // Include insights in the response for debugging
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

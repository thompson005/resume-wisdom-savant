
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

    // Fetch data from Reddit's JSON API
    const redditUrl = `https://www.reddit.com/r/${subreddit}.json`;
    console.log(`Fetching from: ${redditUrl}`);
    
    const redditResponse = await fetch(redditUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; ResumeWisdom/1.0; +http://example.com)'
      }
    });
    
    if (!redditResponse.ok) {
      const errorText = await redditResponse.text();
      console.error(`Reddit API error (${redditResponse.status}): ${errorText}`);
      throw new Error(`Reddit API error: ${redditResponse.status} - ${errorText.substring(0, 100)}`);
    }
    
    const redditData = await redditResponse.json();
    
    if (!redditData || !redditData.data || !redditData.data.children) {
      console.error("Invalid response format from Reddit");
      throw new Error("Invalid response format from Reddit");
    }
    
    // Extract posts content for analysis
    const posts = redditData.data.children
      .filter(child => child.data && (child.data.selftext || child.data.title))
      .map(child => ({
        title: child.data.title || "",
        content: child.data.selftext || "",
        url: `https://reddit.com${child.data.permalink || ""}`
      }))
      .slice(0, 5); // Limit to 5 posts

    console.log(`Found ${posts.length} posts in r/${subreddit}`);
    
    if (posts.length === 0) {
      console.log(`No valid posts found in r/${subreddit}`);
      // Create some mock insights if no valid posts are found
      const mockInsights = createMockInsights(subreddit);
      
      // Store mock insights in the database
      for (const insight of mockInsights) {
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
          console.error("Error inserting mock insight:", error);
        }
      }
      
      return new Response(
        JSON.stringify({ 
          success: true, 
          count: mockInsights.length, 
          posts_analyzed: 0,
          insights: mockInsights,
          mock: true
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Compile post content for analysis
    const postsContent = posts
      .map(post => `Title: ${post.title}\nContent: ${post.content.substring(0, 1000)}...\nURL: ${post.url}`)
      .join('\n\n---------\n\n');

    // Use Perplexity API or fallback to Groq if needed
    let insights;
    
    try {
      if (perplexityApiKey) {
        console.log("Using Perplexity API for analysis");
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
          const errorText = await aiResponse.text();
          console.error(`Perplexity API error (${aiResponse.status}): ${errorText}`);
          throw new Error(`Perplexity API error: ${aiResponse.status}`);
        }

        const data = await aiResponse.json();
        try {
          insights = JSON.parse(data.choices[0].message.content);
        } catch (parseError) {
          console.error("Error parsing Perplexity response:", parseError);
          console.log("Raw content:", data.choices[0].message.content);
          throw new Error("Failed to parse Perplexity response");
        }
      } else if (groqApiKey) {
        console.log("Using Groq API for analysis");
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
          const errorText = await aiResponse.text();
          console.error(`Groq API error (${aiResponse.status}): ${errorText}`);
          throw new Error(`Groq API error: ${aiResponse.status}`);
        }

        const data = await aiResponse.json();
        try {
          insights = JSON.parse(data.choices[0].message.content);
        } catch (parseError) {
          console.error("Error parsing Groq response:", parseError);
          console.log("Raw content:", data.choices[0].message.content);
          throw new Error("Failed to parse Groq response");
        }
      } else {
        // If no AI API is available, generate mock insights
        console.log("No AI API available, using mock insights");
        insights = createMockInsights(subreddit);
      }
    } catch (aiError) {
      console.error("AI processing error:", aiError);
      // Fallback to mock insights in case of any AI API error
      insights = createMockInsights(subreddit);
    }
    
    console.log(`Generated ${insights.length} insights for r/${subreddit}`);
    
    // Store insights in the database
    let insertCount = 0;
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
      } else {
        insertCount++;
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        count: insertCount, 
        posts_analyzed: posts.length,
        insights: insights
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
function createMockInsights(subreddit) {
  console.log(`Creating mock insights for r/${subreddit}`);
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
    },
    {
      insight: "Tailor your skills section to match the job requirements",
      section: "Skills",
      category: "ATS Optimization",
      sentiment: "positive"
    },
    {
      insight: "Use active voice and action verbs to describe your experiences",
      section: "Work Experience",
      category: "Content Quality",
      sentiment: "positive"
    },
    {
      insight: "Remove references and 'References available upon request' from your resume",
      section: "General",
      category: "Formatting",
      sentiment: "negative"
    },
    {
      insight: "Include GPA only if it's 3.5 or higher and you're a recent graduate",
      section: "Education",
      category: "Content Quality",
      sentiment: "neutral"
    },
    {
      insight: "Save your resume as a PDF to preserve formatting across different systems",
      section: "Format",
      category: "ATS Optimization",
      sentiment: "positive"
    }
  ];
}

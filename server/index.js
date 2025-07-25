const express = require("express")
const cors = require("cors")
const { OpenAI } = require("openai")
require("dotenv").config()

const app = express()
const PORT = process.env.PORT || 3000

// Initialize OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

// Middleware
app.use(
  cors({
    origin: ["chrome-extension://*", "http://localhost:*"],
    credentials: true,
  }),
)
app.use(express.json({ limit: "10mb" }))

// Health check endpoint
app.get("/health", (req, res) => {
  res.json({
    status: "OK",
    message: "Web Whispers backend is running",
    timestamp: new Date().toISOString(),
  })
})

// Main query endpoint
app.post("/api/query", async (req, res) => {
  try {
    const { query, pageContent, linkedPages, includeLinks } = req.body

    if (!query) {
      return res.status(400).json({ error: "Query is required" })
    }

    if (!process.env.OPENAI_API_KEY) {
      return res.status(500).json({
        error: "OpenAI API key not configured. Please set OPENAI_API_KEY in your .env file",
      })
    }

    // Prepare context from page content
    let context = `Current webpage content:\n${pageContent}\n\n`

    if (includeLinks && linkedPages && linkedPages.length > 0) {
      context += "Related pages content:\n"
      linkedPages.forEach((page, index) => {
        context += `Page ${index + 1} (${page.url}):\n${page.content}\n\n`
      })
    }

    // Create the prompt for GPT-4
    const systemPrompt = `You are Web Whispers, an AI assistant that helps users understand and analyze webpage content. 

Your role is to:
1. Answer questions about the provided webpage content accurately and helpfully
2. Provide insights, summaries, and explanations based on the content
3. Help users understand complex topics found on the page
4. Suggest related information or connections within the content
5. Be concise but thorough in your responses

Guidelines:
- Base your answers primarily on the provided content
- If the content doesn't contain enough information to answer a question, say so clearly
- Be helpful and conversational
- Format your responses clearly with proper structure when needed
- If asked about linked pages, use that information to provide more comprehensive answers`

    const userPrompt = `Based on the following webpage content, please answer this question: "${query}"

${context}

Please provide a helpful and accurate response based on the content above.`

    // Call OpenAI API
    const completion = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      max_tokens: 1000,
      temperature: 0.7,
    })

    const answer = completion.choices[0].message.content

    res.json({
      answer,
      usage: completion.usage,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error("Error processing query:", error)

    if (error.code === "insufficient_quota") {
      res.status(429).json({
        error: "OpenAI API quota exceeded. Please check your OpenAI account.",
      })
    } else if (error.code === "invalid_api_key") {
      res.status(401).json({
        error: "Invalid OpenAI API key. Please check your .env configuration.",
      })
    } else {
      res.status(500).json({
        error: "Internal server error. Please try again later.",
        details: process.env.NODE_ENV === "development" ? error.message : undefined,
      })
    }
  }
})

// Error handling middleware
app.use((err, req, res, next) => {
  console.error("Unhandled error:", err)
  res.status(500).json({
    error: "Internal server error",
    details: process.env.NODE_ENV === "development" ? err.message : undefined,
  })
})

// 404 handler
app.use("*", (req, res) => {
  res.status(404).json({ error: "Endpoint not found" })
})

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Web Whispers backend server running on http://localhost:${PORT}`)
  console.log(`📊 Health check: http://localhost:${PORT}/health`)

  if (!process.env.OPENAI_API_KEY) {
    console.warn("⚠️  WARNING: OPENAI_API_KEY not found in environment variables")
    console.log("   Please create a .env file with your OpenAI API key")
  }
})

import { type NextRequest, NextResponse } from "next/server"
import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from "@google/generative-ai"

// Initialize the Google Generative AI model
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!)

// Configure the model with appropriate safety settings
const model = genAI.getGenerativeModel({
  model: "gemini-1.5-pro",
  safetySettings: [
    {
      category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
      threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH,
    },
    {
      category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
      threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH,
    },
    {
      category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
      threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH,
    },
    {
      category: HarmCategory.HARM_CATEGORY_HARASSMENT,
      threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH,
    },
  ],
  generationConfig: {
    temperature: 0.2, // Lower temperature for more precise coding responses
    topP: 0.95,
    topK: 40,
  },
})

// System prompt for coding assistant
const SYSTEM_PROMPT = `
You are a coding assistant specialized in helping with programming tasks.
When asked to write code:
1. Always use proper formatting with appropriate indentation
2. Include language-specific syntax highlighting by using markdown code blocks with the language specified (e.g. \`\`\`javascript)
3. Add helpful comments to explain complex parts of the code
4. Provide brief explanations of how the code works
5. Focus on best practices and modern coding standards
6. If relevant, mention potential edge cases or improvements

For example, format JavaScript code like this:
\`\`\`javascript
// Function to calculate factorial
function factorial(n) {
  if (n <= 1) return 1;
  return n * factorial(n - 1);
}
\`\`\`

Keep responses concise and focused on the coding task at hand.
`

export async function POST(req: NextRequest) {
  try {
    const { messages } = await req.json()

    // Map existing messages to Gemini format preserving history
    const contents = messages.map((msg: any) => ({
      role: msg.role === "assistant" ? "model" : "user",
      parts: [{ text: msg.content }],
    }))
    
    // Inject system prompt into the very first message
    if (contents.length > 0) {
      if (contents[0].role === "user") {
        contents[0].parts[0].text = `${SYSTEM_PROMPT}\n\n${contents[0].parts[0].text}`
      } else {
        contents.unshift({ role: "user", parts: [{ text: SYSTEM_PROMPT }] })
      }
    } else {
      return NextResponse.json({
        response: "Hello! I'm your coding assistant. How can I help you with programming today?",
      })
    }

    const result = await model.generateContentStream({ contents })
    
    // Stream response back to client 
    const encoder = new TextEncoder()
    const readableStream = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of result.stream) {
            controller.enqueue(encoder.encode(chunk.text()))
          }
          controller.close()
        } catch (error) {
          console.error("Stream error:", error)
          controller.error(error)
        }
      }
    })
    
    return new Response(readableStream, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      }
    })
  } catch (error) {
    console.error("Error in chat API:", error)

    // Provide a fallback response if the API fails
    return NextResponse.json({
      response:
        "I'm sorry, I couldn't process that coding request. Could you try rephrasing or asking about a different programming topic?",
    })
  }
}


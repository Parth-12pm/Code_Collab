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

    // Get the last user message
    const lastUserMessage = messages.filter((msg: any) => msg.role === "user").pop()

    if (!lastUserMessage) {
      return NextResponse.json({
        response: "Hello! I'm your coding assistant. How can I help you with programming today?",
      })
    }

    // Use the content generation API with the system prompt
    const result = await model.generateContent({
      contents: [
        {
          role: "user",
          parts: [
            {
              text: `${SYSTEM_PROMPT}\n\nUser question: ${lastUserMessage.content}`,
            },
          ],
        },
      ],
    })

    const response = result.response.text()
    return NextResponse.json({ response })
  } catch (error) {
    console.error("Error in chat API:", error)

    // Provide a fallback response if the API fails
    return NextResponse.json({
      response:
        "I'm sorry, I couldn't process that coding request. Could you try rephrasing or asking about a different programming topic?",
    })
  }
}


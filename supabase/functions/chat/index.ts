import "jsr:@supabase/functions-js/edge-runtime.d.ts";

function getCorsHeaders(req: Request) {
  const origin = req.headers.get('origin') || '*';
  return {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Credentials': 'true',
  } as Record<string, string>;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: getCorsHeaders(req) });
  }

  try {
    const { messages, targetLang } = await req.json();
    
    console.log('🔍 Received messages:', JSON.stringify(messages, null, 2));

    if (!messages || !Array.isArray(messages)) {
      return new Response(
        JSON.stringify({ error: 'Messages array is required' }), 
        { 
          status: 400, 
          headers: { ...getCorsHeaders(req), 'Content-Type': 'application/json' } 
        }
      );
    }

    const GROQ_API_KEY = Deno.env.get('GROQ_API_KEY');
    
    if (!GROQ_API_KEY) {
      return new Response(
        JSON.stringify({ error: 'Groq API key not configured' }), 
        { 
          status: 500, 
          headers: { ...getCorsHeaders(req), 'Content-Type': 'application/json' } 
        }
      );
    }

    // Build system prompt - but prioritize user-provided messages when product context is present
    // Check if any message (system OR user) contains verified product data
    const hasProductContext = messages.some((msg: any) => 
      msg.content && (msg.content.includes('VERIFIED PRODUCT DATA') || msg.content.includes('━━━'))
    );
    
    // When product data is present, use ALL messages as-is from frontend
    // When no product data, add generic system prompt
    const apiMessages = hasProductContext 
      ? messages.map((msg: any) => ({ role: msg.role, content: msg.content }))
      : [
          { 
            role: 'system', 
            content: `You are a helpful shopping assistant AI for SmartShop. You help users:
- Analyze products from URLs (Amazon, eBay, etc.)
- Compare prices and features
- Summarize product reviews
- Provide buying recommendations
- Answer questions about products

Be conversational, helpful, and provide detailed product insights. Respond in ${targetLang || 'English'}.`
          },
          ...messages.filter((msg: any) => msg.role !== 'system').map((msg: any) => ({
            role: msg.role,
            content: msg.content
          }))
        ];

    // Call Groq API with updated model name
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${GROQ_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: apiMessages,
        temperature: hasProductContext ? 0.1 : 0.7,  // Low temp for product data = more focused
        max_tokens: 2048,
        stream: true,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('Groq API error:', error);
      throw new Error(`Groq API error: ${error}`);
    }

    // Groq returns OpenAI-compatible streaming
    return new Response(response.body, {
      headers: {
        ...getCorsHeaders(req),
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });

  } catch (error) {
    console.error('Chat error:', error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Unknown error' 
      }), 
      { 
        status: 500, 
        headers: { ...getCorsHeaders(req), 'Content-Type': 'application/json' } 
      }
    );
  }
});
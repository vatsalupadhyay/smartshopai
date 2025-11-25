import { useState, useRef, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MessageSquare, Send, Bot, User } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";

interface Message {
  role: "user" | "assistant";
  content: string;
}

interface ScrapedProduct {
  productTitle?: string;
  productPrice?: string;
  productDescription?: string;
  productImage?: string;
  reviews?: string[];
  logs?: string[];
}

export const Chatbot = () => {
  const { t, i18n } = useTranslation();
  const { toast } = useToast();
  
  const STORAGE_KEY = 'smartshop_chat_v1';

  const [messages, setMessages] = useState<Message[]>(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) return JSON.parse(raw) as Message[];
    } catch (e) {
      /* ignore */
    }
    return [
      {
        role: "assistant",
        content: t("chatbot.initialMessage", "Hello! I'm your SmartShop AI assistant. I can help you compare products, analyze reviews, and find the best deals. What are you looking for today?"),
      },
    ];
  });
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [productUrl, setProductUrl] = useState<string | undefined>(undefined);
  const [scrapedData, setScrapedData] = useState<ScrapedProduct | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
    } catch (e) {
      // ignore storage errors
    }
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = { role: "user", content: input };
    
    // Detect if user is providing a new product URL
    const urlMatch = input.match(/https?:\/\/[^\s]+/);
    const newProductUrl = urlMatch ? urlMatch[0] : undefined;
    
    // If new product URL detected and it's different from current, clear conversation
    if (newProductUrl && newProductUrl !== productUrl) {
      console.log('🔄 New product URL detected, clearing conversation history');
      setMessages([
        {
          role: "assistant",
          content: t("chatbot.initialMessage", "Hello! I'm your SmartShop AI assistant. I can help you compare products, analyze reviews, and find the best deals. What are you looking for today?"),
        },
        userMessage
      ]);
      setProductUrl(newProductUrl);
    } else {
      setMessages(prev => [...prev, userMessage]);
    }
    
    setInput("");
    setIsLoading(true);

    try {
      const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/chat`;
      console.log('Chat endpoint:', CHAT_URL);

      // Basic sanity checks for the configured supabase URL to produce a clearer error
      if (!import.meta.env.VITE_SUPABASE_URL || typeof import.meta.env.VITE_SUPABASE_URL !== 'string' || !import.meta.env.VITE_SUPABASE_URL.startsWith('http')) {
        const msg = `Supabase URL is not configured correctly. Current value: ${String(import.meta.env.VITE_SUPABASE_URL)}`;
        console.error(msg);
        toast({ title: t('common.error'), description: msg, variant: 'destructive' });
        setIsLoading(false);
        return;
      }
      type OutgoingMessage = { role: 'system' | 'user' | 'assistant'; content: string };
      // Build messages array from conversation history (don't include current userMessage yet)
      const payloadMessages: OutgoingMessage[] = [...messages.map(m => ({ role: m.role, content: m.content }))];
      
      // Only scrape if this is a NEW product URL (not a follow-up question)
      if (newProductUrl) {
        console.log('🔗 Scraping NEW product URL:', newProductUrl);
        try {
          const scrapeRes = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/analyze-reviews`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ?? import.meta.env.VITE_SUPABASE_ANON_KEY}`,
            },
            body: JSON.stringify({ url: newProductUrl, limit: 5 }),
          });
          if (scrapeRes.ok) {
            const scrapeData = await scrapeRes.json().catch(() => ({}));
            console.log('📦 Scraped product data:', scrapeData);
            setScrapedData(scrapeData); // Store for follow-up questions
            
            const metaParts: string[] = [];
            if (scrapeData.productTitle) metaParts.push(`Title: ${scrapeData.productTitle}`);
            if (scrapeData.productPrice) metaParts.push(`Price: ${scrapeData.productPrice}`);
            if (scrapeData.productDescription) metaParts.push(`Description: ${scrapeData.productDescription}`);
            if (scrapeData.reviews && Array.isArray(scrapeData.reviews) && scrapeData.reviews.length > 0) {
              metaParts.push(`Sample review: ${scrapeData.reviews[0].slice(0, 240)}`);
            }
            
            console.log('📋 Metadata parts to send:', metaParts);
            
            if (metaParts.length > 0) {
              // Add strong system message FIRST
              payloadMessages.push({
                role: 'system',
                content: `CRITICAL INSTRUCTION - READ CAREFULLY:
You MUST describe ONLY the product in the VERIFIED PRODUCT DATA section below.
DO NOT use your training knowledge about other products.
DO NOT substitute or mention different products.
If the title says "Polo Shirt", describe ONLY that polo shirt.
If it says "Earbuds", describe ONLY those earbuds.
The user has explicitly provided this product URL and expects information about THIS SPECIFIC PRODUCT.`
              });
              
              // Add user message with scraped data (this replaces the original user message)
              payloadMessages.push({
                role: 'user',
                content: `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📦 VERIFIED PRODUCT DATA (scraped from ${newProductUrl})
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

${metaParts.join('\n')}
${scrapeData.productImage ? `\nProduct Image: ${scrapeData.productImage}` : ''}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Based on the verified data above, please describe THIS product with:
**Product Overview:**
**Key Features:**
**Specifications:**

Additional context: ${userMessage.content}`
              });
              
              console.log('✅ Sending messages to LLM:', JSON.stringify(payloadMessages, null, 2));
            } else {
              payloadMessages.push({
                role: 'user',
                content: `I couldn't scrape product details from ${newProductUrl}. Please provide more information or try a different URL.\n\nUser question: ${userMessage.content}`
              });
            }

            // surface scraping logs to console (and optionally to UI via toast)
            if (scrapeData.logs && Array.isArray(scrapeData.logs) && scrapeData.logs.length > 0) {
              const logSnippet = scrapeData.logs.slice(0, 5).join('\n');
              console.log('Scrape logs:', logSnippet);
              // Optionally toast the logs
              toast({ title: 'Scraping Logs', description: logSnippet, duration: 5000 });
            }
          } else {
            payloadMessages.push({ role: 'user', content: `Product URL provided but scraping failed: ${newProductUrl}. User question: ${userMessage.content}` });
          }
        } catch (e) {
          console.warn('Scrape failed, continuing to chat:', e);
          payloadMessages.push({ role: 'user', content: `Product URL provided but scraping failed: ${newProductUrl}. User question: ${userMessage.content}` });
        }
      } else if (scrapedData && productUrl) {
        // Follow-up question about existing product - use cached scraped data
        console.log('💬 Follow-up question about:', productUrl);
        const metaParts: string[] = [];
        if (scrapedData.productTitle) metaParts.push(`Title: ${scrapedData.productTitle}`);
        if (scrapedData.productPrice) metaParts.push(`Price: ${scrapedData.productPrice}`);
        if (scrapedData.productDescription) metaParts.push(`Description: ${scrapedData.productDescription}`);
        
        if (metaParts.length > 0) {
          payloadMessages.push({
            role: 'system',
            content: `Context: The user is asking a follow-up question about this product:
${metaParts.join('\n')}
${scrapedData.productImage ? `Image: ${scrapedData.productImage}` : ''}

Answer their question based on this product context.`
          });
        }
        payloadMessages.push({ role: 'user', content: userMessage.content });
      } else {
        // No product URL - just add the user message
        payloadMessages.push({ role: 'user', content: userMessage.content });
      }

      const targetLang = (i18n.resolvedLanguage || i18n.language || 'en').split('-')[0];
      const publishableKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ?? import.meta.env.VITE_SUPABASE_ANON_KEY;
      if (!publishableKey) {
        const msg = 'Missing Supabase publishable/anon key. Set VITE_SUPABASE_PUBLISHABLE_KEY or VITE_SUPABASE_ANON_KEY.';
        console.error(msg);
        toast({ title: t('common.error'), description: msg, variant: 'destructive' });
        setIsLoading(false);
        return;
      }

      const response = await fetch(CHAT_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${publishableKey}`,
        },
        body: JSON.stringify({ messages: payloadMessages, targetLang }),
      });

      if (!response.ok) {
        // try to extract JSON error body for better messages
        let errText = "Failed to get response";
        try {
          const body = await response.text();
          if (body) {
            try {
              const parsed = JSON.parse(body);
              errText = parsed?.error || parsed?.message || body;
            } catch {
              errText = body;
            }
          }
  } catch (e) { console.warn('Failed to read error body', e); }

        if (response.status === 429) {
          throw new Error(`Rate limit exceeded. ${errText}`);
        }
        if (response.status === 402) {
          throw new Error(`Payment required. ${errText}`);
        }
        throw new Error(errText || "Failed to get response");
      }

      if (!response.body) {
        // no streaming body — try to read as JSON/text
        const text = await response.text().catch(() => "");
        const assistantText = text || t('chat.error.noResponse');
        setMessages(prev => [...prev, { role: 'assistant', content: assistantText }]);
      } else {
        const contentType = response.headers.get('content-type') || '';
        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let assistantContent = '';
        let buffer = '';

        // Add empty assistant message that will be updated
        setMessages(prev => [...prev, { role: 'assistant', content: '' }]);

        // If server uses SSE (data: ...), parse accordingly. If server sends raw JSON chunks/NDJSON, also attempt to parse.
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });

          // Try SSE-style lines first
          if (buffer.includes('\n')) {
            const lines = buffer.split('\n');
            buffer = lines.pop() || '';
            for (let line of lines) {
              if (line.endsWith('\r')) line = line.slice(0, -1);
              if (!line) continue;

              // SSE 'data: ' prefix
              if (line.startsWith('data: ')) {
                const jsonStr = line.slice(6).trim();
                if (jsonStr === '[DONE]') {
                  buffer = '';
                  break;
                }
                try {
                  const parsed = JSON.parse(jsonStr);
                  const content = parsed.choices?.[0]?.delta?.content as string | undefined;
                  if (content) {
                    assistantContent += content;
                    setMessages(prev => {
                      const newMessages = [...prev];
                      newMessages[newMessages.length - 1].content = assistantContent;
                      return newMessages;
                    });
                  }
                } catch (e) {
                  // ignore parse errors for this line
                  console.warn('SSE parse error', e);
                }
                continue;
              }

              // Try NDJSON/raw JSON per-line
              try {
                const parsed = JSON.parse(line);
                // handle both full response and streaming deltas
                const content = parsed.choices?.[0]?.delta?.content as string | undefined;
                const fullText = parsed.choices?.[0]?.message?.content as string | undefined;
                if (content || fullText) {
                  assistantContent += (content || fullText || '');
                  setMessages(prev => {
                    const newMessages = [...prev];
                    newMessages[newMessages.length - 1].content = assistantContent;
                    return newMessages;
                  });
                }
                continue;
              } catch {
                // not JSON — append as plain text
                assistantContent += line + '\n';
                setMessages(prev => {
                  const newMessages = [...prev];
                  newMessages[newMessages.length - 1].content = assistantContent;
                  return newMessages;
                });
              }
            }
          }
        }

        // Final buffer flush: attempt to parse remainder
        if (buffer.trim()) {
          try {
            if (buffer.startsWith('data: ')) {
              const jsonStr = buffer.slice(6).trim();
              if (jsonStr !== '[DONE]') {
                const parsed = JSON.parse(jsonStr);
                const content = parsed.choices?.[0]?.delta?.content as string | undefined;
                if (content) {
                  assistantContent += content;
                }
              }
            } else {
              const parsed = JSON.parse(buffer);
              const content = parsed.choices?.[0]?.delta?.content as string | undefined;
              const fullText = parsed.choices?.[0]?.message?.content as string | undefined;
              if (content || fullText) assistantContent += (content || fullText || '');
            }
          } catch (e) {
            // append raw remainder
            assistantContent += buffer;
          }

          setMessages(prev => {
            const newMessages = [...prev];
            newMessages[newMessages.length - 1].content = assistantContent;
            return newMessages;
          });
        }
      }
    } catch (error) {
      console.error("Chat error:", error);
      const errorMessage = error instanceof Error ? error.message : "Failed to send message";
      // Map known errors to localized messages
      let userMsg = errorMessage;
      if (errorMessage.includes('Rate limit')) {
        userMsg = t('chat.error.rateLimit');
      } else if (errorMessage.includes('Payment required')) {
        userMsg = t('chat.error.paymentRequired');
      } else if (errorMessage.includes('No response body')) {
        userMsg = t('chat.error.noResponse');
      } else if (errorMessage.includes('Failed to get response')) {
        userMsg = t('chat.error.failedResponse');
      }

      toast({
        title: t('common.error'),
        description: userMsg,
        variant: "destructive",
      });
      setMessages(prev => prev.slice(0, -1));
    } finally {
      setIsLoading(false);
    }
  };

  const handleClear = () => {
    const initial: Message[] = [
      { role: 'assistant', content: t('chatbot.initialMessage', "Hello! I'm your SmartShop AI assistant. I can help you compare products, analyze reviews, and find the best deals. What are you looking for today?") }
    ];
    setMessages(initial);
    setProductUrl(undefined);
    setScrapedData(null);
    try { localStorage.removeItem(STORAGE_KEY); } catch (e) { /* ignore */ }
  };

  return (
    <section className="py-24 px-4 md:px-6">
      <div className="container max-w-4xl">
        <div className="text-center space-y-4 mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-accent/10 border border-accent/20 mx-auto">
            <MessageSquare className="w-4 h-4 text-accent" />
            <span className="text-sm font-medium text-accent">{t("chatbot.badge", "AI-Powered Shopping Assistant")}</span>
          </div>
          <h2 className="text-4xl md:text-5xl font-bold tracking-tight">
            {t("chatbot.title")}{" "}
            <span className="bg-gradient-primary bg-clip-text text-transparent">
              {t("chatbot.subtitle")}
            </span>
          </h2>
          <p className="text-xl text-muted-foreground">
            {t("chatbot.description")}
          </p>
        </div>

        <Card className="shadow-elegant">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bot className="w-5 h-5 text-accent" />
              {t("chatbot.cardTitle", "SmartShop AI Assistant")}
            </CardTitle>
            <CardDescription>
              {t("chatbot.cardDescription", "Ask me anything about products, prices, or reviews")}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <ScrollArea className="h-[400px] pr-4" ref={scrollRef}>
              <div className="space-y-4">
                {messages.map((message, index) => (
                  <div
                    key={index}
                    className={`flex gap-3 ${
                      message.role === "user" ? "flex-row-reverse" : "flex-row"
                    }`}
                  >
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                      message.role === "assistant" 
                        ? "bg-gradient-accent" 
                        : "bg-gradient-primary"
                    }`}>
                      {message.role === "assistant" ? (
                        <Bot className="w-5 h-5 text-white" />
                      ) : (
                        <User className="w-5 h-5 text-white" />
                      )}
                    </div>
                    <div className={`flex-1 rounded-2xl px-4 py-3 ${
                      message.role === "assistant"
                        ? "bg-muted"
                        : "bg-primary text-primary-foreground"
                    }`}>
                      {/* Show product image if this is the first assistant message after scraping */}
                      {message.role === "assistant" && index === 1 && scrapedData?.productImage && (
                        <img 
                          src={scrapedData.productImage} 
                          alt={scrapedData.productTitle || 'Product'}
                          className="max-w-xs rounded-lg mb-3 border border-border"
                          onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                        />
                      )}
                      <div className="text-sm leading-relaxed whitespace-pre-wrap" dangerouslySetInnerHTML={{ 
                        __html: message.content
                          .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
                          .replace(/^- (.+)$/gm, '<li>$1</li>')
                          .replace(/(<li>.*<\/li>\n?)+/g, '<ul class="list-disc pl-4 my-2">$&</ul>')
                          .replace(/\n\n/g, '<br/><br/>')
                      }} />
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>

            <div className="flex gap-2 pt-4 border-t">
              <div className="flex-1">
                <Input
                  placeholder={t("chatbot.placeholder")}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && handleSend()}
                  disabled={isLoading}
                />
                <div className="flex gap-2 mt-2">
                  <Input placeholder={t('chatbot.productUrlPlaceholder')} value={productUrl || ''} onChange={(e) => setProductUrl(e.target.value || undefined)} />
                  <Button size="sm" variant="ghost" onClick={() => { if (productUrl) { toast({ title: t('chatbot.attachedTitle'), description: t('chatbot.attachedDesc') }); } else { toast({ title: t('chatbot.noUrlTitle'), description: t('chatbot.noUrlDesc') }); } }}>{t('chatbot.attach')}</Button>
                </div>
              </div>
              <Button 
                onClick={handleSend} 
                variant="accent" 
                size="icon"
                disabled={isLoading}
              >
                <Send className="w-4 h-4" />
              </Button>
              <Button onClick={handleClear} variant="ghost" size="icon" title={t('chatbot.clearChat')}>✕</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </section>
  );
};

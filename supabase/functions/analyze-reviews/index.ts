import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const CACHE_TTL_SECONDS = 300;
const RATE_LIMIT_WINDOW = 3600;
const RATE_LIMIT_MAX = 30;
const MAX_FETCH_REVIEWS = 200;

type CachePayload = { reviews?: string[]; logs?: string[] };

const g = globalThis as any;
g.__reviewCache = g.__reviewCache || new Map();
g.__rateLimit = g.__rateLimit || new Map();

const reviewCache = g.__reviewCache as Map<string, { ts: number; payload: CachePayload }>;
const rateLimitMap = g.__rateLimit as Map<string, number[]>;

function isRateLimited(clientIp: string) {
  try {
    const now = Date.now();
    const windowStart = now - RATE_LIMIT_WINDOW * 1000;
    const arr = rateLimitMap.get(clientIp) || [];
    const pruned = arr.filter((t) => t >= windowStart);
    if (pruned.length >= RATE_LIMIT_MAX) {
      rateLimitMap.set(clientIp, pruned);
      return true;
    }
    pruned.push(now);
    rateLimitMap.set(clientIp, pruned);
    return false;
  } catch (e) {
    console.warn('Rate limit check failed:', String(e));
    return false;
  }
}

// HTML entity decoder
function decodeHtml(html: string): string {
  const entities: { [key: string]: string } = {
    '&amp;': '&',
    '&lt;': '<',
    '&gt;': '>',
    '&quot;': '"',
    '&#39;': "'",
    '&nbsp;': ' ',
  };
  return html.replace(/&[#\w]+;/g, (entity) => entities[entity] || entity);
}

// Extract text from HTML using regex
function extractReviewsFromHtml(html: string, limit: number): string[] {
  const reviews = new Set<string>();
  
  // Amazon review body pattern - looks for review text in specific HTML structure
  // Pattern 1: data-hook="review-body"
  const reviewBodyPattern = /data-hook=["']review-body["'][^>]*>[\s\S]*?<span[^>]*>([\s\S]*?)<\/span>/gi;
  let match;
  
  while ((match = reviewBodyPattern.exec(html)) !== null && reviews.size < limit) {
    let text = match[1];
    // Remove HTML tags
    text = text.replace(/<[^>]+>/g, ' ');
    // Decode HTML entities
    text = decodeHtml(text);
    // Clean up whitespace
    text = text.replace(/\s+/g, ' ').trim();
    
    if (text.length > 30 && text.length < 1500) {
      reviews.add(text);
    }
  }
  
  // Fallback: Look for longer text blocks that might be reviews
  if (reviews.size < 5) {
    const textBlockPattern = />([^<]{100,1200}?[.!?])\s*</g;
    while ((match = textBlockPattern.exec(html)) !== null && reviews.size < limit) {
      let text = match[1].trim();
      text = decodeHtml(text);
      text = text.replace(/\s+/g, ' ');
      
      // Filter out navigation, headers, etc.
      const upperRatio = (text.match(/[A-Z]/g) || []).length / text.length;
      const hasCommonWords = /\b(the|and|was|for|with|this|that)\b/i.test(text);
      
      if (upperRatio < 0.4 && hasCommonWords && !text.includes('href=') && text.length > 50) {
        reviews.add(text);
      }
    }
  }
  
  return Array.from(reviews);
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { 
      status: 200,
      headers: corsHeaders 
    });
  }

  try {
    const clientIp = req.headers.get('x-forwarded-for') || 'unknown';
    
    if (isRateLimited(clientIp)) {
      return new Response(
        JSON.stringify({ error: 'Rate limit exceeded' }), 
        { 
          status: 429, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    const { url, reviews, limit = 20, page = 0 } = await req.json();
    console.log('Analyzing reviews for:', url);

    const SCRAPEDO_TOKEN = Deno.env.get('SCRAPEDO_API_TOKEN');
    const logs: string[] = [];
    
    async function fetchReviewsFromUrl(pageUrl: string, limit = 20) {
      try {
        let html: string | null = null;
        let fetchMethod = 'none';

        if (SCRAPEDO_TOKEN) {
          try {
            const sbUrl = `https://api.scrape.do/?token=${encodeURIComponent(SCRAPEDO_TOKEN)}&url=${encodeURIComponent(pageUrl)}`;
            console.log('Using scrape.do');
            logs.push('🔍 Attempting scrape.do');
            const res = await fetch(sbUrl, { 
              method: 'GET',
              headers: { 'Accept': 'text/html' }
            });
            if (res.ok) {
              html = await res.text();
              fetchMethod = 'scrape.do';
              logs.push(`✅ scrape.do successful (${html.length} chars)`);
            } else {
              logs.push(`❌ scrape.do failed: ${res.status}`);
            }
          } catch (e) {
            logs.push('❌ scrape.do error: ' + String(e));
          }
        }

        if (!html) {
          logs.push('🔍 Direct fetch: ' + pageUrl);
          const res = await fetch(pageUrl, { 
            method: 'GET',
            headers: { 
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
              'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
              'Accept-Language': 'en-US,en;q=0.5',
            }
          });
          if (!res.ok) {
            logs.push(`❌ Direct fetch failed: ${res.status}`);
            return { reviews: [], logs };
          }
          html = await res.text();
          fetchMethod = 'direct';
          logs.push(`✅ Direct fetch successful (${html.length} chars)`);
        }

        // Parse HTML using regex
        logs.push('🔍 Parsing HTML for reviews...');
        const extractedReviews = extractReviewsFromHtml(html, limit);
        
        logs.push(`✅ Extracted ${extractedReviews.length} reviews (${fetchMethod})`);
        
        if (extractedReviews.length > 0) {
          logs.push(`📝 Sample: ${extractedReviews[0].substring(0, 100)}...`);
        }
        
        return { reviews: extractedReviews, logs };
      } catch (e) {
        const errMsg = 'Failed to fetch: ' + String(e);
        logs.push(errMsg);
        console.error(errMsg);
        return { reviews: [], logs };
      }
    }

    let finalReviews: string[] = [];
    let scrapingLogs: string[] = [];

    const pageNum = Math.max(0, Number(page) || 0);
    const pageLimit = Math.max(1, Math.min(100, Number(limit) || 20));
    const cacheKey = url ? `${url}::f${MAX_FETCH_REVIEWS}` : null;

    if (reviews && Array.isArray(reviews) && reviews.length > 0) {
      finalReviews = reviews.map((r) => (typeof r === 'string' ? r : r.text || ''));
      scrapingLogs.push('Using provided reviews: ' + finalReviews.length);
    } else if (url) {
      if (cacheKey && reviewCache.has(cacheKey)) {
        const entry = reviewCache.get(cacheKey)!;
        if (Date.now() - entry.ts < CACHE_TTL_SECONDS * 1000) {
          scrapingLogs.push('🔁 Cache hit');
          finalReviews = entry.payload.reviews || [];
          scrapingLogs = scrapingLogs.concat(entry.payload.logs || []);
        } else {
          scrapingLogs.push('🧹 Cache expired');
          reviewCache.delete(cacheKey);
        }
      }

      if (finalReviews.length === 0) {
        const result = await fetchReviewsFromUrl(url, MAX_FETCH_REVIEWS);
        finalReviews = result.reviews;
        scrapingLogs = scrapingLogs.concat(result.logs || []);

        if (cacheKey && finalReviews.length > 0) {
          reviewCache.set(cacheKey, { ts: Date.now(), payload: { reviews: finalReviews, logs: scrapingLogs } });
          scrapingLogs.push(`💾 Cached ${finalReviews.length} reviews (TTL: ${CACHE_TTL_SECONDS}s)`);
        }
      }
    }

    function analyzeLocally(textReviews: string[]) {
      const positiveWords = ['good','great','excellent','amazing','perfect','love','loved','best','fantastic','recommend','works','happy','satisfied','wonderful','awesome'];
      const negativeWords = ['bad','terrible','awful','worst','disappoint','poor','broken','hate','problem','doesn\'t work','not work','return','useless','waste'];

      const total = textReviews.length;
      let fakeCount = 0;
      let sentimentSum = 0;
      const detailed: string[] = [];
      const seen = new Set<string>();

      for (let i = 0; i < textReviews.length; i++) {
        const r = (textReviews[i] || '').trim();
        if (!r) continue;
        const lower = r.toLowerCase();

        let pos = 0, neg = 0;
        for (const w of positiveWords) if (lower.includes(w)) pos++;
        for (const w of negativeWords) if (lower.includes(w)) neg++;
        const reviewSentiment = Math.max(0, Math.min(100, 50 + (pos - neg) * 15));
        sentimentSum += reviewSentiment;

        const suspiciousReasons: string[] = [];
        if (r.length < 25) suspiciousReasons.push('very short');
        if ((r.match(/!/g) || []).length >= 3) suspiciousReasons.push('excessive exclamation');
        if (/\b(best product ever|buy now|five stars|click here|limited time)\b/i.test(r)) suspiciousReasons.push('promotional');
        
        const key = r.replace(/\s+/g,' ').slice(0, 120);
        if (seen.has(key)) suspiciousReasons.push('duplicate');
        seen.add(key);

        if (suspiciousReasons.length >= 2) {
          fakeCount++;
          detailed.push(`Review ${i+1}: FAKE - ${suspiciousReasons.join(', ')}. "${r.slice(0,100)}..."`);
        } else {
          detailed.push(`Review ${i+1}: GENUINE. "${r.slice(0,100)}..."`);
        }
      }

      const real = total - fakeCount;
      const fakePct = total > 0 ? Math.round((fakeCount / total) * 100) : 0;
      const avgSent = total > 0 ? Math.round(sentimentSum / total) : 50;
      const overallSentiment = avgSent >= 60 ? 'positive' : avgSent <= 40 ? 'negative' : 'neutral';

      return {
        totalReviews: total,
        realReviews: real,
        fakeReviews: fakeCount,
        fakePercentage: fakePct,
        overallSentiment,
        sentimentScore: avgSent,
        summary: `Analysis complete: ${real} genuine reviews, ${fakeCount} suspicious reviews (${fakePct}% fake). Overall sentiment: ${overallSentiment} (${avgSent}/100).`,
        detailedAnalysis: detailed.join('\n')
      };
    }

    if (finalReviews.length > 0) {
      const analysis = analyzeLocally(finalReviews);
      const total = finalReviews.length;
      const start = pageNum * pageLimit;
      const paged = finalReviews.slice(start, start + pageLimit);

      return new Response(JSON.stringify({
        analysis,
        reviewsCount: total,
        page: pageNum,
        limit: pageLimit,
        reviews: paged,
        logs: scrapingLogs,
      }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ 
      analysis: {
        totalReviews: 0,
        realReviews: 0,
        fakeReviews: 0,
        fakePercentage: 0,
        overallSentiment: 'neutral',
        sentimentScore: 50,
        summary: 'No reviews found on this page. The page may not contain reviews, or they may be loaded dynamically with JavaScript.',
        detailedAnalysis: 'Could not extract reviews from the provided URL. Try: 1) Using the Scrape.do API for JavaScript-heavy pages, 2) Providing a direct link to the reviews section, 3) Manually copying reviews into the analysis.'
      },
      logs: scrapingLogs
    }), { 
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    });
  } catch (error) {
    console.error("Error:", error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : "Unknown error",
      details: "Failed to analyze reviews"
    }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
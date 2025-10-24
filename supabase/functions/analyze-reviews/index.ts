import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { url, reviews } = await req.json();

    console.log('Analyzing reviews for URL:', url);

    const SCRAPINGBEE_KEY = Deno.env.get('SCRAPINGBEE_API_KEY');
    const SCRAPEDO_TOKEN = Deno.env.get('SCRAPEDO_API_TOKEN');

    const logs: string[] = [];
    
    async function fetchReviewsFromUrl(pageUrl: string, limit = 20) {
      try {
        let html: string | null = null;
        let fetchMethod = 'none';

        // If a Scrape.do token is provided, use it to render JS and fetch the page
        if (SCRAPEDO_TOKEN) {
          try {
            const msg1 = '🔍 Scraping URL with scrape.do: ' + pageUrl;
            logs.push(msg1);
            console.log(msg1);
            
            const res = await fetch('https://api.scrape.do/', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ 
                token: String(SCRAPEDO_TOKEN), 
                url: pageUrl,
                render_js: true,
                wait: 3000
              }),
            });
            if (res.ok) {
              html = await res.text();
              fetchMethod = 'scrape.do';
              const msg2 = '✅ scrape.do fetch successful, HTML length: ' + html.length;
              logs.push(msg2);
              console.log(msg2);
              const msg3 = '📄 HTML Preview (first 1000 chars): ' + html.substring(0, 1000);
              logs.push(msg3);
              console.log(msg3);
            } else {
              const msg4 = '❌ scrape.do fetch failed, status: ' + res.status;
              logs.push(msg4);
              console.warn(msg4);
            }
          } catch (e) {
            const msg5 = '❌ scrape.do request failed: ' + String(e);
            logs.push(msg5);
            console.warn(msg5);
          }
        }

        // Fallback to direct fetch
        if (!html) {
          try {
            const msg6 = '🔍 Falling back to direct fetch: ' + pageUrl;
            logs.push(msg6);
            console.log(msg6);
            
            const res = await fetch(pageUrl, { method: 'GET' });
            if (!res.ok) {
              const msg7 = '❌ Direct fetch failed, status: ' + res.status;
              logs.push(msg7);
              console.warn(msg7);
              return { reviews: [], logs };
            }
            html = await res.text();
            fetchMethod = 'direct';
            const msg8 = '✅ Direct fetch successful, HTML length: ' + html.length;
            logs.push(msg8);
            console.log(msg8);
          } catch (e) {
            const msg9 = '❌ Direct fetch error: ' + String(e);
            logs.push(msg9);
            console.error(msg9);
            return { reviews: [], logs };
          }
        }

        // Parse using DOMParser
        const doc = new DOMParser().parseFromString(html, 'text/html');
        if (!doc) {
          const msg10 = '❌ DOMParser failed';
          logs.push(msg10);
          console.error(msg10);
          return { reviews: [], logs };
        }

        const found = new Set<string>();
        const extractedReviews: string[] = [];

        // For Amazon: look for spans inside review containers with data-hook="review"
        const reviewContainers = doc.querySelectorAll('[data-hook="review"]');
        const msg11 = '🔎 Found review containers with [data-hook="review"]: ' + reviewContainers.length;
        logs.push(msg11);
        console.log(msg11);
        
        for (const container of Array.from(reviewContainers)) {
          if (found.size >= limit) break;

          // Look for the review body text specifically
          const bodySpan = container.querySelector('[data-hook="review-body"] span');
          if (bodySpan) {
            let txt = bodySpan.textContent?.trim() || '';
            txt = txt.replace(/\s+/g, ' ').slice(0, 1200);
            
            if (txt.length > 30) {
              found.add(txt);
              const reviewMsg = `📝 Review ${extractedReviews.length + 1}: ${txt.substring(0, 150)}...`;
              logs.push(reviewMsg);
              console.log(reviewMsg);
              extractedReviews.push(txt);
            }
          }
        }

        const msg12 = `✅ Extracted ${found.size} reviews from primary selectors`;
        logs.push(msg12);
        console.log(msg12);

        // Fallback: if few reviews found, use regex to extract longer text blocks
        if (found.size < 5) {
          const msg13 = '🔄 Falling back to regex extraction (found < 5 reviews)';
          logs.push(msg13);
          console.log(msg13);
          
          const regex = />\s*([a-zA-Z][^<>]{60,1200}?[.!?])\s*</g;
          let match;
          let regexCount = 0;
          while ((match = regex.exec(html)) && found.size < limit) {
            const txt = match[1].trim().replace(/\s+/g, ' ');
            // Filter out likely non-review text (too much uppercase, numbers, etc.)
            const upperRatio = (txt.match(/[A-Z]/g) || []).length / txt.length;
            if (upperRatio < 0.4 && !txt.includes('href=') && txt.length > 30) {
              found.add(txt);
              regexCount++;
              const regexMsg = `📝 Regex Review ${regexCount}: ${txt.substring(0, 150)}...`;
              logs.push(regexMsg);
              console.log(regexMsg);
              extractedReviews.push(txt);
            }
          }
          const msg14 = `✅ Regex extraction found ${regexCount} additional reviews`;
          logs.push(msg14);
          console.log(msg14);
        }

        const msg15 = `🎯 Total reviews extracted: ${found.size} (method: ${fetchMethod})`;
        logs.push(msg15);
        console.log(msg15);
        
        return { reviews: Array.from(found).slice(0, limit), logs };
      } catch (e) {
        const errMsg = 'Failed to fetch reviews from url: ' + String(e);
        logs.push(errMsg);
        console.error(errMsg);
        return { reviews: [], logs };
      }
    }

    // If reviews are not provided, try scraping the URL
    let finalReviews: string[] = [];
    let scrapingLogs: string[] = [];
    if (reviews && Array.isArray(reviews) && reviews.length > 0) {
      finalReviews = reviews.map(r => (typeof r === 'string' ? r : r.text || ''));
    } else if (url) {
      const result = await fetchReviewsFromUrl(url, 20);
      finalReviews = result.reviews;
      scrapingLogs = result.logs;
    }

    // Local heuristic-based analysis (fast, deterministic)
    function analyzeLocally(textReviews: string[]) {
      const positiveWords = ['good','great','excellent','amazing','perfect','love','loved','best','fantastic','recommend','works','happy','satisfied'];
      const negativeWords = ['bad','terrible','awful','worst','disappoint','poor','broken','hate','problem','doesn\'t work','not work','return'];

      const total = textReviews.length;
      let fakeCount = 0;
      let sentimentSum = 0;
      const detailed: string[] = [];

      // simple similarity check map
      const seen = new Set<string>();

      for (let i = 0; i < textReviews.length; i++) {
        const r = (textReviews[i] || '').trim();
        if (!r) continue;
        const lower = r.toLowerCase();

        // sentiment score per review
        let pos = 0, neg = 0;
        for (const w of positiveWords) if (lower.includes(w)) pos++;
        for (const w of negativeWords) if (lower.includes(w)) neg++;
        const reviewSentiment = Math.max(0, Math.min(100, 50 + (pos - neg) * 20));
        sentimentSum += reviewSentiment;

        // heuristics for fake reviews
        const suspiciousReasons: string[] = [];
        if (r.length < 25) suspiciousReasons.push('very short review');
        const exclam = (r.match(/!/g) || []).length;
        if (exclam >= 3) suspiciousReasons.push('excessive exclamation');
        if (/\b(best product ever|buy now|five stars|5 stars|best product|highly recommend)\b/i.test(r)) suspiciousReasons.push('promotional language');
        if (/^[A-Z\s\W]{10,}$/.test(r) && r.length < 200) suspiciousReasons.push('all caps or unnatural casing');
        if ((r.match(/\b(\w+)\b/g) || []).length > 200) suspiciousReasons.push('very long and repetitive');

        // similarity / duplicate detection
        const key = r.replace(/\s+/g,' ').slice(0, 120);
        if (seen.has(key)) suspiciousReasons.push('duplicate or repeated review');
        seen.add(key);

        if (suspiciousReasons.length > 0) {
          fakeCount++;
          detailed.push(`Review ${i+1}: flagged as fake - ${suspiciousReasons.join('; ')}. Preview: "${r.slice(0,120)}"`);
        } else {
          detailed.push(`Review ${i+1}: looks genuine. Preview: "${r.slice(0,120)}"`);
        }
      }

      const real = total - fakeCount;
      const fakePct = total > 0 ? Math.round((fakeCount / total) * 100) : 0;
      const avgSent = total > 0 ? Math.round(sentimentSum / Math.max(1, total)) : 50;
      const overallSentiment = avgSent >= 60 ? 'positive' : avgSent <= 40 ? 'negative' : 'neutral';

      return {
        totalReviews: total,
        realReviews: real,
        fakeReviews: fakeCount,
        fakePercentage: fakePct,
        overallSentiment,
        sentimentScore: avgSent,
        summary: `Found ${real} likely genuine reviews and ${fakeCount} likely fake reviews (${fakePct}%). Average sentiment: ${overallSentiment} (${avgSent}/100).`,
        detailedAnalysis: detailed.join('\n')
      };
    }

    // If we have reviews from scraping or input, analyze locally and return
    if (finalReviews.length > 0) {
      const analysis = analyzeLocally(finalReviews);
      console.log('📊 Final Analysis:', JSON.stringify(analysis, null, 2));
      return new Response(JSON.stringify({ 
        analysis, 
        reviewsCount: finalReviews.length, 
        reviews: finalReviews.slice(0, 10),
        logs: scrapingLogs
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Fallback: if no reviews found, respond with helpful message
    return new Response(JSON.stringify({ analysis: {
      totalReviews: 0,
      realReviews: 0,
      fakeReviews: 0,
      fakePercentage: 0,
      overallSentiment: 'neutral',
      sentimentScore: 50,
      summary: 'No reviews found on the provided URL and no reviews were supplied.',
      detailedAnalysis: 'Ensure the product page has visible reviews. If reviews are loaded dynamically by JavaScript, consider providing the reviews array directly from the client or deploying a lightweight scraper that can execute JavaScript.'
    },
    logs: scrapingLogs
    }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  } catch (error) {
    console.error("Review analysis error:", error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : "Unknown error",
      details: "Failed to analyze reviews"
    }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

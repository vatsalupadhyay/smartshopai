import "jsr:@supabase/functions-js/edge-runtime.d.ts";

function getCorsHeaders(req: Request) {
  const origin = req.headers.get('origin') || '*';
  return {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Credentials': 'true',
  } as Record<string, string>;
}

function detectLanguage(sample: string) {
  // Very small heuristic: check for presence of common Spanish/French/German words, otherwise default to 'en'
  const s = sample.toLowerCase();
  if (/\b(el|la|los|las|que|para|por|con)\b/.test(s)) return 'es';
  if (/\b(le|la|les|que|pour|avec|pas)\b/.test(s)) return 'fr';
  if (/\b(der|die|das|und|nicht|mit|ist)\b/.test(s)) return 'de';
  return 'en';
}

function extractiveSummary(reviews: string[], maxSentences = 3) {
  // Build sentences and score them using a simple TF-IDF heuristic
  const sentences: string[] = [];
  for (const r of reviews) {
    const parts = r.split(/(?<=[.!?])\s+/g).map(s => s.trim()).filter(Boolean);
    for (const p of parts) sentences.push(p);
  }

  if (sentences.length === 0) return '';

  const tokenize = (s: string) => s.toLowerCase().replace(/[^a-z0-9\u00C0-\u017F\s]/g, '').split(/\s+/).filter(Boolean);

  const tf: Record<string, number> = {};
  const df: Record<string, number> = {};
  for (const s of sentences) {
    const seen = new Set<string>();
    for (const w of tokenize(s)) {
      tf[w] = (tf[w] || 0) + 1;
      if (!seen.has(w)) { df[w] = (df[w] || 0) + 1; seen.add(w); }
    }
  }

  const N = sentences.length;
  const scores = sentences.map(s => {
    const words = tokenize(s);
    let score = 0;
    for (const w of words) {
      const idf = Math.log(1 + N / (1 + (df[w] || 0)));
      score += (tf[w] || 0) * idf;
    }
    return score / Math.max(1, words.length);
  });

  // choose top scoring sentences and preserve original order
  const idxs = scores.map((sc, i) => ({ sc, i })).sort((a, b) => b.sc - a.sc).slice(0, maxSentences).sort((a, b) => a.i - b.i).map(x => x.i);
  return idxs.map(i => sentences[i]).join(' ');
}

function normalizePhrase(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9\s]/g, '').replace(/\s+/g, ' ').trim().replace(/\b(its|it's)\b/g, '');
}

function extractProsCons(reviews: string[]) {
  // tokenization and stopword list
  const stop = new Set(['the','and','a','an','of','to','for','with','is','it','this','that','on','in','was','are','be','as','its','i','my','we','you']);
  const tokenize = (s: string) => s.toLowerCase().replace(/[^a-z0-9\s]/g,'').split(/\s+/).filter(Boolean);

  // candidate n-grams (1-3) frequency and context sentiment counts
  const candidates: Record<string, { count: number; pos: number; neg: number; examples: string[] }> = {};

  const positiveSeeds = ['good','great','excellent','love','recommend','works','happy','easy','comfortable','perfect','amazing','best'];
  const negativeSeeds = ['bad','terrible','awful','worst','disappoint','poor','broken','hate','problem','return','expensive','disappointed'];

  for (const review of reviews) {
    const lowered = review.toLowerCase();
    const sentences = review.split(/(?<=[.!?])\s+/g).map(s => s.trim()).filter(Boolean);

    for (const sent of sentences) {
      const toks = tokenize(sent).filter(w => !stop.has(w));
      const n = toks.length;
      // build n-grams
      for (let i = 0; i < n; i++) {
        for (let len = 1; len <= 3 && i + len <= n; len++) {
          const gram = toks.slice(i, i + len).join(' ');
          if (gram.length < 2) continue;
          const norm = normalizePhrase(gram);
          if (norm.split(' ').some(w => w.length <= 1)) continue;
          const ctx = lowered;
          const isPos = positiveSeeds.some(s => ctx.includes(s));
          const isNeg = negativeSeeds.some(s => ctx.includes(s));
          const entry = candidates[norm] || { count: 0, pos: 0, neg: 0, examples: [] };
          entry.count += 1;
          if (isPos) entry.pos += 1;
          if (isNeg) entry.neg += 1;
          if (entry.examples.length < 3) entry.examples.push(sent.trim());
          candidates[norm] = entry;
        }
      }
    }
  }

  // dedupe by collapsing substrings (prefer longer phrases)
  const items = Object.entries(candidates).map(([term, v]) => ({ term, ...v }));
  items.sort((a,b) => b.count - a.count || b.term.length - a.term.length);

  const chosen: { term: string; count: number; pos: number; neg: number; examples: string[] }[] = [];
  const used = new Set<string>();
  for (const it of items) {
    if (used.has(it.term)) continue;
    // mark substrings used
    for (const other of items) {
      if (other.term.includes(it.term) || it.term.includes(other.term)) {
        // if the other is longer and has similar count, prefer longer
        if (other.term.length > it.term.length && other.count >= it.count) used.add(it.term);
      }
    }
    if (!used.has(it.term)) {
      chosen.push(it);
      used.add(it.term);
      if (chosen.length >= 15) break;
    }
  }

  // score terms as pro or con by comparing pos vs neg counts and total
  const pros = chosen.filter(c => c.pos >= c.neg && c.pos > 0).slice(0,8).map(c => ({ term: c.term, count: c.count, examples: c.examples }));
  const cons = chosen.filter(c => c.neg > c.pos).slice(0,8).map(c => ({ term: c.term, count: c.count, examples: c.examples }));

  // fallback: if no pros/cons found, use highest-frequency phrases as neutral pros
  if (pros.length === 0) pros.push(...chosen.slice(0,5).map(c => ({ term: c.term, count: c.count, examples: c.examples })));
  return { pros, cons };
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: getCorsHeaders(req) });

  try {
    const { reviews, targetLang } = await req.json();
    if (!Array.isArray(reviews) || reviews.length === 0) {
      return new Response(JSON.stringify({ error: 'reviews array required' }), { status: 400, headers: { ...getCorsHeaders(req), 'Content-Type': 'application/json' } });
    }

    const sample = reviews.slice(0, 3).join(' ');
    const detected = detectLanguage(sample);
    const summary = extractiveSummary(reviews, 3);
    const { pros, cons } = extractProsCons(reviews);

    // Translate summary if targetLang is different from detected language
    let translated = null;
    if (targetLang && targetLang !== detected && summary) {
      const GROQ_API_KEY = Deno.env.get('GROQ_API_KEY');
      if (GROQ_API_KEY) {
        try {
          const langNames: Record<string, string> = {
            'en': 'English',
            'es': 'Spanish',
            'fr': 'French',
            'de': 'German'
          };
          
          const targetLangName = langNames[targetLang] || targetLang;
          
          const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${GROQ_API_KEY}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              model: 'llama-3.3-70b-versatile',
              messages: [
                {
                  role: 'system',
                  content: `You are a professional translator. Translate the following product review summary to ${targetLangName}. Preserve the meaning and tone. Only return the translation, nothing else.`
                },
                {
                  role: 'user',
                  content: summary
                }
              ],
              temperature: 0.3,
              max_tokens: 500,
            }),
          });

          if (response.ok) {
            const data = await response.json();
            translated = data.choices?.[0]?.message?.content?.trim() || null;
          }
        } catch (e) {
          console.warn('Translation failed:', e);
          // Fall back to original summary if translation fails
          translated = null;
        }
      }
    }

    return new Response(JSON.stringify({
      languageDetected: detected,
      summary: summary,
      translatedSummary: translated,
      pros,
      cons,
      inputCount: reviews.length,
    }), { headers: { ...getCorsHeaders(req), 'Content-Type': 'application/json' } });
  } catch (error) {
    console.error('summarize-reviews error:', error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : 'unknown' }), { status: 500, headers: { ...getCorsHeaders(req), 'Content-Type': 'application/json' } });
  }
});

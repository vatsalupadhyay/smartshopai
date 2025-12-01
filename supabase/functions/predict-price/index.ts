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

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: getCorsHeaders(req) });
  }

  try {
    const { prices, days = 7 } = await req.json();

    if (!Array.isArray(prices) || prices.length < 3) {
      return new Response(JSON.stringify({ error: 'Please provide at least 3 historical price points: [{ts, price}, ...]' }), {
        status: 400,
        headers: { ...getCorsHeaders(req), 'Content-Type': 'application/json' },
      });
    }

    // Normalize into simple arrays. If timestamps are present, keep them for predicted timestamps.
    const pts = prices.map((p: unknown) => {
      const obj = p as Record<string, unknown>;
      const ts = typeof obj.ts === 'number' ? (obj.ts as number) : null;
      const price = Number(String(obj.price));
      return { ts, price };
    });

    // Use index-based linear regression (x = 0..n-1) for stability across timestamps
    const n = pts.length;
    const xs = pts.map((_, i) => i);
    const ys = pts.map((p) => p.price);

    const meanX = xs.reduce((a, b) => a + b, 0) / n;
    const meanY = ys.reduce((a, b) => a + b, 0) / n;

    let num = 0;
    let den = 0;
    for (let i = 0; i < n; i++) {
      num += (xs[i] - meanX) * (ys[i] - meanY);
      den += (xs[i] - meanX) ** 2;
    }
    const slope = den === 0 ? 0 : num / den;
    const intercept = meanY - slope * meanX;

    // Predictions for next `days` indices (n .. n+days-1)
    const preds: { ts: number | null; price: number }[] = [];
    const lastTs = pts[n - 1].ts;
    const oneDay = 24 * 60 * 60 * 1000;
    for (let d = 0; d < days; d++) {
      const x = n + d;
      const price = slope * x + intercept;
      const ts = lastTs ? lastTs + (d + 1) * oneDay : null;
      preds.push({ ts, price: Number(price.toFixed(2)) });
    }

    // Compute RMSE on training data as a proxy for confidence
    const residuals = ys.map((y, i) => y - (slope * xs[i] + intercept));
    const mse = residuals.reduce((a, b) => a + b * b, 0) / n;
    const rmse = Math.sqrt(mse);
    // Map RMSE to a confidence score: lower rmse -> higher confidence. This is heuristic.
    const avgPrice = meanY || 1;
    const relError = Math.min(1, rmse / avgPrice);
    const confidence = Math.round((1 - relError) * 100);

    const predictedAvg = preds.reduce((a, b) => a + b.price, 0) / preds.length;
    const lastPrice = ys[ys.length - 1];
    const pctChange = ((predictedAvg - lastPrice) / lastPrice) * 100;
    let recommendation = 'hold';
    if (pctChange <= -2) recommendation = 'wait';
    else if (pctChange >= 2) recommendation = 'buy';

    const trend = pctChange > 0 ? 'up' : pctChange < 0 ? 'down' : 'flat';

    return new Response(JSON.stringify({
      model: 'linear_regression_index',
      slope,
      intercept,
      rmse,
      confidence,
      predictedAvg: Number(predictedAvg.toFixed(2)),
      lastPrice: Number(lastPrice.toFixed(2)),
      pctChange: Number(pctChange.toFixed(2)),
      recommendation,
      trend,
      predictions: preds,
      inputCount: n,
    }), { headers: { ...getCorsHeaders(req), 'Content-Type': 'application/json' } });
  } catch (error) {
    console.error('predict-price error:', error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : 'unknown' }), { status: 500, headers: { ...getCorsHeaders(req), 'Content-Type': 'application/json' } });
  }
});

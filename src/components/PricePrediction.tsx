import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Line } from 'react-chartjs-2';
import { Chart, CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Legend, TimeScale } from 'chart.js';
import 'chartjs-adapter-date-fns';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

Chart.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Legend, TimeScale);

export const PricePrediction = () => {
  const { toast } = useToast();
  const { t } = useTranslation();
  const [days, setDays] = useState<number>(7);
  const [productUrl, setProductUrl] = useState<string>('');
  const [scrapedPrice, setScrapedPrice] = useState<number | null>(null);
  const [priceHistory, setPriceHistory] = useState<Array<{ ts: number; price: number }>>([]);
  const [scraping, setScraping] = useState(false);
  
  const now = Date.now();
  const oneDay = 24 * 60 * 60 * 1000;
  type PredictResult = {
    model: string;
    slope: number;
    intercept: number;
    rmse: number;
    confidence: number;
    predictedAvg: number;
    lastPrice: number;
    pctChange: number;
    recommendation: 'buy' | 'wait' | 'hold';
    trend: 'up' | 'down' | 'flat';
    predictions: { ts: number | null; price: number }[];
    inputCount: number;
  } | null;

  const [result, setResult] = useState<PredictResult>(null);
  const [loading, setLoading] = useState(false);

  const fetchCurrentPrice = async () => {
    if (!productUrl.trim()) {
      toast({ description: 'Please enter a product URL', variant: 'destructive' });
      return;
    }

    setScraping(true);
    try {
      const { data, error } = await supabase.functions.invoke('analyze-reviews', {
        body: { url: productUrl }
      });

      if (error) throw error;

      console.log('Scraped data:', data);
      console.log('Scraping logs:', data?.logs);

      if (data?.productPrice && data.productPrice !== null) {
        // Try to extract numeric price from string like "$99.99" or "99.99"
        const priceStr = String(data.productPrice);
        const priceMatch = priceStr.match(/[\d,]+\.?\d*/);
        if (priceMatch) {
          const price = parseFloat(priceMatch[0].replace(/,/g, ''));
          if (isNaN(price) || price <= 0) {
            throw new Error(`Invalid price value: ${priceStr}`);
          }
          setScrapedPrice(price);
          
          // Add to price history with current timestamp
          const newPricePoint = { ts: Date.now(), price };
          setPriceHistory([...priceHistory, newPricePoint]);
          
          toast({ description: `Current price: $${price.toFixed(2)} added to history` });
        } else {
          throw new Error(`Could not parse price from: ${priceStr}`);
        }
      } else {
        throw new Error(`No price found on this product page. The scraper may not support this website yet. Try Amazon, or check if the URL is correct.`);
      }
    } catch (err: unknown) {
      console.error('Price fetch error:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch price';
      toast({ description: errorMessage, variant: 'destructive' });
    } finally {
      setScraping(false);
    }
  };

  const handlePredict = async () => {
    if (priceHistory.length < 2) {
      toast({ 
        title: 'Not enough data', 
        description: 'Please fetch at least 2 price points by entering a product URL and clicking "Fetch Current Price" on different days', 
        variant: 'destructive' 
      });
      return;
    }

    setLoading(true);
    try {
      const publishableKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ?? import.meta.env.VITE_SUPABASE_ANON_KEY;
      if (!publishableKey) {
        throw new Error('Missing Supabase publishable/anon key. Set VITE_SUPABASE_PUBLISHABLE_KEY or VITE_SUPABASE_ANON_KEY.');
      }

      const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/predict-price`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${publishableKey}`,
        },
        body: JSON.stringify({ prices: priceHistory, days }),
      });

      if (!res.ok) {
        let errBody = '';
        try {
          const j = await res.json();
          errBody = JSON.stringify(j);
        } catch (_err) {
          try {
            errBody = await res.text();
          } catch (_e) {
            errBody = `HTTP ${res.status}`;
          }
        }
        throw new Error(errBody || `HTTP ${res.status}`);
      }

      const data = await res.json();
      setResult(data);
    } catch (e) {
      console.error(e);
      toast({ title: t('pricePrediction.predictionFailedTitle'), description: t('pricePrediction.predictionFailedDesc', { err: String(e) }), variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  // Prepare chart data combining historical and predicted
  const labels = priceHistory.map(p => p.ts);
  const histData = priceHistory.map(p => p.price);
  // filter out predictions that don't have timestamps (chart.js handles timestamps better when they are numbers)
  const filteredPredictions = (result?.predictions ?? []).filter((p) => p.ts !== null) as { ts: number; price: number }[];
  const predLabels = filteredPredictions.map((p) => p.ts);
  const predData = filteredPredictions.map((p) => p.price);

  const data = {
    labels: [...labels, ...predLabels],
    datasets: [
      { label: 'Historical Price', data: [...histData, ...Array(predData.length).fill(null)], borderColor: '#3b82f6', tension: 0.2 },
      { label: 'Predicted Price', data: [...Array(histData.length).fill(null), ...predData], borderColor: '#ef4444', tension: 0.2 },
    ],
  };

  // Chart options typed loosely for brevity
  const options = {
    responsive: true,
    plugins: { legend: { position: 'top' as const } },
    scales: { x: { type: 'time' as const, time: { unit: 'day' } }, y: { beginAtZero: false } },
  } as const;

  return (
    <div className="w-full max-w-7xl mx-auto px-4">
      {/* Header Section */}
      <div className="text-center mb-12 p-10">
        <h2 className=" text-[#06267c] text-4xl md:text-5xl font-bold mb-4">
          {t('pricePrediction.title')}</h2> <span className="text-xl text-muted-foreground max-w-2xl mx-auto">{t('pricePrediction.description')}</span>
        
      </div>

      <Card className="shadow-lg">
        <CardHeader className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-950 dark:to-pink-950">
          <CardTitle className="text-2xl opacity-0 h-0 overflow-hidden">Hidden Title</CardTitle>
          <CardDescription className="opacity-0 h-0 overflow-hidden">Hidden Description</CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
        <div className="space-y-6">
          {/* URL Input Section */}
          <div className="bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-950 dark:to-cyan-950 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
            <label className="text-sm font-semibold mb-2 block text-blue-900 dark:text-blue-100">
              🔗 Product URL
            </label>
            <div className="flex gap-3">
              <Input 
                type="text" 
                placeholder="Paste Amazon product link here..." 
                value={productUrl}
                onChange={(e) => setProductUrl(e.target.value)}
                className="flex-1 bg-white dark:bg-gray-900"
              />
              <Button 
                onClick={fetchCurrentPrice} 
                disabled={scraping} 
                className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-6 whitespace-nowrap"
              >
                {scraping ? (
                  <span className="flex items-center gap-2">
                    <span className="animate-spin">⏳</span> Fetching...
                  </span>
                ) : (
                  '📥 Fetch Price'
                )}
              </Button>
            </div>
            <p className="text-xs text-blue-700 dark:text-blue-300 mt-2 flex items-start gap-1">
              <span>💡</span>
              <span>Enter product URL and fetch its current price. Repeat on different days to build price history for accurate predictions.</span>
            </p>
          </div>

          {/* Latest Price Display */}
          {scrapedPrice && (
            <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950 dark:to-emerald-950 p-4 rounded-lg border-2 border-green-300 dark:border-green-700 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-green-700 dark:text-green-300 uppercase tracking-wide">Latest Fetched Price</p>
                  <p className="text-3xl font-bold text-green-800 dark:text-green-100 mt-1">
                    ${scrapedPrice.toFixed(2)}
                  </p>
                </div>
                <div className="text-5xl">✅</div>
              </div>
            </div>
          )}

          {/* Price History Display */}
          {priceHistory.length > 0 && (
            <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between mb-3">
                <label className="text-sm font-semibold text-gray-800 dark:text-gray-200">
                  📊 Price History
                </label>
                <span className="px-3 py-1 bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200 rounded-full text-xs font-bold">
                  {priceHistory.length} {priceHistory.length === 1 ? 'point' : 'points'}
                </span>
              </div>
              <div className="max-h-40 overflow-y-auto space-y-2">
                {priceHistory.map((p, i) => (
                  <div 
                    key={i} 
                    className="flex justify-between items-center px-4 py-2.5 bg-white dark:bg-gray-800 rounded-md shadow-sm hover:shadow-md transition-shadow border border-gray-200 dark:border-gray-700"
                  >
                    <span className="text-sm text-gray-600 dark:text-gray-400 flex items-center gap-2">
                      <span className="text-lg">📅</span>
                      {new Date(p.ts).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </span>
                    <span className="text-base font-bold text-gray-900 dark:text-gray-100">
                      ${p.price.toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Prediction Controls */}
          <div className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-950 dark:to-pink-950 p-4 rounded-lg border border-purple-200 dark:border-purple-800">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-2">
                <label className="text-sm font-semibold mb-2 block text-purple-900 dark:text-purple-100">
                  🔮 Forecast Period (Days)
                </label>
                <input 
                  type="number" 
                  min={1} 
                  max={30} 
                  value={days} 
                  onChange={(e) => setDays(Number(e.target.value))} 
                  className="w-full px-4 py-2.5 border-2 border-purple-300 dark:border-purple-700 rounded-md bg-white dark:bg-gray-900 font-medium text-lg focus:ring-2 focus:ring-purple-500" 
                />
              </div>
              <div className="flex items-end">
                <Button 
                  onClick={handlePredict} 
                  disabled={loading || priceHistory.length < 2} 
                  className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-bold py-2.5 text-base shadow-md hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <span className="flex items-center justify-center gap-2">
                      <span className="animate-spin">⏳</span>
                      {t('pricePrediction.predicting')}
                    </span>
                  ) : (
                    <span className="flex items-center justify-center gap-2">
                      <span>🎯</span>
                      {t('pricePrediction.predict')}
                    </span>
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Chart */}
        <div className="mt-6 bg-white dark:bg-gray-900 p-4 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm" style={{ height: 380 }}>
          <Line data={data} options={options} />
        </div>

        {/* Results */}
        {result && (
          <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-blue-50 dark:bg-blue-950 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
              <p className="text-xs font-medium text-blue-600 dark:text-blue-400 uppercase tracking-wide mb-1">Last Price</p>
              <p className="text-2xl font-bold text-blue-900 dark:text-blue-100">
                ${Number(result.lastPrice).toFixed(2)}
              </p>
            </div>
            
            <div className="bg-purple-50 dark:bg-purple-950 p-4 rounded-lg border border-purple-200 dark:border-purple-800">
              <p className="text-xs font-medium text-purple-600 dark:text-purple-400 uppercase tracking-wide mb-1">
                Predicted Avg ({days} days)
              </p>
              <p className="text-2xl font-bold text-purple-900 dark:text-purple-100">
                ${Number(result.predictedAvg).toFixed(2)}
              </p>
            </div>
            
            <div className={`p-4 rounded-lg border-2 ${
              result.trend === 'up' ? 'bg-red-50 dark:bg-red-950 border-red-300 dark:border-red-700' : 
              result.trend === 'down' ? 'bg-green-50 dark:bg-green-950 border-green-300 dark:border-green-700' : 
              'bg-gray-50 dark:bg-gray-900 border-gray-300 dark:border-gray-700'
            }`}>
              <p className="text-xs font-medium uppercase tracking-wide mb-1" style={{
                color: result.trend === 'up' ? '#991b1b' : result.trend === 'down' ? '#166534' : '#374151'
              }}>
                Price Trend
              </p>
              <p className="text-2xl font-bold flex items-center gap-2">
                <span className="text-3xl">
                  {result.trend === 'up' ? '📈' : result.trend === 'down' ? '📉' : '➡️'}
                </span>
                <span style={{
                  color: result.trend === 'up' ? '#991b1b' : result.trend === 'down' ? '#166534' : '#374151'
                }}>
                  {result.trend.toUpperCase()} {result.pctChange > 0 ? '+' : ''}{Number(result.pctChange).toFixed(2)}%
                </span>
              </p>
            </div>
            
            <div className={`p-4 rounded-lg border-2 ${
              result.recommendation === 'buy' ? 'bg-green-50 dark:bg-green-950 border-green-300 dark:border-green-700' :
              result.recommendation === 'wait' ? 'bg-yellow-50 dark:bg-yellow-950 border-yellow-300 dark:border-yellow-700' :
              'bg-blue-50 dark:bg-blue-950 border-blue-300 dark:border-blue-700'
            }`}>
              <p className="text-xs font-medium uppercase tracking-wide mb-1" style={{
                color: result.recommendation === 'buy' ? '#166534' : result.recommendation === 'wait' ? '#854d0e' : '#1e40af'
              }}>
                Recommendation
              </p>
              <p className="text-2xl font-bold flex items-center gap-2">
                <span className="text-3xl">
                  {result.recommendation === 'buy' ? '🛒' : result.recommendation === 'wait' ? '⏳' : '👁️'}
                </span>
                <span style={{
                  color: result.recommendation === 'buy' ? '#166534' : result.recommendation === 'wait' ? '#854d0e' : '#1e40af'
                }}>
                  {result.recommendation.toUpperCase()}
                </span>
              </p>
              <p className="text-xs mt-2 opacity-75">
                Confidence: {Number(result.confidence).toFixed(0)}%
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
    </div>
  );
};

export default PricePrediction;

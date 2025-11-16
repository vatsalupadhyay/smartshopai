import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Line } from 'react-chartjs-2';
import { Chart, CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Legend, TimeScale } from 'chart.js';
import 'chartjs-adapter-date-fns';
import { useToast } from '@/hooks/use-toast';

Chart.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Legend, TimeScale);

export const PricePrediction = () => {
  const { toast } = useToast();
  const { t } = useTranslation();
  const [days, setDays] = useState<number>(7);
  // demo historic prices: last 14 days
  const now = Date.now();
  const oneDay = 24 * 60 * 60 * 1000;
  const demoPrices = Array.from({ length: 14 }).map((_, i) => ({ ts: now - (13 - i) * oneDay, price: Number((100 + Math.sin(i / 2) * 5 + i * 0.2).toFixed(2)) }));

  const [prices, setPrices] = useState(demoPrices);
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

  const handlePredict = async () => {
    setLoading(true);
    try {
  // direct fetch to the Supabase Functions endpoint is used here
      // call function via fetch directly to Supabase Functions endpoint (publishable key)
      const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/predict-price`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({ prices, days }),
      });
      if (!res.ok) throw new Error(await res.text());
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
  const labels = prices.map(p => p.ts);
  const histData = prices.map(p => p.price);
  const predLabels = result?.predictions?.map((p) => p.ts) || [];
  const predData = result?.predictions?.map((p) => p.price) || [];

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
    <Card>
      <CardHeader>
        <CardTitle>{t('pricePrediction.title')}</CardTitle>
        <CardDescription>{t('pricePrediction.description')}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex gap-2 mb-4">
          <input type="number" min={1} max={30} value={days} onChange={(e) => setDays(Number(e.target.value))} className="px-2 py-1 border rounded" />
          <Button onClick={handlePredict} disabled={loading}>{loading ? t('pricePrediction.predicting') : t('pricePrediction.predict')}</Button>
        </div>

        <div style={{ height: 320 }}>
          <Line data={data} options={options} />
        </div>

        {result && (
          <div className="mt-4 space-y-2">
            <div>{t('pricePrediction.lastPrice', { price: result.lastPrice })}</div>
            <div>{t('pricePrediction.predictedAvg', { days, avg: result.predictedAvg })}</div>
            <div>{t('pricePrediction.trend', { trend: result.trend, pct: result.pctChange })}</div>
            <div>{t('pricePrediction.recommendation', { rec: result.recommendation, conf: result.confidence })}</div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default PricePrediction;

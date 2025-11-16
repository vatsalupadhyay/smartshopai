import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Shield, TrendingUp, AlertCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { DonutChart, PieChart } from "@/components/ui/simple-charts";

interface AnalysisResult {
  totalReviews: number;
  realReviews: number;
  fakeReviews: number;
  fakePercentage: number;
  overallSentiment: "positive" | "negative" | "neutral";
  sentimentScore: number;
  summary: string;
  detailedAnalysis: string;
}

export const ReviewDetection = () => {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<AnalysisResult | null>(null);
  const [scrapingLogs, setScrapingLogs] = useState<string[]>([]);
  const [extractedReviews, setExtractedReviews] = useState<string[]>([]);
  const { toast } = useToast();
  const { t } = useTranslation();
  const [summaryLang, setSummaryLang] = useState<string>('en');
  type SummaryResult = {
    languageDetected: string;
    summary: string;
    translatedSummary?: string | null;
    pros: { term: string; count: number }[];
    cons: { term: string; count: number }[];
    inputCount: number;
  } | null;
  const [summaryResult, setSummaryResult] = useState<SummaryResult>(null);

  const analyzeReviews = async () => {
    if (!url.trim()) {
      toast({
        title: t("reviewDetection.enterUrlError"),
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    setResults(null);
    setScrapingLogs([]);

    try {
      const { data, error } = await supabase.functions.invoke("analyze-reviews", {
        body: { url },
      });

      // surface any function invocation errors with details
      if (error) {
        console.error('analyze-reviews invocation error:', error);
        const errObj = error as unknown as { message?: string };
        throw new Error(errObj?.message || JSON.stringify(error));
      }

      console.log("Analysis results:", data);
      setResults(data.analysis);

      // Merge logs if present
      if (data.logs && Array.isArray(data.logs)) {
        setScrapingLogs((prev) => [...prev, ...data.logs]);
      }

      // Save extracted reviews separately and also append a summary log
      if (data.reviews && Array.isArray(data.reviews)) {
        setExtractedReviews(data.reviews as string[]);
        setScrapingLogs((prev) => [
          ...prev,
          `✅ Successfully extracted ${data.reviewsCount} reviews`,
          `📝 Sample reviews:`,
          ...((data.reviews as string[]).slice(0, 10).map((r: string, i: number) => `  ${i + 1}. ${r.substring(0, 120)}...`))
        ]);
      }

  // clear previous summary when new analysis runs
  setSummaryResult(null);

      toast({
        title: t("reviewDetection.analysisCompleteTitle"),
        description: t("reviewDetection.analysisCompleteDesc"),
      });
    } catch (error) {
      console.error("Analysis error:", error);
      const errorMsg = error instanceof Error ? error.message : String(error);
      toast({
        title: t("reviewDetection.analysisFailedTitle"),
        description: errorMsg || t("reviewDetection.analysisFailedDesc"),
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const summarizeReviews = async (lang = 'en') => {
    if (extractedReviews.length === 0) {
      toast({ title: t('reviewDetection.noReviewsTitle'), description: t('reviewDetection.noReviewsDesc'), variant: 'destructive' });
      return;
    }
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('summarize-reviews', { body: { reviews: extractedReviews, targetLang: lang } });
      if (error) throw error;
      setSummaryResult(data);
      toast({ title: t('reviewDetection.summaryReadyTitle'), description: t('reviewDetection.summaryReadyDesc', { lang: data.languageDetected }) });
    } catch (e) {
      toast({ title: t('reviewDetection.summaryFailedTitle'), description: t('reviewDetection.summaryFailedDesc', { err: String(e) }), variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="py-24 px-4 md:px-6 bg-muted/30">
      <div className="container max-w-4xl">
        <div className="text-center space-y-4 mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-accent/10 border border-accent/20 mx-auto">
            <Shield className="w-4 h-4 text-accent" />
            <span className="text-sm font-medium text-accent">
              {t("reviewDetection.title")}
            </span>
          </div>
          <h2 className="text-4xl md:text-5xl font-bold tracking-tight">
            {t("reviewDetection.title")}{" "}
            <span className="bg-gradient-primary bg-clip-text text-transparent">
              {t("reviewDetection.subtitle")}
            </span>
          </h2>
          <p className="text-xl text-muted-foreground">
            {t("reviewDetection.description")}
          </p>
        </div>

        <Card className="shadow-elegant">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-accent" />
              {t("reviewDetection.title")} {t("reviewDetection.subtitle")}
            </CardTitle>
            <CardDescription>
              {t("reviewDetection.description")}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex gap-2">
              <Input
                placeholder={t("reviewDetection.urlPlaceholder")}
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && analyzeReviews()}
              />
              <Button
                onClick={analyzeReviews}
                variant="accent"
                disabled={loading}
              >
                {loading ? t("reviewDetection.analyzing") : t("reviewDetection.analyze")}
              </Button>
            </div>

            {results && (
              <div className="space-y-6 animate-fade-in">
                <div className="grid md:grid-cols-3 gap-4">
                  <Card>
                    <CardContent className="pt-6">
                      <div className="text-center space-y-2">
                        <Shield className="w-8 h-8 text-green-500 mx-auto" />
                        <div className="text-3xl font-bold">{results.realReviews}</div>
                        <div className="text-sm text-muted-foreground">
                          {t("reviewDetection.realReviews")}
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="pt-6">
                      <div className="text-center space-y-2">
                        <AlertCircle className="w-8 h-8 text-red-500 mx-auto" />
                        <div className="text-3xl font-bold">{results.fakeReviews}</div>
                        <div className="text-sm text-muted-foreground">
                          {t("reviewDetection.fakeReviews")}
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="pt-6">
                      <div className="text-center space-y-2">
                        <div style={{ width: 120, height: 120 }}>
                          <DonutChart percentage={results.sentimentScore ?? 0} color={results.overallSentiment === 'negative' ? '#ef4444' : results.overallSentiment === 'positive' ? '#10b981' : '#f59e0b'} label={t("reviewDetection.overallSentiment")} />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Badge
                        variant={
                          results.overallSentiment === "positive"
                            ? "default"
                            : results.overallSentiment === "negative"
                            ? "destructive"
                            : "secondary"
                        }
                      >
                        {results.overallSentiment}
                      </Badge>
                      {t("reviewDetection.summary")}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p className="text-muted-foreground">{results.summary}</p>
                    <div className="p-4 bg-muted rounded-lg">
                      <p className="text-sm whitespace-pre-wrap">
                        {results.detailedAnalysis}
                      </p>
                    </div>
                    {/* Charts: Real vs Fake */}
                    <div className="pt-4">
                      <h4 className="text-sm font-medium mb-2">Distribution</h4>
                      <div className="flex items-center gap-6">
                        <div style={{ width: 220, height: 220 }}>
                          <PieChart labels={[t("reviewDetection.realReviews"), t("reviewDetection.fakeReviews")]} values={[results.realReviews ?? 0, results.fakeReviews ?? 0]} colors={["#10b981", "#ef4444"]} />
                        </div>
                        <div className="ml-4" style={{ width: 120, height: 120 }}>
                          <DonutChart percentage={results.fakePercentage ?? Math.round(((results.fakeReviews ?? 0) / Math.max(1, (results.realReviews ?? 0) + (results.fakeReviews ?? 0))) * 100)} color="#ef4444" label={t("reviewDetection.fakeReviews")} />
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {scrapingLogs.length > 0 && (
              <Card>
                <CardHeader>
                      <CardTitle>{t('reviewDetection.scrapingLogsTitle')}</CardTitle>
                    </CardHeader>
                <CardContent>
                    <div className="bg-gray-900 text-gray-100 p-4 rounded font-mono text-sm max-h-96 overflow-y-auto">
                    {scrapingLogs.map((log, idx) => (
                      <div key={idx} className="py-1">
                        {log}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

              {extractedReviews.length > 0 && (
                <Card>
                  <CardHeader className="flex items-center justify-between">
                        <div>
                          <CardTitle>{t('reviewDetection.extractedReviewsTitle')}</CardTitle>
                          <CardDescription>{t('reviewDetection.extractedReviewsDesc', { count: extractedReviews.length })}</CardDescription>
                        </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={async () => {
                          try {
                            await navigator.clipboard.writeText(extractedReviews.join('\n\n'));
                                toast({ title: t('reviewDetection.copiedTitle'), description: t('reviewDetection.copiedDesc', { count: extractedReviews.length }) });
                          } catch (e) {
                                toast({ title: t('reviewDetection.copyFailedTitle'), description: t('reviewDetection.copyFailedDesc'), variant: 'destructive' });
                          }
                        }}
                      >
                            {t('reviewDetection.copyAll')}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          const blob = new Blob([extractedReviews.join('\n\n')], { type: 'text/plain' });
                          const url = URL.createObjectURL(blob);
                          const a = document.createElement('a');
                          a.href = url;
                          a.download = 'reviews.txt';
                          document.body.appendChild(a);
                          a.click();
                          a.remove();
                          URL.revokeObjectURL(url);
                              toast({ title: t('reviewDetection.downloadedTitle'), description: t('reviewDetection.downloadedDesc', { count: extractedReviews.length }) });
                        }}
                      >
                            {t('reviewDetection.download')}
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="mb-4 flex items-center gap-2">
                      <label className="text-sm">{t('reviewDetection.summaryLanguageLabel')}</label>
                      <select value={summaryLang} onChange={(e) => setSummaryLang(e.target.value)} className="border px-2 py-1 rounded">
                        <option value="en">English</option>
                        <option value="es">Spanish</option>
                        <option value="fr">French</option>
                        <option value="de">German</option>
                      </select>
                      <Button size="sm" onClick={() => summarizeReviews(summaryLang)}>{t('reviewDetection.summary')}</Button>
                    </div>

                    {summaryResult && (
                      <div className="mb-4 p-4 bg-muted rounded">
                        <div className="text-sm text-muted-foreground">{t('reviewDetection.detectedLanguage', { lang: summaryResult.languageDetected })}</div>
                        <h4 className="font-medium mt-2">{t('reviewDetection.summary')}</h4>
                        <p className="mt-1 whitespace-pre-wrap">{summaryResult.summary}</p>

                        {summaryResult.pros?.length > 0 && (
                          <div className="mt-3">
            <h5 className="text-sm font-medium">{t('reviewDetection.topPros')}</h5>
          <div className="flex gap-2 mt-1 flex-wrap">{summaryResult.pros.map((p) => <span key={p.term} className="px-2 py-1 bg-green-100 rounded text-sm">{p.term} ({p.count})</span>)}</div>
                          </div>
                        )}

                        {summaryResult.cons?.length > 0 && (
                          <div className="mt-3">
                            <h5 className="text-sm font-medium">{t('reviewDetection.topCons')}</h5>
                            <div className="flex gap-2 mt-1 flex-wrap">{summaryResult.cons.map((c) => <span key={c.term} className="px-2 py-1 bg-red-100 rounded text-sm">{c.term} ({c.count})</span>)}</div>
                          </div>
                        )}
                      </div>
                    )}
                    <div className="space-y-3 max-h-96 overflow-y-auto">
                      {extractedReviews.map((r, i) => (
                        <div key={i} className="p-3 bg-background/60 rounded">
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1">
                              <div className="text-sm text-muted-foreground">{t('reviewDetection.reviewLabel', { n: i + 1 })}</div>
                              <div className="mt-1 text-sm whitespace-pre-wrap">{r}</div>
                            </div>
                            <div className="flex-shrink-0 ml-4">
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={async () => {
                                  try {
                                    await navigator.clipboard.writeText(r);
                                    toast({ title: t('reviewDetection.copiedTitle'), description: t('reviewDetection.copiedDesc', { count: i + 1 }) });
                                  } catch (e) {
                                    toast({ title: t('reviewDetection.copyFailedTitle'), description: t('reviewDetection.copyFailedDesc'), variant: 'destructive' });
                                  }
                                }}
                              >
                                {t('reviewDetection.copyAll')}
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
          </CardContent>
        </Card>
      </div>
    </section>
  );
};
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
  const { toast } = useToast();
  const { t } = useTranslation();

  const analyzeReviews = async () => {
    if (!url.trim()) {
      toast({
        title: "Error",
        description: "Please enter a product URL",
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

      if (error) throw error;

      console.log("Analysis results:", data);
      setResults(data.analysis);
      if (data.logs) {
        setScrapingLogs(data.logs);
      }
      
      // Log extracted reviews for display
      if (data.reviews) {
        setScrapingLogs([
          `✅ Successfully extracted ${data.reviewsCount} reviews`,
          `📝 Sample reviews:`,
          ...data.reviews.map((r: string, i: number) => `  ${i + 1}. ${r.substring(0, 100)}...`)
        ]);
      }

      toast({
        title: "Analysis Complete",
        description: "Review analysis has been completed successfully",
      });
    } catch (error) {
      console.error("Analysis error:", error);
      const errorMsg = error instanceof Error ? error.message : String(error);
      toast({
        title: "Analysis Failed",
        description: errorMsg || "Failed to analyze reviews",
        variant: "destructive",
      });
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
                  <CardTitle>🔍 Scraping Logs</CardTitle>
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
          </CardContent>
        </Card>
      </div>
    </section>
  );
};

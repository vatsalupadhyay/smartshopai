import { Button } from "@/components/ui/button";
import { ArrowRight, Sparkles } from "lucide-react";
import { useTranslation } from "react-i18next";
import heroImage from "@/assets/hero-bg.jpg";

export const Hero = () => {
  const { t } = useTranslation();
  return (
    <section className="relative min-h-[90vh] flex items-center justify-center overflow-hidden">
      {/* Background Image with Overlay */}
      <div className="absolute inset-0 z-0">
        <img
          src={heroImage}
          alt="AI Shopping Technology"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-background/95 via-background/80 to-background/95" />
      </div>

      {/* Content */}
      <div className="container relative z-10 px-4 md:px-6 py-20">
        <div className="flex flex-col items-center text-center space-y-8 max-w-4xl mx-auto">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-accent/10 border border-accent/20 backdrop-blur-sm">
            <Sparkles className="w-4 h-4 text-accent" />
            <span className="text-sm font-medium text-accent">{t("hero.badge", "AI-Powered Shopping Intelligence")}</span>
          </div>

          {/* Headline */}
          <h1 className="text-5xl md:text-7xl font-bold tracking-tight">
            {t("hero.title", "Shop Smarter with")} {" "}
            <span className="bg-gradient-primary bg-clip-text text-transparent">
              {t("hero.subtitle", "AI-Powered")}
            </span>{" "}
            {t("hero.titleSuffix", "Insights")}
          </h1>

          {/* Description */}
          <p className="text-xl md:text-2xl text-muted-foreground max-w-2xl leading-relaxed">
            {t("hero.description")}
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 pt-4">
            <Button variant="hero" size="lg" className="gap-2">
              {t("hero.cta", "Get Started Free")}
              <ArrowRight className="w-5 h-5" />
            </Button>
            <Button variant="outline" size="lg">
              {t("hero.seeHow", "See How It Works")}
            </Button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-8 pt-8 w-full max-w-2xl">
            <div className="flex flex-col items-center">
              <div className="text-3xl md:text-4xl font-bold bg-gradient-accent bg-clip-text text-transparent">99%</div>
              <div className="text-sm text-muted-foreground mt-1">{t("hero.stats.fakeReviewDetection")}</div>
            </div>
            <div className="flex flex-col items-center">
              <div className="text-3xl md:text-4xl font-bold bg-gradient-accent bg-clip-text text-transparent">24/7</div>
              <div className="text-sm text-muted-foreground mt-1">{t("hero.stats.priceTracking")}</div>
            </div>
            <div className="flex flex-col items-center">
              <div className="text-3xl md:text-4xl font-bold bg-gradient-accent bg-clip-text text-transparent">50+</div>
              <div className="text-sm text-muted-foreground mt-1">{t("hero.stats.languagesSupported")}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Decorative Elements */}
      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-border to-transparent" />
    </section>
  );
};

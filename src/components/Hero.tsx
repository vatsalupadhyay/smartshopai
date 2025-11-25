// Hero.tsx
import { Button } from "@/components/ui/button";
import { ArrowRight, Sparkles } from "lucide-react";
import { useTranslation } from "react-i18next";
import heroImage from "@/assets/hero-bg.jpg";
import Lottie from "lottie-react";
import heroAnimation from "@/assets/Animation - 1708343266966.json";

export const Hero = () => {
  const { t } = useTranslation();

  return (
    <section
      id="hero"
      className="relative py-0 md:py-0 overflow-hidden"
    >
      {/* Background Image */}
      <div className="absolute inset-0 -z-10">
        <img
          src={heroImage}
          alt="AI Shopping Technology"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-background/95 via-background/85 to-background/95" />
      </div>

      {/* Content */}
      <div className="w-full px-6 md:px-20 lg:px-40">
        <div className="flex flex-col items-center gap-5">

          {/* Main Grid */}
          <div className="w-full grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-10 items-center">

            {/* Left — Text */}
            <div className="flex flex-col items-start space-y-4">

              {/* Badge */}
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-accent/10 border border-accent/20 backdrop-blur-sm">
                <Sparkles className="w-5 h-5 text-accent" />
                <span className="text-sm font-semibold text-accent">
                  {t("hero.badge", "AI-Powered Shopping Intelligence")}
                </span>
              </div>

              {/* Heading */}
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight leading-[1.05]">
                {t("hero.title", "Smart Shopping with")}{" "}
                <span className="block bg-gradient-primary bg-clip-text text-transparent">
                  {t("hero.subtitle", "AI-Powered Intelligence")}
                </span>
                <span className="block">
                  {t("hero.titleSuffix", "Insights")}
                </span>
              </h1>

              {/* Description */}
              <p className="text-sm md:text-base text-muted-foreground max-w-xl leading-relaxed">
                {t(
                  "hero.description",
                  "Make informed buying decisions with real-time price tracking, fake review detection, and intelligent product comparisons"
                )}
              </p>

              {/* CTA Buttons */}
              <div className="flex flex-col sm:flex-row gap-3 pt-2">
                <Button
                  variant="hero"
                  size="lg"
                  className="gap-2 text-base px-6 py-3 h-auto"
                  onClick={() =>
                    document.getElementById("features")?.scrollIntoView({ behavior: "smooth" })
                  }
                >
                  {t("hero.cta", "Get Started Free")}
                  <ArrowRight className="w-5 h-5" />
                </Button>

                <Button
                  variant="outline"
                  size="lg"
                  className="text-base px-6 py-3 h-auto"
                  onClick={() =>
                    document
                      .getElementById("review-detection")
                      ?.scrollIntoView({ behavior: "smooth" })
                  }
                >
                  {t("hero.seeHow", "See How It Works")}
                </Button>
              </div>

            </div>

            {/* Right — Lottie */}
            <div className="flex justify-center lg:justify-end">
              <div className="w-full max-w-xl lg:max-w-2xl">
                <Lottie animationData={heroAnimation} loop autoplay />
              </div>
            </div>

          </div>

          {/* Stats (tighter spacing) */}
          <div className="grid grid-cols-3 gap-6 pt-2 w-full max-w-2xl mx-auto">
            <div className="flex flex-col items-center">
              <p className="text-3xl md:text-4xl font-bold bg-gradient-accent bg-clip-text text-transparent">99%</p>
              <p className="text-sm text-muted-foreground mt-1">{t("hero.stats.fakeReviewDetection", "Fake Review Detection")}</p>
            </div>

            <div className="flex flex-col items-center">
              <p className="text-3xl md:text-4xl font-bold bg-gradient-accent bg-clip-text text-transparent">24/7</p>
              <p className="text-sm text-muted-foreground mt-1">{t("hero.stats.priceTracking", "Price Tracking")}</p>
            </div>

            <div className="flex flex-col items-center">
              <p className="text-3xl md:text-4xl font-bold bg-gradient-accent bg-clip-text text-transparent">4</p>
              <p className="text-sm text-muted-foreground mt-1">{t("hero.stats.languagesSupported", "Languages Supported")}</p>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
};

export default Hero;

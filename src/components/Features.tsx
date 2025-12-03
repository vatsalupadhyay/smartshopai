import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingDown, Shield, MessageSquare, BarChart3, Globe, Zap } from "lucide-react";
import { useTranslation } from "react-i18next";
import priceTrackingImg from "@/assets/price-tracking.jpg";
import reviewDetectionImg from "@/assets/review-detection.jpg";
import aiAssistantImg from "@/assets/ai-assistant.jpg";

export const Features = () => {
  const { t } = useTranslation();
  
  const features = [
    {
      icon: TrendingDown,
      title: t("features.price.title", "Smart Price Tracking"),
      description: t("features.price.desc", "Monitor product prices across multiple stores and get notified when prices drop. AI predicts the best time to buy."),
      image: priceTrackingImg,
      gradient: "from-accent/20 to-primary/10",
    },
    {
      icon: Shield,
      title: t("features.review.title", "Fake Review Detection"),
      description: t("features.review.desc", "Our AI analyzes millions of reviews to identify fake ones, giving you authentic insights from real customers."),
      image: reviewDetectionImg,
      gradient: "from-primary/20 to-accent/10",
    },
    {
      icon: MessageSquare,
      title: t("features.assistant.title", "AI Shopping Assistant"),
      description: t("features.assistant.desc", "Chat with our AI to compare products, get recommendations, and make informed purchasing decisions."),
      image: aiAssistantImg,
      gradient: "from-accent/10 to-primary/20",
    },
    {
      icon: BarChart3,
      title: "Price History Analytics",
      description: "View detailed price trends and predictions to understand market patterns and save money.",
      gradient: "from-primary/10 to-accent/20",
    },
    {
      icon: Globe,
      title: "Multi-Language Support",
      description: "Read reviews and get insights in 50+ languages. No language barriers to smart shopping.",
      gradient: "from-accent/20 to-primary/10",
    },
    {
      icon: Zap,
      title: "Instant Alerts",
      description: "Get real-time notifications for price drops, stock availability, and important product updates.",
      gradient: "from-primary/20 to-accent/10",
    },
  ];
  return (
    <section id="features" className="py-24 px-4 md:px-6">
      <div className="container">
        <div className="text-center space-y-4 mb-16">
          <h2 className="text-4xl md:text-5xl font-bold tracking-tight">
            {t("features.title", "Everything You Need for")}{" "}
            <span className="bg-gradient-primary bg-clip-text text-transparent">
              {t("features.subtitle", "Smart Shopping")}
            </span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Everything you need to make informed purchasing decisions and save money online
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <Card 
                key={index} 
                className="group hover:shadow-elegant transition-all duration-300 hover:-translate-y-1 border-border/50 backdrop-blur-sm"
              >
                <CardHeader>
                  <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${feature.gradient} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300`}>
                    {feature.image ? (
                      <img src={feature.image} alt={feature.title} className="w-full h-full object-cover rounded-2xl" />
                    ) : (
                      <Icon className="w-8 h-8 text-primary" />
                    )}
                  </div>
                  <CardTitle className="text-xl">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-base leading-relaxed">
                    {feature.description}
                  </CardDescription>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </section>
  );
};

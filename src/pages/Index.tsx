import { Navigation } from "@/components/Navigation";
import { Hero } from "@/components/Hero";
import { Features } from "@/components/Features";
import { Dashboard } from "@/components/Dashboard";
import { PricePrediction } from "@/components/PricePrediction";
import { Chatbot } from "@/components/Chatbot";
import { ReviewDetection } from "@/components/ReviewDetection";
import { Footer } from "@/components/Footer";

const Index = () => {
  return (
    <div className="min-h-screen">
      <Navigation />
      <main>
        <Hero />
        <div id="features">
          <Features />
        </div>
        <div id="dashboard">
          <Dashboard />
        </div>
        <div id="price-prediction">
          <PricePrediction />
        </div>
        <ReviewDetection />
        <div id="assistant">
          <Chatbot />
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Index;

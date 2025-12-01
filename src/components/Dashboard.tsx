import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { TrendingDown, TrendingUp, Search, Plus, Star } from "lucide-react";

const mockProducts = [
  {
    id: 1,
    name: "Wireless Noise-Cancelling Headphones",
    currentPrice: 249.99,
    previousPrice: 299.99,
    trend: "down",
    predictedBest: "Buy Now",
    reviewScore: 4.5,
    fakeReviews: 12,
  },
  {
    id: 2,
    name: "Smart Watch Pro Series",
    currentPrice: 399.99,
    previousPrice: 379.99,
    trend: "up",
    predictedBest: "Wait 7 days",
    reviewScore: 4.8,
    fakeReviews: 3,
  },
  {
    id: 3,
    name: "4K Ultra HD Camera",
    currentPrice: 599.99,
    previousPrice: 599.99,
    trend: "stable",
    predictedBest: "Stable pricing",
    reviewScore: 4.6,
    fakeReviews: 8,
  },
];

export const Dashboard = () => {
  return (
    <section className="py-24 px-4 md:px-6 bg-gradient-hero">
      <div className="container">
        <div className="text-center space-y-4 mb-12">
          <h2 className="text-4xl md:text-5xl font-bold tracking-tight">
            Your Shopping{" "}
            <span className="bg-gradient-accent bg-clip-text text-transparent">
              Dashboard
            </span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Track your favorite products and get intelligent recommendations
          </p>
        </div>

        {/* Search Bar */}
        <Card className="mb-8 shadow-elegant">
          <CardContent className="pt-6">
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-5 h-5" />
                <Input 
                  placeholder="Add a product URL or search by name..." 
                  className="pl-10"
                />
              </div>
              <Button variant="accent" className="gap-2">
                <Plus className="w-4 h-4" />
                Track Product
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Tracked Products */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {mockProducts.map((product) => (
            <Card key={product.id} className="hover:shadow-elegant transition-all duration-300 hover:-translate-y-1">
              <CardHeader>
                <div className="flex items-start justify-between mb-2">
                  <CardTitle className="text-lg line-clamp-2">{product.name}</CardTitle>
                  <Badge 
                    variant={product.trend === "down" ? "default" : product.trend === "up" ? "destructive" : "secondary"}
                    className="gap-1"
                  >
                    {product.trend === "down" ? (
                      <TrendingDown className="w-3 h-3" />
                    ) : product.trend === "up" ? (
                      <TrendingUp className="w-3 h-3" />
                    ) : null}
                    {product.trend}
                  </Badge>
                </div>
                <CardDescription className="flex items-center gap-1">
                  <Star className="w-4 h-4 fill-accent text-accent" />
                  {product.reviewScore} • {product.fakeReviews} fake reviews detected
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-bold text-primary">
                    ${product.currentPrice}
                  </span>
                  {product.previousPrice !== product.currentPrice && (
                    <span className="text-muted-foreground line-through">
                      ${product.previousPrice}
                    </span>
                  )}
                </div>
                
                <div className="p-3 rounded-lg bg-accent/10 border border-accent/20">
                  <p className="text-sm font-medium text-accent">
                    AI Recommendation: {product.predictedBest}
                  </p>
                </div>

                <div className="flex gap-2">
                  <Button variant="outline" size="sm" className="flex-1">
                    View Details
                  </Button>
                  <Button variant="default" size="sm" className="flex-1">
                    Buy Now
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};

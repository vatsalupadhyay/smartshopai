import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Heart, ShoppingCart, Trash2, TrendingDown, TrendingUp } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { firebaseAuth } from "@/integrations/firebase/client";
import { Navigation } from "@/components/Navigation";

interface WishlistItem {
  id: string;
  product_id: string;
  product_name: string;
  product_price: number;
  product_image: string;
  product_category: string;
  product_description: string;
  initial_price: number;
  created_at: string;
}

export const Wishlist = () => {
  const [items, setItems] = useState<WishlistItem[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    fetchWishlistItems();
  }, []);

  const fetchWishlistItems = async () => {
    try {
      setLoading(true);
      
      // Try Firebase auth first
      let userId = firebaseAuth.currentUser?.uid;
      
      // If no Firebase user, try Supabase
      if (!userId) {
        const { data: { user } } = await supabase.auth.getUser();
        userId = user?.id;
      }
      
      if (!userId) {
        navigate('/auth');
        return;
      }

      const { data, error } = await supabase
        .from('wishlist_items')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      setItems(data || []);
    } catch (error) {
      console.error('Error fetching wishlist:', error);
      toast({
        title: "Error",
        description: "Failed to load your wishlist.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const removeFromWishlist = async (itemId: string, productName: string) => {
    try {
      const { error } = await supabase
        .from('wishlist_items')
        .delete()
        .eq('id', itemId);

      if (error) throw error;

      setItems(prev => prev.filter(item => item.id !== itemId));

      toast({
        title: "Removed from Wishlist",
        description: `${productName} has been removed from your wishlist.`,
      });
    } catch (error) {
      console.error('Error removing item:', error);
      toast({
        title: "Error",
        description: "Failed to remove item from wishlist.",
        variant: "destructive",
      });
    }
  };

  const calculatePriceChange = (current: number, initial: number) => {
    const change = ((current - initial) / initial) * 100;
    return {
      percentage: Math.abs(change).toFixed(1),
      isIncrease: change > 0,
      isDecrease: change < 0,
    };
  };

  if (loading) {
    return (
      <>
        <Navigation />
        <div className="min-h-screen py-24 px-4 md:px-6">
          <div className="container max-w-6xl">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <Card key={i} className="animate-pulse">
                  <div className="aspect-square bg-muted" />
                  <CardHeader>
                    <div className="h-4 bg-muted rounded w-3/4" />
                    <div className="h-3 bg-muted rounded w-1/2 mt-2" />
                  </CardHeader>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </>
    );
  }

  if (items.length === 0) {
    return (
      <>
        <Navigation />
        <div className="min-h-screen py-24 px-4 md:px-6 flex items-center justify-center">
          <div className="text-center space-y-4">
            <Heart className="w-16 h-16 text-muted-foreground mx-auto" />
            <h2 className="text-2xl font-bold">Your Wishlist is Empty</h2>
            <p className="text-muted-foreground max-w-md">
              Start adding items to your wishlist to track prices and save your favorite products!
            </p>
            <Button onClick={() => navigate('/store')} className="mt-4">
              Browse Products
            </Button>
          </div>
        </div>
      </>
    );
  }

  const totalSavings = items.reduce((sum, item) => {
    if (item.product_price < item.initial_price) {
      return sum + (item.initial_price - item.product_price);
    }
    return sum;
  }, 0);

  return (
    <>
      <Navigation />
      <div className="min-h-screen py-24 px-4 md:px-6">
        <div className="container max-w-6xl">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-2">
              My{" "}
              <span className="bg-gradient-primary bg-clip-text text-transparent">
                Wishlist
              </span>
            </h1>
            <p className="text-xl text-muted-foreground">
              {items.length} {items.length === 1 ? 'item' : 'items'} saved
            </p>
          </div>

          {/* Stats */}
          {totalSavings > 0 && (
            <Card className="mb-8 bg-gradient-to-r from-accent/10 to-primary/10 border-accent/20">
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <TrendingDown className="w-8 h-8 text-accent" />
                  <div>
                    <p className="text-sm text-muted-foreground">Potential Savings</p>
                    <p className="text-3xl font-bold text-accent">${totalSavings.toFixed(2)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Wishlist Items */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {items.map((item) => {
              const priceChange = calculatePriceChange(item.product_price, item.initial_price);
              
              return (
                <Card key={item.id} className="group hover:shadow-elegant transition-all duration-300 flex flex-col">
                  <CardHeader className="p-0">
                    <div className="aspect-square relative overflow-hidden rounded-t-lg bg-muted">
                      <img
                        src={item.product_image}
                        alt={item.product_name}
                        className="w-full h-full object-contain p-4"
                      />
                      <Button
                        variant="destructive"
                        size="icon"
                        className="absolute top-4 right-4 rounded-full"
                        onClick={() => removeFromWishlist(item.id, item.product_name)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </CardHeader>
                  
                  <CardContent className="flex-1 pt-4">
                    <CardTitle className="text-lg line-clamp-2 leading-tight mb-3">
                      {item.product_name}
                    </CardTitle>

                    <CardDescription className="line-clamp-2 mb-4">
                      {item.product_description}
                    </CardDescription>

                    <div className="space-y-2">
                      <div className="flex items-baseline gap-2">
                        <span className="text-3xl font-bold text-primary">
                          ${item.product_price.toFixed(2)}
                        </span>
                      </div>

                      {priceChange.isDecrease && (
                        <Badge variant="default" className="gap-1">
                          <TrendingDown className="w-3 h-3" />
                          {priceChange.percentage}% OFF
                        </Badge>
                      )}

                      {priceChange.isIncrease && (
                        <Badge variant="destructive" className="gap-1">
                          <TrendingUp className="w-3 h-3" />
                          {priceChange.percentage}% Increase
                        </Badge>
                      )}

                      {item.initial_price !== item.product_price && (
                        <p className="text-sm text-muted-foreground">
                          Initial: ${item.initial_price.toFixed(2)}
                        </p>
                      )}
                    </div>
                  </CardContent>

                  <CardFooter className="pt-0">
                    <Button variant="default" className="w-full gap-2">
                      <ShoppingCart className="w-4 h-4" />
                      Buy Now
                    </Button>
                  </CardFooter>
                </Card>
              );
            })}
          </div>
        </div>
      </div>
    </>
  );
};

import { useState, useEffect, useCallback } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Heart, ShoppingCart, Star, TrendingDown, Filter } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { firebaseAuth } from "@/integrations/firebase/client";
import { Navigation } from "@/components/Navigation";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface Product {
  id: number;
  title: string;
  price: number;
  description: string;
  category: string;
  image: string;
  rating: {
    rate: number;
    count: number;
  };
}

export const Store = () => {
  const [searchParams] = useSearchParams();
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [wishlistItems, setWishlistItems] = useState<Set<number>>(new Set());
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [categoryFilter, setCategoryFilter] = useState(searchParams.get('category') || 'all');
  const [typeFilter, setTypeFilter] = useState(searchParams.get('type') || 'all');
  const { toast } = useToast();
  const navigate = useNavigate();
  const { t } = useTranslation();

  const fetchProducts = useCallback(async () => {
    try {
      setLoading(true);
      
      // Fetch clothing products from different categories
      const clothingCategories = [
        'mens-shirts',
        'mens-shoes', 
        'womens-dresses',
        'womens-shoes',
        'womens-watches',
        'womens-bags',
        'womens-jewellery',
        'tops',
        'sunglasses'
      ];
      
      // Fetch products from all clothing-related categories
      const allProducts: Product[] = [];
      
      for (const category of clothingCategories) {
        const response = await fetch(`https://dummyjson.com/products/category/${category}`);
        const data = await response.json();
        
        data.products.forEach((p: { id: number; title: string; price: number; description: string; category: string; thumbnail: string; rating?: number; stock?: number }) => {
          // Determine gender category
          let categoryTag = '';
          if (category.includes('mens') || category.includes('men-')) {
            categoryTag = `Men's ${p.category}`;
          } else if (category.includes('womens') || category.includes('women-')) {
            categoryTag = `Women's ${p.category}`;
          } else {
            // For unisex items like sunglasses, tops
            categoryTag = p.category;
          }
          
          allProducts.push({
            id: p.id,
            title: p.title,
            price: p.price,
            description: p.description,
            category: categoryTag,
            image: p.thumbnail,
            rating: {
              rate: p.rating || 4.5,
              count: p.stock || 100,
            },
          });
        });
      }
      
      // Add some mock clothing items to reach 150+ items
      const mockClothingItems: Product[] = [
        ...Array(30).fill(null).map((_, i) => ({
          id: 1000 + i,
          title: `Men's Cotton T-Shirt ${i + 1}`,
          price: 19.99 + (i * 2),
          description: 'Comfortable cotton t-shirt perfect for everyday wear',
          category: "Men's Shirts",
          image: 'https://cdn.dummyjson.com/products/images/mens-shirts/Blue%20&%20Black%20Check%20Shirt/thumbnail.png',
          rating: { rate: 4.2 + (i % 10) / 10, count: 50 + i }
        })),
        ...Array(30).fill(null).map((_, i) => ({
          id: 2000 + i,
          title: `Women's Casual Top ${i + 1}`,
          price: 24.99 + (i * 2),
          description: 'Stylish and comfortable casual top for women',
          category: "Women's Tops",
          image: 'https://cdn.dummyjson.com/products/images/tops/Blue%20Frock/thumbnail.png',
          rating: { rate: 4.3 + (i % 10) / 10, count: 60 + i }
        })),
        ...Array(20).fill(null).map((_, i) => ({
          id: 3000 + i,
          title: `Men's Denim Jeans ${i + 1}`,
          price: 49.99 + (i * 3),
          description: 'Classic denim jeans with modern fit',
          category: "Men's Pants",
          image: 'https://cdn.dummyjson.com/products/images/mens-shirts/Gigabyte%20Aorus%20Men%20Tshirt/thumbnail.png',
          rating: { rate: 4.4 + (i % 10) / 10, count: 70 + i }
        })),
        ...Array(20).fill(null).map((_, i) => ({
          id: 4000 + i,
          title: `Women's Elegant Dress ${i + 1}`,
          price: 59.99 + (i * 4),
          description: 'Elegant dress perfect for any occasion',
          category: "Women's Dresses",
          image: 'https://cdn.dummyjson.com/products/images/womens-dresses/Black%20Women%27s%20Gown/thumbnail.png',
          rating: { rate: 4.5 + (i % 10) / 10, count: 80 + i }
        })),
        ...Array(15).fill(null).map((_, i) => ({
          id: 5000 + i,
          title: `Kids' Casual Outfit ${i + 1}`,
          price: 29.99 + (i * 2),
          description: 'Comfortable and fun outfit for kids',
          category: "Kids' Clothing",
          image: 'https://cdn.dummyjson.com/products/images/tops/Blue%20Frock/thumbnail.png',
          rating: { rate: 4.3 + (i % 10) / 10, count: 40 + i }
        }))
      ];
      
      const combinedProducts = [...allProducts, ...mockClothingItems];
      setProducts(combinedProducts);
    } catch (error) {
      console.error('Error fetching products:', error);
      toast({
        title: "Error",
        description: "Failed to load products. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  const fetchWishlistItems = useCallback(async () => {
    try {
      // Try Firebase auth first
      let userId = firebaseAuth.currentUser?.uid;
      
      // If no Firebase user, try Supabase
      if (!userId) {
        const { data: { user } } = await supabase.auth.getUser();
        userId = user?.id;
      }
      
      if (!userId) return;

      const { data, error } = await supabase
        .from('wishlist_items')
        .select('product_id')
        .eq('user_id', userId);

      if (error) throw error;

      const itemIds = new Set(data.map((item: { product_id: string }) => parseInt(item.product_id)));
      setWishlistItems(itemIds);
    } catch (error) {
      console.error('Error fetching wishlist:', error);
    }
  }, []);

  const applyFilters = useCallback(() => {
    let filtered = [...products];

    // Category filter (Men's, Women's, Kids')
    if (categoryFilter !== 'all') {
      if (categoryFilter === 'men') {
        filtered = filtered.filter(p => 
          p.category.toLowerCase().includes('men') || 
          p.title.toLowerCase().includes("men's") ||
          p.title.toLowerCase().includes('mens')
        );
      } else if (categoryFilter === 'women') {
        filtered = filtered.filter(p => 
          p.category.toLowerCase().includes('women') || 
          p.title.toLowerCase().includes("women's") ||
          p.title.toLowerCase().includes('womens')
        );
      } else if (categoryFilter === 'kids') {
        filtered = filtered.filter(p => 
          p.category.toLowerCase().includes('kid') || 
          p.title.toLowerCase().includes('kid') ||
          p.title.toLowerCase().includes('child')
        );
      }
    }

    // Type filter (T-Shirts, Shirts, Jeans, Pants)
    if (typeFilter !== 'all') {
      if (typeFilter === 'tshirts') {
        filtered = filtered.filter(p => 
          p.title.toLowerCase().includes('t-shirt') || 
          p.title.toLowerCase().includes('tshirt') ||
          p.title.toLowerCase().includes('tee') ||
          p.category.toLowerCase().includes('tops')
        );
      } else if (typeFilter === 'shirts') {
        filtered = filtered.filter(p => 
          (p.title.toLowerCase().includes('shirt') && 
           !p.title.toLowerCase().includes('t-shirt')) ||
          p.title.toLowerCase().includes('blouse')
        );
      } else if (typeFilter === 'jeans') {
        filtered = filtered.filter(p => 
          p.title.toLowerCase().includes('jean') ||
          p.title.toLowerCase().includes('denim')
        );
      } else if (typeFilter === 'pants') {
        filtered = filtered.filter(p => 
          p.title.toLowerCase().includes('pant') || 
          p.title.toLowerCase().includes('trouser') ||
          p.title.toLowerCase().includes('slack')
        );
      }
    }

    setFilteredProducts(filtered);
  }, [products, categoryFilter, typeFilter]);

  useEffect(() => {
    fetchProducts();
    fetchWishlistItems();
  }, [fetchProducts, fetchWishlistItems]);

  useEffect(() => {
    applyFilters();
  }, [applyFilters]);

  const addToWishlist = async (product: Product) => {
    try {
      // Try Firebase auth first
      let userId = firebaseAuth.currentUser?.uid;
      
      // If no Firebase user, try Supabase
      if (!userId) {
        const { data: { user } } = await supabase.auth.getUser();
        userId = user?.id;
      }
      
      if (!userId) {
        toast({
          title: t("store.loginRequired", "Login Required"),
          description: t("store.loginRequiredDesc", "Please login to add items to your wishlist."),
          variant: "destructive",
        });
        navigate('/auth');
        return;
      }

      const { data: wishlists, error: wishlistError } = await supabase
        .from('wishlists')
        .select('id')
        .eq('user_id', userId)
        .limit(1);

      if (wishlistError) throw wishlistError;

      let wishlistId;
      if (!wishlists || wishlists.length === 0) {
        const { data: newWishlist, error: createError } = await supabase
          .from('wishlists')
          .insert({ user_id: userId, name: 'My Wishlist' })
          .select('id')
          .single();

        if (createError) throw createError;
        wishlistId = newWishlist.id;
      } else {
        wishlistId = wishlists[0].id;
      }

      const { error: insertError } = await supabase
        .from('wishlist_items')
        .insert({
          wishlist_id: wishlistId,
          user_id: userId,
          product_id: product.id.toString(),
          product_name: product.title,
          product_price: product.price,
          product_image: product.image,
          product_category: product.category,
          product_description: product.description,
          initial_price: product.price,
        });

      if (insertError) {
        if (insertError.code === '23505') {
          toast({
            title: t("store.alreadyInWishlist", "Already in Wishlist"),
            description: t("store.alreadyInWishlistDesc", "This item is already in your wishlist."),
          });
          return;
        }
        throw insertError;
      }

      setWishlistItems(prev => new Set([...prev, product.id]));

      toast({
        title: t("store.addedToWishlist", "Added to Wishlist"),
        description: t("store.addedToWishlistDesc", "{{name}} has been added to your wishlist.", { name: product.title }),
      });
    } catch (error) {
      console.error('Error adding to wishlist:', error);
      toast({
        title: t("store.error", "Error"),
        description: t("store.errorDesc", "Failed to add item to wishlist."),
        variant: "destructive",
      });
    }
  };

  const removeFromWishlist = async (productId: number) => {
    try {
      // Try Firebase auth first
      let userId = firebaseAuth.currentUser?.uid;
      
      // If no Firebase user, try Supabase
      if (!userId) {
        const { data: { user } } = await supabase.auth.getUser();
        userId = user?.id;
      }
      
      if (!userId) return;

      const { error } = await supabase
        .from('wishlist_items')
        .delete()
        .eq('product_id', productId.toString())
        .eq('user_id', userId);

      if (error) throw error;

      setWishlistItems(prev => {
        const newSet = new Set(prev);
        newSet.delete(productId);
        return newSet;
      });

      toast({
        title: t("store.removedFromWishlist", "Removed from Wishlist"),
        description: t("store.removedFromWishlistDesc", "Item has been removed from your wishlist."),
      });
    } catch (error) {
      console.error('Error removing from wishlist:', error);
    }
  };

  if (loading) {
    return (
      <>
        <Navigation />
        <div className="min-h-screen py-24 px-4 md:px-6">
          <div className="container">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {[...Array(12)].map((_, i) => (
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

  return (
    <>
      <Navigation />
      <div className="min-h-screen py-24 px-4 md:px-6">
        <div className="container">
          {/* Header */}
          <div className="text-center space-y-4 mb-8">
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight">
              {t("store.title", "Our")}{" "}
              <span className="bg-gradient-primary bg-clip-text text-transparent">
                {t("store.subtitle", "Store")}
              </span>
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              {t("store.description", "Discover amazing products across all categories")}
            </p>
          </div>

          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-4 mb-8">
            <div className="flex items-center gap-2 flex-1">
              <Filter className="w-5 h-5 text-muted-foreground" />
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-full sm:w-[200px]">
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t("store.allCategories", "All Categories")}</SelectItem>
                  <SelectItem value="men">{t("store.menCollection", "Men's Collection")}</SelectItem>
                  <SelectItem value="women">{t("store.womenCollection", "Women's Collection")}</SelectItem>
                  <SelectItem value="kids">{t("store.kidsCollection", "Kids' Collection")}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-full sm:w-[200px]">
                <SelectValue placeholder="Product type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t("store.allTypes", "All Types")}</SelectItem>
                <SelectItem value="tshirts">{t("store.tshirts", "T-Shirts")}</SelectItem>
                <SelectItem value="shirts">{t("store.shirts", "Shirts")}</SelectItem>
                <SelectItem value="jeans">{t("store.jeans", "Jeans")}</SelectItem>
                <SelectItem value="pants">{t("store.pants", "Pants")}</SelectItem>
              </SelectContent>
            </Select>

            <div className="text-sm text-muted-foreground flex items-center">
              {t("store.productsFound", "{{count}} products found", { count: filteredProducts.length })}
            </div>
          </div>

          {/* Products Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredProducts.map((product) => {
              const isInWishlist = wishlistItems.has(product.id);
              
              return (
                <Card key={product.id} className="group hover:shadow-elegant transition-all duration-300 hover:-translate-y-1 flex flex-col">
                  <CardHeader className="p-0">
                    <div className="aspect-square relative overflow-hidden rounded-t-lg bg-muted">
                      <img
                        src={product.image}
                        alt={product.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      <Button
                        variant={isInWishlist ? "default" : "secondary"}
                        size="icon"
                        className="absolute top-4 right-4 rounded-full"
                        onClick={() => isInWishlist ? removeFromWishlist(product.id) : addToWishlist(product)}
                      >
                        <Heart className={`w-4 h-4 ${isInWishlist ? 'fill-current' : ''}`} />
                      </Button>
                    </div>
                  </CardHeader>
                  
                  <CardContent className="flex-1 pt-4">
                    <Badge variant="secondary" className="mb-2">{product.category}</Badge>
                    
                    <CardTitle className="text-lg line-clamp-2 leading-tight mb-2">
                      {product.title}
                    </CardTitle>
                    
                    <div className="flex items-center gap-2 mb-3">
                      <div className="flex items-center gap-1">
                        <Star className="w-4 h-4 fill-accent text-accent" />
                        <span className="text-sm font-medium">{product.rating.rate}</span>
                      </div>
                      <span className="text-sm text-muted-foreground">
                        ({product.rating.count} reviews)
                      </span>
                    </div>

                    <CardDescription className="line-clamp-2 mb-4">
                      {product.description}
                    </CardDescription>

                    <div className="flex items-baseline gap-2">
                      <span className="text-3xl font-bold text-primary">
                        ${product.price.toFixed(2)}
                      </span>
                      <Badge variant="secondary" className="gap-1">
                        <TrendingDown className="w-3 h-3" />
                        Best Price
                      </Badge>
                    </div>
                  </CardContent>

                  <CardFooter className="pt-0 gap-2">
                    <Button variant="outline" className="flex-1" onClick={() => setSelectedProduct(product)}>
                      {t("store.viewDetails", "View Details")}
                    </Button>
                    <Button variant="default" className="flex-1 gap-2">
                      <ShoppingCart className="w-4 h-4" />
                      {t("store.buyNow", "Buy Now")}
                    </Button>
                  </CardFooter>
                </Card>
              );
            })}
          </div>

          {filteredProducts.length === 0 && (
            <div className="text-center py-12">
              <p className="text-xl text-muted-foreground">{t("store.noProductsFound", "No products found matching your filters.")}</p>
              <Button onClick={() => { setCategoryFilter('all'); setTypeFilter('all'); }} className="mt-4">
                {t("store.clearFilters", "Clear Filters")}
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Product Details Modal */}
      <Dialog open={!!selectedProduct} onOpenChange={() => setSelectedProduct(null)}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          {selectedProduct && (
            <>
              <DialogHeader>
                <DialogTitle className="text-2xl">{selectedProduct.title}</DialogTitle>
                <DialogDescription>
                  <Badge variant="secondary" className="mt-2">{selectedProduct.category}</Badge>
                </DialogDescription>
              </DialogHeader>
              
              <div className="grid md:grid-cols-2 gap-6 mt-4">
                <div className="aspect-square rounded-lg overflow-hidden bg-muted">
                  <img
                    src={selectedProduct.image}
                    alt={selectedProduct.title}
                    className="w-full h-full object-cover"
                  />
                </div>

                <div className="space-y-4">
                  <div>
                    <h3 className="font-semibold text-lg mb-2">Description</h3>
                    <p className="text-muted-foreground">{selectedProduct.description}</p>
                  </div>

                  <div className="flex items-center gap-2">
                    <Star className="w-5 h-5 fill-accent text-accent" />
                    <span className="font-medium">{selectedProduct.rating.rate}</span>
                    <span className="text-muted-foreground">
                      ({selectedProduct.rating.count} reviews)
                    </span>
                  </div>

                  <div className="pt-4 border-t">
                    <div className="text-4xl font-bold text-primary mb-4">
                      ${selectedProduct.price.toFixed(2)}
                    </div>

                    <div className="space-y-2">
                      <Button 
                        className="w-full gap-2" 
                        size="lg"
                        onClick={() => {
                          const isInWishlist = wishlistItems.has(selectedProduct.id);
                          if (isInWishlist) {
                            removeFromWishlist(selectedProduct.id);
                          } else {
                            addToWishlist(selectedProduct);
                          }
                        }}
                      >
                        <Heart className={`w-4 h-4 ${wishlistItems.has(selectedProduct.id) ? 'fill-current' : ''}`} />
                        {wishlistItems.has(selectedProduct.id) ? 'Remove from Wishlist' : 'Add to Wishlist'}
                      </Button>
                      <Button variant="default" className="w-full gap-2" size="lg">
                        <ShoppingCart className="w-4 h-4" />
                        Buy Now
                      </Button>
                    </div>
                  </div>

                  <div className="pt-4 space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Category:</span>
                      <span className="font-medium">{selectedProduct.category}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Product ID:</span>
                      <span className="font-medium">#{selectedProduct.id}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Availability:</span>
                      <span className="font-medium text-green-600">In Stock</span>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};

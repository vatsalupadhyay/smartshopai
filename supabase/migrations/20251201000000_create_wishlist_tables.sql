-- Create wishlists table
CREATE TABLE public.wishlists (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL DEFAULT 'My Wishlist',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create wishlist_items table
CREATE TABLE public.wishlist_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  wishlist_id UUID NOT NULL REFERENCES public.wishlists(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  product_id TEXT NOT NULL,
  product_name TEXT NOT NULL,
  product_price DECIMAL(10, 2) NOT NULL,
  product_image TEXT,
  product_category TEXT,
  product_description TEXT,
  initial_price DECIMAL(10, 2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(wishlist_id, product_id)
);

-- Create price_history table for tracking price changes
CREATE TABLE public.price_history (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  wishlist_item_id UUID NOT NULL REFERENCES public.wishlist_items(id) ON DELETE CASCADE,
  price DECIMAL(10, 2) NOT NULL,
  recorded_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.wishlists ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wishlist_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.price_history ENABLE ROW LEVEL SECURITY;

-- Wishlists policies
CREATE POLICY "Users can view their own wishlists"
  ON public.wishlists FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own wishlists"
  ON public.wishlists FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own wishlists"
  ON public.wishlists FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own wishlists"
  ON public.wishlists FOR DELETE
  USING (auth.uid() = user_id);

-- Wishlist items policies
CREATE POLICY "Users can view their own wishlist items"
  ON public.wishlist_items FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can add items to their wishlists"
  ON public.wishlist_items FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their wishlist items"
  ON public.wishlist_items FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their wishlist items"
  ON public.wishlist_items FOR DELETE
  USING (auth.uid() = user_id);

-- Price history policies
CREATE POLICY "Users can view price history for their items"
  ON public.price_history FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.wishlist_items
      WHERE wishlist_items.id = price_history.wishlist_item_id
      AND wishlist_items.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert price history for their items"
  ON public.price_history FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.wishlist_items
      WHERE wishlist_items.id = price_history.wishlist_item_id
      AND wishlist_items.user_id = auth.uid()
    )
  );

-- Create function to automatically create default wishlist for new users
CREATE OR REPLACE FUNCTION public.create_default_wishlist()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO public.wishlists (user_id, name)
  VALUES (NEW.id, 'My Wishlist');
  RETURN NEW;
END;
$$;

-- Trigger to create default wishlist when user signs up
CREATE TRIGGER on_user_created_wishlist
  AFTER INSERT ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.create_default_wishlist();

-- Create indexes for better query performance
CREATE INDEX idx_wishlists_user_id ON public.wishlists(user_id);
CREATE INDEX idx_wishlist_items_user_id ON public.wishlist_items(user_id);
CREATE INDEX idx_wishlist_items_wishlist_id ON public.wishlist_items(wishlist_id);
CREATE INDEX idx_price_history_item_id ON public.price_history(wishlist_item_id);

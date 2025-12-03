-- Drop existing policies first
DROP POLICY IF EXISTS "Users can view their own wishlists" ON public.wishlists;
DROP POLICY IF EXISTS "Users can create their own wishlists" ON public.wishlists;
DROP POLICY IF EXISTS "Users can update their own wishlists" ON public.wishlists;
DROP POLICY IF EXISTS "Users can delete their own wishlists" ON public.wishlists;
DROP POLICY IF EXISTS "Users can view their own wishlist items" ON public.wishlist_items;
DROP POLICY IF EXISTS "Users can add items to their wishlists" ON public.wishlist_items;
DROP POLICY IF EXISTS "Users can update their wishlist items" ON public.wishlist_items;
DROP POLICY IF EXISTS "Users can delete their wishlist items" ON public.wishlist_items;
DROP POLICY IF EXISTS "Users can view price history for their items" ON public.price_history;
DROP POLICY IF EXISTS "Users can insert price history for their items" ON public.price_history;

-- Update wishlists table to use TEXT for user_id (Firebase UID)
ALTER TABLE public.wishlists 
  DROP CONSTRAINT IF EXISTS wishlists_user_id_fkey,
  ALTER COLUMN user_id TYPE TEXT;

-- Update wishlist_items table to use TEXT for user_id (Firebase UID)
ALTER TABLE public.wishlist_items 
  DROP CONSTRAINT IF EXISTS wishlist_items_user_id_fkey,
  ALTER COLUMN user_id TYPE TEXT;

-- Recreate policies that work without auth.uid() since we're using Firebase
-- Wishlists policies (allow all operations for authenticated users via app)
CREATE POLICY "Users can view wishlists"
  ON public.wishlists FOR SELECT
  USING (true);

CREATE POLICY "Users can create wishlists"
  ON public.wishlists FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Users can update wishlists"
  ON public.wishlists FOR UPDATE
  USING (true);

CREATE POLICY "Users can delete wishlists"
  ON public.wishlists FOR DELETE
  USING (true);

-- Wishlist items policies (allow all operations for authenticated users via app)
CREATE POLICY "Users can view wishlist items"
  ON public.wishlist_items FOR SELECT
  USING (true);

CREATE POLICY "Users can add items to wishlists"
  ON public.wishlist_items FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Users can update wishlist items"
  ON public.wishlist_items FOR UPDATE
  USING (true);

CREATE POLICY "Users can delete wishlist items"
  ON public.wishlist_items FOR DELETE
  USING (true);

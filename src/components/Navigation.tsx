import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { ShoppingBag, Menu, ChevronDown, Heart } from "lucide-react";
import { LanguageSelector } from "@/components/LanguageSelector";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";
import { firebaseAuth } from "@/integrations/firebase/client";
import { onAuthStateChanged, signOut as firebaseSignOut, UserInfo } from "firebase/auth";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface FbUser extends UserInfo {
  photoURL: string | null;
}

export const Navigation = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [fbUser, setFbUser] = useState<FbUser | null>(null);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    const unsubscribeFirebase = onAuthStateChanged(firebaseAuth, (fUser) => {
      if (fUser) {
        setUser({} as User);
        setFbUser(fUser);
      } else {
        setUser(null);
        setFbUser(null);
      }
    });

    return () => { subscription.unsubscribe(); unsubscribeFirebase(); };
  }, []);

  const handleLogout = async () => {
    try { 
      await supabase.auth.signOut(); 
    } catch (e) {
      console.warn('Supabase logout error:', e);
    }
    try { 
      await firebaseSignOut(firebaseAuth); 
    } catch (e) {
      console.warn('Firebase logout error:', e);
    }
    navigate("/");
  };

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="w-full px-6 md:px-12 lg:px-16">
        <div className="flex h-16 items-center justify-between">
          {/* Logo - Far Left */}
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-2 focus:outline-none"
            aria-label={t('brand.name', 'SmartShop AI')}
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-primary flex items-center justify-center">
              <ShoppingBag className="w-6 h-6 text-white" />
            </div>
            <span className="text-xl font-bold bg-gradient-primary bg-clip-text text-transparent">
              {t("brand.name", "SmartShop AI")}
            </span>
          </button>

          {/* Desktop Navigation - Center */}
          <div className="hidden md:flex items-center gap-6 absolute left-1/2 transform -translate-x-1/2">
            <button onClick={() => { navigate('/'); setTimeout(() => { const el = document.getElementById('features'); if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' }); }, 100); }} className="relative text-sm font-medium text-foreground/80 hover:text-primary hover:scale-105 transition-all duration-300 group">
              {t("nav.features", "Features")}
              <span className="absolute left-0 bottom-0 w-0 h-0.5 bg-gradient-primary group-hover:w-full transition-all duration-300"></span>
            </button>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="relative text-sm font-medium text-foreground/80 hover:text-primary hover:scale-105 transition-all duration-300 group flex items-center gap-1 outline-none">
                  Store
                  <ChevronDown className="w-3 h-3" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="center" className="w-48">
                <DropdownMenuLabel>Shop by Category</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onSelect={() => navigate('/store?category=men')}>
                  Men's Collection
                </DropdownMenuItem>
                <DropdownMenuItem onSelect={() => navigate('/store?category=women')}>
                  Women's Collection
                </DropdownMenuItem>
                <DropdownMenuItem onSelect={() => navigate('/store?category=kids')}>
                  Kids' Collection
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuLabel>Shop by Type</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onSelect={() => navigate('/store?type=tshirts')}>
                  T-Shirts
                </DropdownMenuItem>
                <DropdownMenuItem onSelect={() => navigate('/store?type=shirts')}>
                  Shirts
                </DropdownMenuItem>
                <DropdownMenuItem onSelect={() => navigate('/store?type=jeans')}>
                  Jeans
                </DropdownMenuItem>
                <DropdownMenuItem onSelect={() => navigate('/store?type=pants')}>
                  Pants
                </DropdownMenuItem>
                <DropdownMenuItem onSelect={() => navigate('/store')}>
                  View All Products
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            
            <button onClick={() => { navigate('/'); setTimeout(() => { const el = document.getElementById('review-detection'); if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' }); }, 100); }} className="relative text-sm font-medium text-foreground/80 hover:text-primary hover:scale-105 transition-all duration-300 group">
              {t('nav.fakeReviews', 'Fake Review')}
              <span className="absolute left-0 bottom-0 w-0 h-0.5 bg-gradient-primary group-hover:w-full transition-all duration-300"></span>
            </button>

            <button onClick={() => { navigate('/'); setTimeout(() => { const el = document.getElementById('price-prediction'); if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' }); }, 100); }} className="relative text-sm font-medium text-foreground/80 hover:text-primary hover:scale-105 transition-all duration-300 group">
              Price Prediction
              <span className="absolute left-0 bottom-0 w-0 h-0.5 bg-gradient-primary group-hover:w-full transition-all duration-300"></span>
            </button>
            
            <button onClick={() => { navigate('/'); setTimeout(() => { const el = document.getElementById('assistant'); if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' }); }, 100); }} className="relative text-sm font-medium text-foreground/80 hover:text-primary hover:scale-105 transition-all duration-300 group">
              AI Assistant
              <span className="absolute left-0 bottom-0 w-0 h-0.5 bg-gradient-primary group-hover:w-full transition-all duration-300"></span>
            </button>
          </div>

          {/* Language & Login - Far Right */}
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              className="hidden md:inline-flex"
              onClick={() => navigate('/wishlist')}
            >
              <Heart className="w-5 h-5" />
            </Button>
            <div className="hidden md:block">
              <LanguageSelector />
            </div>
            {fbUser ? (
              <div className="hidden md:flex items-center gap-2">
                <img src={fbUser.photoURL || undefined} alt={fbUser.displayName || 'avatar'} className="w-9 h-9 rounded-full object-cover" />
                <Button variant="outline" onClick={handleLogout}>
                  {t("nav.logout", "Logout")}
                </Button>
              </div>
            ) : user ? (
              <Button variant="outline" className="hidden md:inline-flex" onClick={handleLogout}>
                {t("nav.logout", "Logout")}
              </Button>
            ) : (
              <Button variant="outline" className="hidden md:inline-flex" onClick={() => navigate("/auth")}>
                {t("nav.login", "Login")}
              </Button>
            )}
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              onClick={() => setIsOpen(!isOpen)}
            >
              <Menu className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </div>

      {/* Mobile Navigation */}
      {isOpen && (
        <div className="md:hidden border-t border-border/40 bg-background/95 backdrop-blur">
          <div className="px-6 py-4 space-y-3">
            <button onClick={() => { navigate('/'); setIsOpen(false); setTimeout(() => { const el = document.getElementById('features'); if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' }); }, 100); }} className="block w-full text-left text-sm font-medium text-foreground/80 hover:text-primary hover:translate-x-1 transition-all duration-300">
              {t("nav.features", "Features")}
            </button>
            
            <div className="space-y-2">
              <p className="text-xs font-semibold text-muted-foreground uppercase">Store</p>
              <button onClick={() => { navigate('/store?category=men'); setIsOpen(false); }} className="block w-full text-left text-sm font-medium text-foreground/80 hover:text-primary hover:translate-x-1 transition-all duration-300 pl-3">
                Men's Collection
              </button>
              <button onClick={() => { navigate('/store?category=women'); setIsOpen(false); }} className="block w-full text-left text-sm font-medium text-foreground/80 hover:text-primary hover:translate-x-1 transition-all duration-300 pl-3">
                Women's Collection
              </button>
              <button onClick={() => { navigate('/store?category=kids'); setIsOpen(false); }} className="block w-full text-left text-sm font-medium text-foreground/80 hover:text-primary hover:translate-x-1 transition-all duration-300 pl-3">
                Kids' Collection
              </button>
              <button onClick={() => { navigate('/store'); setIsOpen(false); }} className="block w-full text-left text-sm font-medium text-foreground/80 hover:text-primary hover:translate-x-1 transition-all duration-300 pl-3">
                All Products
              </button>
            </div>
            
            <button onClick={() => { navigate('/'); setIsOpen(false); setTimeout(() => { const el = document.getElementById('review-detection'); if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' }); }, 100); }} className="block w-full text-left text-sm font-medium text-foreground/80 hover:text-primary hover:translate-x-1 transition-all duration-300">
              {t('nav.fakeReviews', 'Fake Review')}
            </button>

            <button onClick={() => { navigate('/'); setIsOpen(false); setTimeout(() => { const el = document.getElementById('price-prediction'); if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' }); }, 100); }} className="block w-full text-left text-sm font-medium text-foreground/80 hover:text-primary hover:translate-x-1 transition-all duration-300">
              Price Prediction
            </button>
            
            <button onClick={() => { navigate('/'); setIsOpen(false); setTimeout(() => { const el = document.getElementById('assistant'); if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' }); }, 100); }} className="block w-full text-left text-sm font-medium text-foreground/80 hover:text-primary hover:translate-x-1 transition-all duration-300">
              AI Assistant
            </button>
            
            <button onClick={() => { navigate('/wishlist'); setIsOpen(false); }} className="block w-full text-left text-sm font-medium text-foreground/80 hover:text-primary hover:translate-x-1 transition-all duration-300">
              Wishlist
            </button>
            <div className="pt-2 space-y-2">
              <LanguageSelector />
              {fbUser ? (
                <div className="flex items-center gap-2">
                  <img src={fbUser.photoURL || undefined} alt={fbUser.displayName || 'avatar'} className="w-9 h-9 rounded-full object-cover" />
                  <Button variant="outline" className="w-full" onClick={handleLogout}>
                    {t("nav.logout", "Logout")}
                  </Button>
                </div>
              ) : user ? (
                <Button variant="outline" className="w-full" onClick={handleLogout}>
                  {t("nav.logout", "Logout")}
                </Button>
              ) : (
                <Button variant="outline" className="w-full" onClick={() => { navigate("/auth"); setIsOpen(false); }}>
                  {t("nav.login", "Login")}
                </Button>
              )}
            </div>
          </div>
        </div>
      )}
    </nav>
  );
};

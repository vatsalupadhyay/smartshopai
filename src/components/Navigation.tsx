
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { ShoppingBag, Menu } from "lucide-react";
import { LanguageSelector } from "@/components/LanguageSelector";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";
import { firebaseAuth } from "@/integrations/firebase/client";
import { onAuthStateChanged, signOut as firebaseSignOut, UserInfo } from "firebase/auth";

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
            onClick={(e) => {
              e.preventDefault();
              const el = document.getElementById('hero');
              if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }}
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
            <a href="#features" onClick={(e) => { e.preventDefault(); const el = document.getElementById('features'); if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' }); }} className="text-sm font-medium text-foreground/80 hover:text-foreground transition-colors">
              {t("nav.features", "Features")}
            </a>
            <a href="#price-prediction" onClick={(e) => { e.preventDefault(); const el = document.getElementById('price-prediction'); if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' }); }} className="text-sm font-medium text-foreground/80 hover:text-foreground transition-colors">
              Price Prediction
            </a>
            <a href="#review-detection" onClick={(e) => { e.preventDefault(); const el = document.getElementById('review-detection'); if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' }); }} className="text-sm font-medium text-foreground/80 hover:text-foreground transition-colors">
              {t("nav.reviewDetection", "Review Detection")}
            </a>
            <a href="#dashboard" onClick={(e) => { e.preventDefault(); const el = document.getElementById('dashboard'); if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' }); }} className="text-sm font-medium text-foreground/80 hover:text-foreground transition-colors">
              {t("nav.dashboard", "Dashboard")}
            </a>
            <a href="#assistant" onClick={(e) => { e.preventDefault(); const el = document.getElementById('assistant'); if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' }); }} className="text-sm font-medium text-foreground/80 hover:text-foreground transition-colors">
              {t("nav.assistant", "AI Assistant")}
            </a>
          </div>

          {/* Language & Login - Far Right */}
          <div className="flex items-center gap-4">
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
            <a href="#features" className="block text-sm font-medium text-foreground/80 hover:text-foreground transition-colors" onClick={(e) => { e.preventDefault(); setIsOpen(false); const el = document.getElementById('features'); if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' }); }}>
              {t("nav.features", "Features")}
            </a>
            <a href="#price-prediction" className="block text-sm font-medium text-foreground/80 hover:text-foreground transition-colors" onClick={(e) => { e.preventDefault(); setIsOpen(false); const el = document.getElementById('price-prediction'); if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' }); }}>
              Price Prediction
            </a>
            <a href="#review-detection" className="block text-sm font-medium text-foreground/80 hover:text-foreground transition-colors" onClick={(e) => { e.preventDefault(); setIsOpen(false); const el = document.getElementById('review-detection'); if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' }); }}>
              {t("nav.reviewDetection", "Review Detection")}
            </a>
            <a href="#dashboard" className="block text-sm font-medium text-foreground/80 hover:text-foreground transition-colors" onClick={(e) => { e.preventDefault(); setIsOpen(false); const el = document.getElementById('dashboard'); if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' }); }}>
              {t("nav.dashboard", "Dashboard")}
            </a>
            <a href="#assistant" className="block text-sm font-medium text-foreground/80 hover:text-foreground transition-colors" onClick={(e) => { e.preventDefault(); setIsOpen(false); const el = document.getElementById('assistant'); if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' }); }}>
              {t("nav.assistant", "AI Assistant")}
            </a>
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

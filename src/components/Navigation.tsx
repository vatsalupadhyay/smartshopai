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

    // Also listen to Firebase auth state so the nav updates when user signs in via Firebase
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
    // Try to sign out from both Supabase and Firebase (if signed in)
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
      <div className="container flex h-16 items-center justify-between px-4 md:px-6">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-xl bg-gradient-primary flex items-center justify-center">
            <ShoppingBag className="w-6 h-6 text-white" />
          </div>
          <span className="text-xl font-bold bg-gradient-primary bg-clip-text text-transparent">
            {t("brand.name", "SmartShop AI")}
          </span>
        </div>

        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center gap-6">
          <a href="#features" className="text-sm font-medium text-foreground/80 hover:text-foreground transition-colors">
            {t("nav.features")}
          </a>
          <a href="#dashboard" className="text-sm font-medium text-foreground/80 hover:text-foreground transition-colors">
            {t("nav.dashboard")}
          </a>
          <a href="#assistant" className="text-sm font-medium text-foreground/80 hover:text-foreground transition-colors">
            {t("nav.assistant")}
          </a>
        </div>

        <div className="flex items-center gap-4">
          <div className="hidden md:block">
            <LanguageSelector />
          </div>
          {fbUser ? (
            <div className="hidden md:flex items-center gap-2">
              <img src={fbUser.photoURL || undefined} alt={fbUser.displayName || 'avatar'} className="w-9 h-9 rounded-full object-cover" />
              <Button variant="outline" className="hidden md:inline-flex" onClick={handleLogout}>
                {t("nav.logout")}
              </Button>
            </div>
          ) : user ? (
            <Button variant="outline" className="hidden md:inline-flex" onClick={handleLogout}>
              {t("nav.logout")}
            </Button>
          ) : (
            <Button variant="outline" className="hidden md:inline-flex" onClick={() => navigate("/auth")}>
              {t("nav.login")}
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

      {/* Mobile Navigation */}
      {isOpen && (
        <div className="md:hidden border-t border-border/40 bg-background/95 backdrop-blur">
          <div className="container px-4 py-4 space-y-3">
            <a href="#features" className="block text-sm font-medium text-foreground/80 hover:text-foreground transition-colors" onClick={() => setIsOpen(false)}>
              {t("nav.features")}
            </a>
            <a href="#dashboard" className="block text-sm font-medium text-foreground/80 hover:text-foreground transition-colors" onClick={() => setIsOpen(false)}>
              {t("nav.dashboard")}
            </a>
            <a href="#assistant" className="block text-sm font-medium text-foreground/80 hover:text-foreground transition-colors" onClick={() => setIsOpen(false)}>
              {t("nav.assistant")}
            </a>
            <div className="pt-2 space-y-2">
              <LanguageSelector />
              {fbUser ? (
                <div className="flex items-center gap-2">
                  <img src={fbUser.photoURL || undefined} alt={fbUser.displayName || 'avatar'} className="w-9 h-9 rounded-full object-cover" />
                  <Button variant="outline" className="w-full" onClick={handleLogout}>
                    {t("nav.logout")}
                  </Button>
                </div>
              ) : user ? (
                <Button variant="outline" className="w-full" onClick={handleLogout}>
                  {t("nav.logout")}
                </Button>
              ) : (
                <Button variant="outline" className="w-full" onClick={() => { navigate("/auth"); setIsOpen(false); }}>
                  {t("nav.login")}
                </Button>
              )}
            </div>
          </div>
        </div>
      )}
    </nav>
  );
};

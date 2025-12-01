import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { supabase } from "@/integrations/supabase/client";
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, updateProfile } from "firebase/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { ShoppingBag, LogIn } from "lucide-react";
import { firebaseAuth, firebaseGoogleProvider } from "@/integrations/firebase/client";
import { signInWithPopup } from "firebase/auth";

export default function Auth() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();
  const { t } = useTranslation();

  useEffect(() => {
    // Check if user is already logged in
    // Check Firebase auth state instead of Supabase for email/password
    const unsub = firebaseAuth.onAuthStateChanged((u) => {
      if (u) navigate('/');
    });
    return () => unsub();
  }, [navigate]);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isLogin) {
        // Firebase email/password sign-in
        const userCredential = await signInWithEmailAndPassword(firebaseAuth, email, password);
        if (userCredential.user) {
          toast({ title: t("auth.loginSuccess"), duration: 3000 });
          navigate('/');
        }
      } else {
        // Firebase sign up
        const userCredential = await createUserWithEmailAndPassword(firebaseAuth, email, password);
        if (userCredential.user) {
          // Optionally set display name
          if (fullName) {
            await updateProfile(userCredential.user, { displayName: fullName });
          }
          toast({ title: t("auth.signupSuccess"), duration: 3000 });
          navigate('/');
        }
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      toast({
        title: t("auth.error"),
        description: message,
        variant: "destructive",
        duration: 5000,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12 bg-gradient-to-br from-background via-background to-muted">
      <Card className="w-full max-w-md shadow-elegant">
        <CardHeader className="space-y-4">
          <div className="flex items-center justify-center gap-2">
            <ShoppingBag className="w-8 h-8 text-accent" />
            <h1 className="text-2xl font-bold bg-gradient-primary bg-clip-text text-transparent">
              {t("brand.name", "SmartShop AI")}
            </h1>
          </div>
          <CardTitle className="text-center text-2xl">
            {isLogin ? t("auth.login") : t("auth.signup")}
          </CardTitle>
          <CardDescription className="text-center">
            {isLogin ? t("auth.noAccount") : t("auth.haveAccount")}
            <Button
              variant="link"
              className="p-0 ml-1 text-accent"
              onClick={() => setIsLogin(!isLogin)}
            >
              {isLogin ? t("auth.signup") : t("auth.login")}
            </Button>
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleAuth} className="space-y-4">
            {!isLogin && (
              <div className="space-y-2">
                <Label htmlFor="fullName">{t("auth.fullName")}</Label>
                <Input
                  id="fullName"
                  type="text"
                  placeholder="John Doe"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                />
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="email">{t("auth.email")}</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">{t("auth.password")}</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
              />
            </div>
            <Button
              type="submit"
              className="w-full"
              variant="accent"
              disabled={loading}
            >
              {loading ? "..." : isLogin ? t("auth.login") : t("auth.signup")}
            </Button>
            <div className="text-center">
              <span className="text-sm text-muted-foreground">OR</span>
            </div>
            <Button
              className="w-full flex items-center justify-center gap-2"
              variant="outline"
              onClick={async () => {
                try {
                  setLoading(true);
                  const result = await signInWithPopup(firebaseAuth, firebaseGoogleProvider);
                  // result.user contains Firebase user; you can also create/verify user in Supabase if needed
                  toast({ title: t("auth.loginSuccess"), duration: 3000 });
                  navigate('/');
                } catch (err) {
                  const message = err instanceof Error ? err.message : String(err);
                  toast({ title: t("auth.error"), description: message, variant: 'destructive', duration: 8000 });
                } finally { setLoading(false); }
              }}
            >
              <svg className="w-4 h-4" viewBox="0 0 533.5 544.3" xmlns="http://www.w3.org/2000/svg" aria-hidden>
                <path fill="#4285F4" d="M533.5 278.4c0-17.4-1.6-34.1-4.6-50.4H272v95.4h146.9c-6.3 34.1-25 62.9-53.4 82.2v68.2h86.3c50.6-46.6 81.7-115.6 81.7-195.4z"/>
                <path fill="#34A853" d="M272 544.3c72.6 0 133.6-24.1 178-65.4l-86.3-68.2c-23.9 16.1-54.5 25.7-91.7 25.7-70.4 0-130.1-47.6-151.6-111.6H31.9v69.9C76.5 485.6 168.6 544.3 272 544.3z"/>
                <path fill="#FBBC05" d="M120.4 330.8c-10.8-32.1-10.8-66.6 0-98.7V162.2H31.9c-39 77.9-39 170.7 0 248.6l88.5-80z"/>
                <path fill="#EA4335" d="M272 107.6c39.5 0 75 13.6 103 40.4l77.3-77.3C404.9 24.5 343.9 0 272 0 168.6 0 76.5 58.7 31.9 162.2l88.5 69.9C141.9 155.2 201.6 107.6 272 107.6z"/>
              </svg>
              {t("auth.loginWithGoogle", "Continue with Google")}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

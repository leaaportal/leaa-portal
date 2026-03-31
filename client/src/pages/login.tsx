import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
import leaaLogo from "@assets/leaa-logo.jpg";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [accessCode, setAccessCode] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { login } = useAuth();
  const { toast } = useToast();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email || !accessCode) return;

    setIsSubmitting(true);
    try {
      await login(email, accessCode);
    } catch (err: any) {
      toast({
        title: "Login failed",
        description: "Invalid email or access code. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen flex" data-testid="login-page">
      {/* Left panel — branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-[#2D2F36] text-white flex-col justify-between p-12 relative overflow-hidden">
        {/* Decorative lines */}
        <div className="absolute top-0 right-0 w-64 h-64 opacity-5">
          <svg viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M0 0L200 200M40 0L200 160M80 0L200 120M120 0L200 80M160 0L200 40" stroke="white" strokeWidth="1"/>
          </svg>
        </div>

        <div>
          <img src={leaaLogo} alt="LEAA Logo" className="w-48 mb-8 rounded" />
          <h1 className="font-display text-xl font-semibold tracking-tight leading-tight mb-3">
            Lane Ellis<br />Apparel Agency
          </h1>
          <p className="text-[#D9C9B6] text-sm tracking-[0.25em] uppercase font-medium">
            Mark · Measure · Stitch
          </p>
        </div>

        <div className="space-y-6">
          <blockquote className="text-[#D9C9B6]/80 text-sm leading-relaxed max-w-md">
            "LEAA brings together 15+ years of technical design expertise and strategic retail planning 
            to guide your brand from concept to collection."
          </blockquote>
          <div className="flex gap-6 text-xs text-[#A5A5A5]">
            <span>Chicago, IL</span>
            <span>·</span>
            <span>Nationwide Service</span>
            <span>·</span>
            <span>Est. 2020</span>
          </div>
        </div>
      </div>

      {/* Right panel — login form */}
      <div className="flex-1 flex items-center justify-center p-8 bg-background">
        <div className="w-full max-w-sm">
          {/* Mobile logo */}
          <div className="lg:hidden mb-8 text-center">
            <img src={leaaLogo} alt="LEAA Logo" className="w-32 mx-auto mb-4 rounded" />
            <p className="text-muted-foreground text-xs tracking-[0.25em] uppercase">
              Mark · Measure · Stitch
            </p>
          </div>

          <div className="mb-8">
            <h2 className="font-display text-xl font-semibold text-foreground mb-1">
              Client Portal
            </h2>
            <p className="text-muted-foreground text-sm">
              Sign in with the email and access code provided by your LEAA team.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium">Email Address</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@yourbrand.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="h-11 bg-card border-border"
                data-testid="input-email"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="accessCode" className="text-sm font-medium">Access Code</Label>
              <Input
                id="accessCode"
                type="text"
                placeholder="Enter your access code"
                value={accessCode}
                onChange={(e) => setAccessCode(e.target.value)}
                className="h-11 bg-card border-border font-mono tracking-wider"
                data-testid="input-access-code"
                required
              />
            </div>

            <Button
              type="submit"
              className="w-full h-11 font-semibold"
              disabled={isSubmitting}
              data-testid="button-login"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Signing in...
                </>
              ) : (
                "Sign In"
              )}
            </Button>
          </form>

          <div className="mt-6 p-4 rounded-lg bg-card border border-border">
            <p className="text-xs text-muted-foreground mb-2 font-medium">Demo Access</p>
            <p className="text-xs text-muted-foreground">
              Email: <span className="font-mono text-foreground">demo@leaa.com</span>
            </p>
            <p className="text-xs text-muted-foreground">
              Code: <span className="font-mono text-foreground">LEAA2026</span>
            </p>
          </div>

          <p className="mt-8 text-center text-xs text-muted-foreground">
            Need access? Contact{" "}
            <a
              href="mailto:info@laneellisapparelagency.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline"
            >
              info@laneellisapparelagency.com
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}

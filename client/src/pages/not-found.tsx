import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] p-6 text-center">
      <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
        <span className="text-2xl font-bold text-muted-foreground">?</span>
      </div>
      <h1 className="font-display text-xl font-semibold text-foreground mb-2">Page not found</h1>
      <p className="text-sm text-muted-foreground mb-6 max-w-sm">
        The page you're looking for doesn't exist. Head back to your dashboard.
      </p>
      <Link href="/">
        <Button variant="outline" className="gap-2" data-testid="button-back-dashboard">
          <ArrowLeft className="w-4 h-4" />
          Back to Dashboard
        </Button>
      </Link>
    </div>
  );
}

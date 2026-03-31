import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  User, Building2, Mail, Shield, LogOut, ExternalLink,
  CreditCard, DollarSign, Calendar, CheckCircle2, Clock, AlertTriangle,
  Download, FileText,
} from "lucide-react";
import { format, parseISO } from "date-fns";

interface Payment {
  id: number;
  description: string;
  amount: number;
  status: string;
  dueDate: string;
  paidDate: string | null;
}

const paymentStatusConfig: Record<string, { label: string; className: string; icon: any }> = {
  paid: { label: "Paid", className: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400", icon: CheckCircle2 },
  pending: { label: "Pending", className: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400", icon: Clock },
  overdue: { label: "Overdue", className: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400", icon: AlertTriangle },
};

export default function ProfilePage() {
  const { user, logout } = useAuth();

  const { data: projects } = useQuery<Array<{
    id: number;
    name: string;
    serviceType: string;
    status: string;
    startDate: string;
    endDate: string | null;
  }>>({
    queryKey: ["/api/projects"],
  });

  const { data: payments } = useQuery<Payment[]>({
    queryKey: ["/api/payments"],
  });

  const project = projects?.[0];
  const nextPayment = payments?.find((p) => p.status === "pending" || p.status === "overdue");
  const totalPaid = payments?.filter((p) => p.status === "paid").reduce((s, p) => s + p.amount, 0) || 0;

  return (
    <div className="p-6 space-y-6 max-w-3xl mx-auto" data-testid="profile-page">
      <div>
        <h1 className="font-display text-xl font-semibold text-foreground">Profile & Billing</h1>
        <p className="text-sm text-muted-foreground mt-1">Your account, contract, and payment information</p>
      </div>

      {/* Profile Card */}
      <Card className="border-border/50 shadow-sm">
        <CardContent className="p-6">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
              <span className="text-xl font-bold text-primary">
                {user?.name?.split(" ").map((n) => n[0]).join("")}
              </span>
            </div>
            <div>
              <h2 className="text-lg font-semibold text-foreground" data-testid="text-profile-name">{user?.name}</h2>
              <p className="text-sm text-muted-foreground">{user?.brandName}</p>
            </div>
          </div>

          <Separator className="mb-6" />

          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <Mail className="w-4 h-4 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">Email</p>
                <p className="text-sm text-foreground">{user?.email}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Building2 className="w-4 h-4 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">Brand</p>
                <p className="text-sm text-foreground">{user?.brandName}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Shield className="w-4 h-4 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">Account Type</p>
                <p className="text-sm text-foreground capitalize">{user?.role}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Contract & Service Details */}
      {project && (
        <Card className="border-border/50 shadow-sm">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="font-display text-lg">Contract & Service</CardTitle>
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 border border-green-200 dark:border-green-800">
                <CheckCircle2 className="w-3 h-3" />
                Active
              </span>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-4 rounded-lg bg-muted/30 border border-border/30">
              <h3 className="text-sm font-semibold text-foreground">{project.name}</h3>
              <p className="text-xs text-muted-foreground mt-1">{project.serviceType}</p>
              <div className="grid grid-cols-2 gap-4 mt-3">
                <div>
                  <p className="text-xs text-muted-foreground">Start Date</p>
                  <p className="text-sm text-foreground">{format(parseISO(project.startDate), "MMM d, yyyy")}</p>
                </div>
                {project.endDate && (
                  <div>
                    <p className="text-xs text-muted-foreground">Target Completion</p>
                    <p className="text-sm text-foreground">{format(parseISO(project.endDate), "MMM d, yyyy")}</p>
                  </div>
                )}
              </div>
            </div>

            <div className="p-4 rounded-lg bg-primary/5 border border-primary/10">
              <div className="flex items-center gap-2 mb-2">
                <DollarSign className="w-4 h-4 text-primary" />
                <span className="text-sm font-semibold text-foreground">Package Details</span>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <p className="text-xs text-muted-foreground">Total Cost</p>
                  <p className="text-sm font-semibold text-foreground">$2,700</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Rate</p>
                  <p className="text-sm text-foreground">$75/hr</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Total Hours</p>
                  <p className="text-sm text-foreground">36 hrs</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Payment History */}
      <Card className="border-border/50 shadow-sm">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="font-display text-lg">Payment History</CardTitle>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <CreditCard className="w-3.5 h-3.5" />
              ${totalPaid.toLocaleString()} paid
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {nextPayment && (
            <div className="p-3 rounded-lg bg-yellow-50 dark:bg-yellow-900/10 border border-yellow-200 dark:border-yellow-800/30 mb-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-yellow-600 dark:text-yellow-400" />
                  <div>
                    <p className="text-sm font-medium text-foreground">Next Payment Due</p>
                    <p className="text-xs text-muted-foreground">
                      {nextPayment.description} — ${nextPayment.amount.toLocaleString()}
                    </p>
                  </div>
                </div>
                <span className="text-sm font-semibold text-foreground">
                  {format(parseISO(nextPayment.dueDate), "MMM d, yyyy")}
                </span>
              </div>
            </div>
          )}

          {payments && payments.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-xs">Date</TableHead>
                  <TableHead className="text-xs">Description</TableHead>
                  <TableHead className="text-xs text-right">Amount</TableHead>
                  <TableHead className="text-xs text-center">Status</TableHead>
                  <TableHead className="text-xs text-right"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {payments.map((p) => {
                  const config = paymentStatusConfig[p.status] || paymentStatusConfig.pending;
                  const Icon = config.icon;
                  return (
                    <TableRow key={p.id} data-testid={`payment-row-${p.id}`}>
                      <TableCell className="text-sm">
                        {p.paidDate ? format(parseISO(p.paidDate), "MMM d, yyyy") : format(parseISO(p.dueDate), "MMM d, yyyy")}
                      </TableCell>
                      <TableCell className="text-sm">{p.description}</TableCell>
                      <TableCell className="text-sm text-right font-mono">
                        ${p.amount.toLocaleString()}
                      </TableCell>
                      <TableCell className="text-center">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${config.className}`}>
                          <Icon className="w-3 h-3" />
                          {config.label}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="sm" className="h-7 text-xs" data-testid={`button-invoice-${p.id}`}>
                          <Download className="w-3 h-3 mr-1" />
                          Invoice
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-4">No payment records available.</p>
          )}
        </CardContent>
      </Card>

      {/* Contact & Sign Out */}
      <Card className="border-border/50 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="font-display text-lg">Account Actions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <a
            href="mailto:info@laneellisapparelagency.com"
            target="_blank"
            rel="noopener noreferrer"
          >
            <Button variant="outline" className="w-full justify-start gap-3" data-testid="link-contact-leaa">
              <Mail className="w-4 h-4" />
              Contact LEAA Team
              <ExternalLink className="w-3 h-3 ml-auto text-muted-foreground" />
            </Button>
          </a>
          <Button
            variant="outline"
            className="w-full justify-start gap-3 text-destructive hover:text-destructive"
            onClick={logout}
            data-testid="button-sign-out"
          >
            <LogOut className="w-4 h-4" />
            Sign Out
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Plus, User, ArrowRight, RefreshCw } from "lucide-react";
import { useLocation } from "wouter";

const SERVICE_TYPES = [
  "Concept Development 60-Day",
  "Monthly Retainer 5hr",
  "Monthly Retainer 10hr",
  "Monthly Retainer 20hr",
];

function generateAccessCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "LEAA";
  for (let i = 0; i < 4; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

export default function AdminClients() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [showAddClient, setShowAddClient] = useState(false);
  const [form, setForm] = useState({
    name: "",
    email: "",
    brandName: "",
    accessCode: generateAccessCode(),
    serviceType: "",
    startDate: new Date().toISOString().split("T")[0],
  });

  const { data: clients = [], isLoading } = useQuery<any[]>({
    queryKey: ["/api/admin/clients"],
  });

  const createClient = useMutation({
    mutationFn: async (data: typeof form) => {
      const res = await apiRequest("POST", "/api/admin/clients", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/clients"] });
      setShowAddClient(false);
      setForm({
        name: "",
        email: "",
        brandName: "",
        accessCode: generateAccessCode(),
        serviceType: "",
        startDate: new Date().toISOString().split("T")[0],
      });
      toast({ title: "Client created successfully!" });
    },
    onError: (e: any) => {
      toast({ title: "Error creating client", description: e.message, variant: "destructive" });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.serviceType) {
      toast({ title: "Please select a service type", variant: "destructive" });
      return;
    }
    createClient.mutate(form);
  };

  const getStatusColor = (status: string) => {
    if (status === "active") return "border-green-500/40 text-green-600 bg-green-500/5";
    if (status === "paused") return "border-amber-500/40 text-amber-600 bg-amber-500/5";
    return "border-border text-muted-foreground";
  };

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground font-['Playfair_Display']">
            Client Management
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            {clients.length} total client{clients.length !== 1 ? "s" : ""}
          </p>
        </div>
        <Button
          onClick={() => setShowAddClient(true)}
          className="bg-[#B7542E] hover:bg-[#a3472a] text-white"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add New Client
        </Button>
      </div>

      {/* Clients Table */}
      <Card className="bg-card border border-border/50">
        <CardContent className="p-0">
          {isLoading ? (
            <div className="space-y-1 p-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-16 bg-muted/30 rounded-lg animate-pulse" />
              ))}
            </div>
          ) : clients.length === 0 ? (
            <div className="text-center py-16">
              <User className="w-12 h-12 mx-auto text-muted-foreground/30 mb-3" />
              <p className="text-muted-foreground">No clients yet</p>
              <p className="text-sm text-muted-foreground/70 mt-1">
                Add your first client to get started
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border/50">
                    <th className="text-left text-xs font-medium text-muted-foreground px-4 py-3 uppercase tracking-wider">
                      Client
                    </th>
                    <th className="text-left text-xs font-medium text-muted-foreground px-4 py-3 uppercase tracking-wider">
                      Brand
                    </th>
                    <th className="text-left text-xs font-medium text-muted-foreground px-4 py-3 uppercase tracking-wider hidden md:table-cell">
                      Service
                    </th>
                    <th className="text-left text-xs font-medium text-muted-foreground px-4 py-3 uppercase tracking-wider hidden lg:table-cell">
                      Status
                    </th>
                    <th className="text-left text-xs font-medium text-muted-foreground px-4 py-3 uppercase tracking-wider hidden lg:table-cell">
                      Progress
                    </th>
                    <th className="text-right text-xs font-medium text-muted-foreground px-4 py-3 uppercase tracking-wider">
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {clients.map((client: any) => (
                    <tr
                      key={client.id}
                      className="border-b border-border/30 last:border-0 hover:bg-muted/20 transition-colors cursor-pointer"
                      onClick={() => navigate(`/admin/clients/${client.id}`)}
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-[#B7542E]/10 flex items-center justify-center flex-shrink-0">
                            <span className="text-xs font-bold text-[#B7542E]">
                              {client.name
                                .split(" ")
                                .map((n: string) => n[0])
                                .join("")}
                            </span>
                          </div>
                          <div>
                            <p className="text-sm font-medium text-foreground">{client.name}</p>
                            <p className="text-xs text-muted-foreground">{client.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-sm text-foreground">{client.brandName}</p>
                      </td>
                      <td className="px-4 py-3 hidden md:table-cell">
                        <p className="text-sm text-muted-foreground">
                          {client.project?.serviceType || "—"}
                        </p>
                      </td>
                      <td className="px-4 py-3 hidden lg:table-cell">
                        <Badge
                          variant="outline"
                          className={`text-xs ${getStatusColor(client.project?.status || "")}`}
                        >
                          {client.project?.status || "no project"}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 hidden lg:table-cell">
                        <div className="flex items-center gap-2">
                          <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden min-w-[60px]">
                            <div
                              className="h-full bg-[#B7542E] rounded-full transition-all"
                              style={{ width: `${client.overallProgress}%` }}
                            />
                          </div>
                          <span className="text-xs text-muted-foreground w-8">
                            {client.overallProgress}%
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-muted-foreground hover:text-foreground"
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/admin/clients/${client.id}`);
                          }}
                        >
                          <ArrowRight className="w-4 h-4" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add Client Dialog */}
      <Dialog open={showAddClient} onOpenChange={setShowAddClient}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="font-['Playfair_Display']">Add New Client</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="name">Full Name</Label>
              <Input
                id="name"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Jane Smith"
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="jane@brand.com"
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="brandName">Brand Name</Label>
              <Input
                id="brandName"
                value={form.brandName}
                onChange={(e) => setForm({ ...form, brandName: e.target.value })}
                placeholder="Jane's Brand Co."
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="accessCode">Access Code</Label>
              <div className="flex gap-2">
                <Input
                  id="accessCode"
                  value={form.accessCode}
                  onChange={(e) => setForm({ ...form, accessCode: e.target.value })}
                  placeholder="LEAAXXXX"
                  required
                />
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={() => setForm({ ...form, accessCode: generateAccessCode() })}
                >
                  <RefreshCw className="w-4 h-4" />
                </Button>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Service Type</Label>
              <Select
                value={form.serviceType}
                onValueChange={(v) => setForm({ ...form, serviceType: v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a service..." />
                </SelectTrigger>
                <SelectContent>
                  {SERVICE_TYPES.map((s) => (
                    <SelectItem key={s} value={s}>
                      {s}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="startDate">Start Date</Label>
              <Input
                id="startDate"
                type="date"
                value={form.startDate}
                onChange={(e) => setForm({ ...form, startDate: e.target.value })}
                required
              />
            </div>
            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" onClick={() => setShowAddClient(false)}>
                Cancel
              </Button>
              <Button
                type="submit"
                className="bg-[#B7542E] hover:bg-[#a3472a] text-white"
                disabled={createClient.isPending}
              >
                {createClient.isPending ? "Creating..." : "Create Client"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}


import {
  LayoutDashboard,
  Target,
  FileDown,
  MessageSquare,
  LifeBuoy,
  Library,
  User,
  LogOut,
  Phone,
  CalendarClock,
  CreditCard,
  Users,
  FolderOpen,
  Ticket,
  Package,
  BookOpen,
  ShieldCheck,
  ArrowLeftRight,
  Shirt,
  Scissors,
  FileText,
  CheckSquare,
  Timer,
  Bell,
  ClipboardList,
} from "lucide-react";
import { Link, useLocation } from "wouter";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
  SidebarSeparator,
} from "@/components/ui/sidebar";
import { useAuth } from "@/hooks/use-auth";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useState, useRef, useEffect } from "react";
import { formatDistanceToNow } from "date-fns";
import leaaLogo from "@assets/leaa-logo.jpg";

const mainNav = [
  { title: "Dashboard", url: "/", icon: LayoutDashboard },
  { title: "My Project", url: "/milestones", icon: Target },
  { title: "Design Board", url: "/design-board", icon: Shirt },
  { title: "Materials & Sourcing", url: "/sourcing", icon: Scissors },
  { title: "Deliverables", url: "/deliverables", icon: FileDown },
  { title: "Documents", url: "/documents", icon: FileText },
  { title: "Messages", url: "/messages", icon: MessageSquare },
  { title: "Support", url: "/support", icon: LifeBuoy },
  { title: "Resources", url: "/resources", icon: Library },
];

type NavItem = {
  title: string;
  url: string;
  icon: any;
  badgeKey?: "overdue" | "unread";
};

const adminNav: NavItem[] = [
  { title: "Dashboard", url: "/admin", icon: LayoutDashboard },
  { title: "Tasks", url: "/admin/tasks", icon: ClipboardList, badgeKey: "overdue" },
  { title: "Clients", url: "/admin/clients", icon: Users },
  { title: "Projects", url: "/admin/projects", icon: FolderOpen },
  { title: "Tickets", url: "/admin/tickets", icon: Ticket },
  { title: "Messages", url: "/admin/messages", icon: MessageSquare },
  { title: "Deliverables", url: "/admin/deliverables", icon: Package },
  { title: "Design Management", url: "/admin/design", icon: Shirt },
  { title: "Sourcing", url: "/admin/sourcing", icon: Scissors },
  { title: "Documents & Legal", url: "/admin/documents", icon: FileText },
  { title: "Approvals", url: "/admin/approvals", icon: CheckSquare },
  { title: "Hour Tracking", url: "/admin/hours", icon: Timer },
  { title: "Notifications", url: "/admin/notifications", icon: Bell, badgeKey: "unread" },
];

const quickLinks = [
  { title: "Contact LEAA", url: "mailto:info@laneellisapparelagency.com", icon: Phone, external: true },
  { title: "Schedule Session", url: "mailto:info@laneellisapparelagency.com?subject=Schedule%20Session", icon: CalendarClock, external: true },
];

function AdminNotificationBell() {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const { data: notifications = [] } = useQuery<any[]>({
    queryKey: ["/api/admin/notifications", "unread"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/admin/notifications?read=unread");
      return res.json();
    },
    refetchInterval: 30000,
  });

  const markRead = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("POST", `/api/admin/notifications/${id}/read`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/notifications"] });
    },
  });

  const markAll = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", "/api/admin/notifications/read-all");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/notifications"] });
    },
  });

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const unread = notifications.length;

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        className="relative flex items-center justify-center w-8 h-8 rounded-lg hover:bg-sidebar-accent transition-colors"
        title="Admin Notifications"
      >
        <Bell className="w-4 h-4 text-sidebar-foreground/70" />
        {unread > 0 && (
          <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-[#B7542E] flex items-center justify-center text-white text-[9px] font-bold">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute left-8 top-0 z-50 w-80 bg-popover border border-border rounded-xl shadow-lg overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-border">
            <span className="text-sm font-semibold">
              {unread > 0 ? `${unread} unread` : "Notifications"}
            </span>
            {unread > 0 && (
              <button
                className="text-xs text-[#B7542E] hover:underline"
                onClick={() => markAll.mutate()}
              >
                Mark all read
              </button>
            )}
          </div>
          <div className="max-h-72 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="text-center py-8 text-xs text-muted-foreground">
                All caught up!
              </div>
            ) : (
              notifications.slice(0, 8).map((n: any) => (
                <div
                  key={n.id}
                  className="flex items-start gap-3 px-4 py-3 hover:bg-muted/30 cursor-pointer border-b border-border/30 last:border-0"
                  onClick={() => markRead.mutate(n.id)}
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-[#B7542E] flex-shrink-0 mt-1.5" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-foreground leading-snug">{n.title}</p>
                    {n.clientName && (
                      <p className="text-xs text-muted-foreground/70">{n.clientName}</p>
                    )}
                    <p className="text-xs text-muted-foreground/60 mt-0.5">
                      {formatDistanceToNow(new Date(n.createdAt), { addSuffix: true })}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
          <div className="px-4 py-2.5 border-t border-border">
            <Link href="/admin/notifications">
              <button
                className="text-xs text-[#B7542E] hover:underline w-full text-center"
                onClick={() => setOpen(false)}
              >
                View all notifications →
              </button>
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}

export function AppSidebar() {
  const [location] = useLocation();
  const { user, logout } = useAuth();
  const isAdmin = user?.role === "admin";
  const navItems = isAdmin ? adminNav : mainNav;

  // Fetch overdue count for task badge
  const { data: dashV2 } = useQuery<any>({
    queryKey: ["/api/admin/dashboard-v2"],
    enabled: isAdmin,
    refetchInterval: 60000,
  });

  const overdueTasks = dashV2?.overdueTasks ?? 0;
  const unreadNotifs = dashV2?.unreadNotifications ?? 0;

  const isNavActive = (url: string) => {
    if (url === "/" && !isAdmin) return location === "/";
    if (url === "/admin" && isAdmin) return location === "/admin";
    return location.startsWith(url) && url !== "/";
  };

  return (
    <Sidebar className="border-r-0">
      <SidebarHeader className="px-4 py-5">
        <div className="flex items-center gap-3">
          <img src={leaaLogo} alt="LEAA" className="w-10 h-10 rounded object-cover" />
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-sidebar-foreground truncate">LEAA</p>
            <p className="text-xs text-sidebar-foreground/50 tracking-[0.15em] uppercase">
              {isAdmin ? "Admin Panel" : "Client Portal"}
            </p>
          </div>
          {isAdmin && <AdminNotificationBell />}
        </div>
        {isAdmin && (
          <div className="mt-2 flex items-center gap-1.5 px-2 py-1 rounded-md bg-[#B7542E]/10">
            <ShieldCheck className="w-3.5 h-3.5 text-[#B7542E]" />
            <span className="text-xs font-medium text-[#B7542E]">Admin View</span>
          </div>
        )}
      </SidebarHeader>

      <SidebarSeparator className="bg-sidebar-border" />

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="text-sidebar-foreground/40 text-xs uppercase tracking-wider">
            {isAdmin ? "Admin Navigation" : "Navigation"}
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => {
                const isActive = isNavActive(item.url);
                const badge =
                  item.badgeKey === "overdue" && overdueTasks > 0
                    ? overdueTasks
                    : item.badgeKey === "unread" && unreadNotifs > 0
                    ? unreadNotifs
                    : null;

                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      asChild
                      isActive={isActive}
                      data-testid={`nav-${item.title.toLowerCase().replace(/\s/g, "-")}`}
                    >
                      <Link href={item.url}>
                        <item.icon className="w-4 h-4" />
                        <span className="flex-1">{item.title}</span>
                        {badge != null && (
                          <span className={`ml-auto text-xs font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center ${
                            item.badgeKey === "overdue"
                              ? "bg-red-500 text-white"
                              : "bg-[#B7542E] text-white"
                          }`}>
                            {badge > 9 ? "9+" : badge}
                          </span>
                        )}
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarSeparator className="bg-sidebar-border" />

        {!isAdmin && (
          <SidebarGroup>
            <SidebarGroupLabel className="text-sidebar-foreground/40 text-xs uppercase tracking-wider">
              Quick Links
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {quickLinks.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild data-testid={`link-${item.title.toLowerCase().replace(/\s/g, "-")}`}>
                      <a href={item.url} target="_blank" rel="noopener noreferrer">
                        <item.icon className="w-4 h-4" />
                        <span>{item.title}</span>
                      </a>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarContent>

      <SidebarFooter className="px-4 py-4">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-8 h-8 rounded-full bg-[#B7542E]/20 flex items-center justify-center flex-shrink-0">
            <span className="text-xs font-bold text-[#B7542E]">
              {user?.name?.split(" ").map((n) => n[0]).join("")}
            </span>
          </div>
          <div className="min-w-0">
            <p className="text-xs font-semibold text-sidebar-foreground truncate">{user?.name}</p>
            <p className="text-xs text-sidebar-foreground/50 truncate">
              {isAdmin ? "LEAA Administrator" : user?.brandName}
            </p>
          </div>
        </div>
        <SidebarMenu>
          {!isAdmin && (
            <SidebarMenuItem>
              <SidebarMenuButton asChild data-testid="nav-profile">
                <Link href="/profile">
                  <CreditCard className="w-4 h-4" />
                  <span>Profile & Billing</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          )}
          <SidebarMenuItem>
            <SidebarMenuButton
              onClick={logout}
              data-testid="button-logout"
            >
              <LogOut className="w-4 h-4" />
              <span>Sign Out</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}


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
import leaaLogo from "@assets/leaa-logo.jpg";

const mainNav = [
  { title: "Dashboard", url: "/", icon: LayoutDashboard },
  { title: "My Project", url: "/milestones", icon: Target },
  { title: "Deliverables", url: "/deliverables", icon: FileDown },
  { title: "Messages", url: "/messages", icon: MessageSquare },
  { title: "Support", url: "/support", icon: LifeBuoy },
  { title: "Resources", url: "/resources", icon: Library },
];

const adminNav = [
  { title: "Dashboard", url: "/admin", icon: LayoutDashboard },
  { title: "Clients", url: "/admin/clients", icon: Users },
  { title: "Projects", url: "/admin/projects", icon: FolderOpen },
  { title: "Tickets", url: "/admin/tickets", icon: Ticket },
  { title: "Messages", url: "/admin/messages", icon: MessageSquare },
  { title: "Deliverables", url: "/admin/deliverables", icon: Package },
];

const quickLinks = [
  { title: "Contact LEAA", url: "mailto:info@laneellisapparelagency.com", icon: Phone, external: true },
  { title: "Schedule Session", url: "mailto:info@laneellisapparelagency.com?subject=Schedule%20Session", icon: CalendarClock, external: true },
];

export function AppSidebar() {
  const [location] = useLocation();
  const { user, logout } = useAuth();
  const isAdmin = user?.role === "admin";
  const navItems = isAdmin ? adminNav : mainNav;

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
          <div className="min-w-0">
            <p className="text-sm font-semibold text-sidebar-foreground truncate">LEAA</p>
            <p className="text-xs text-sidebar-foreground/50 tracking-[0.15em] uppercase">
              {isAdmin ? "Admin Panel" : "Client Portal"}
            </p>
          </div>
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
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      asChild
                      isActive={isActive}
                      data-testid={`nav-${item.title.toLowerCase().replace(/\s/g, "-")}`}
                    >
                      <Link href={item.url}>
                        <item.icon className="w-4 h-4" />
                        <span>{item.title}</span>
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


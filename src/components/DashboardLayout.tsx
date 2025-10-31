import { ReactNode, useState } from 'react';
import { Button } from './ui/button';
import { Sheet, SheetContent, SheetTrigger } from './ui/sheet';
import { 
  Menu, 
  Bell, 
  Wallet, 
  Settings, 
  LogOut,
  Shield,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from './ui/dropdown-menu';
import { Badge } from './ui/badge';
import { ScrollArea } from './ui/scroll-area';
import type { Page } from '../App';
import { cn } from "@/lib/utils"

interface DashboardLayoutProps {
  children: ReactNode;
  sidebarItems: Array<{
    icon: any;
    label: string;
    active?: boolean;
    onClick: () => void;
    badge?: number;
  }>;
  title: string;
  onNavigate: (page: Page) => void;
  onLogout: () => void;
  walletBalance?: string;
  notifications?: Array<{
    id: string;
    title: string;
    message: string;
    time: string;
    read: boolean;
  }>;
}

export default function DashboardLayout({ 
  children, 
  sidebarItems, 
  title,
  onNavigate,
  onLogout,
  walletBalance = '$0.00',
  notifications = []
}: DashboardLayoutProps) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const unreadCount = notifications.filter(n => !n.read).length;

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b flex items-center justify-between">
        {!sidebarCollapsed && (
          <div className="flex items-center gap-2">
            <Shield className="w-6 h-6 text-primary" />
            <span className="font-['Poppins'] font-semibold">Tag Chain</span>
          </div>
        )}
        <Button
          variant="ghost"
          size="icon"
          className="hidden lg:flex"
          onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
        >
          {sidebarCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </Button>
      </div>

      <ScrollArea className="flex-1 p-2">
        <nav className="space-y-1">
          {sidebarItems.map((item: any, index: number) => (
            <Button
              key={index}
              variant={item.active ? "secondary" : "ghost"}
              className={`w-full justify-start ${sidebarCollapsed ? 'px-2' : ''}`}
              onClick={() => {
                item.onClick();
                // Close mobile menu after selection
                const mobileMenuCheckbox = document.querySelector('.lg\\:hidden + div input[type="checkbox"]');
                if (mobileMenuCheckbox) {
                  (mobileMenuCheckbox as HTMLInputElement).checked = false;
                }
              }}
            >
              <item.icon className={`${sidebarCollapsed ? 'w-5 h-5' : 'w-4 h-4 mr-2'}`} />
              {!sidebarCollapsed && (
                <>
                  {item.label}
                  {item.badge !== undefined && item.badge > 0 && (
                    <Badge className="ml-auto" variant="destructive">
                      {item.badge}
                    </Badge>
                  )}
                </>
              )}
            </Button>
          ))}
        </nav>
      </ScrollArea>

      <div className="p-4 border-t">
        <Button
          variant="ghost"
          className={`w-full justify-start text-destructive hover:text-destructive hover:bg-destructive/10 ${sidebarCollapsed ? 'px-2' : ''}`}
          onClick={onLogout}
        >
          <LogOut className={`${sidebarCollapsed ? 'w-5 h-5' : 'w-4 h-4 mr-2'}`} />
          {!sidebarCollapsed && 'Logout'}
        </Button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-background flex">
      {/* Desktop Sidebar */}
      <aside className={`hidden lg:block bg-card border-r transition-all duration-300 ${sidebarCollapsed ? 'w-16' : 'w-64'}`}>
        <SidebarContent />
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Top Navigation */}
        <header className="bg-card border-b sticky top-0 z-40">
          <div className="flex items-center justify-between px-4 py-3">
            <div className="flex items-center gap-4">
              {/* Mobile Menu */}
              <Sheet>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="icon" className="lg:hidden">
                    <Menu className="w-5 h-5" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="left" className="w-64 p-0">
                  <SidebarContent />
                </SheetContent>
              </Sheet>

              <h1 className="font-['Poppins']">{title}</h1>
            </div>

            <div className="flex items-center gap-2">
              {/* Wallet Balance */}
              <Button 
                variant="outline" 
                className="hidden md:flex items-center gap-2"
                onClick={() => onNavigate('wallet')}
              >
                <Wallet className="w-4 h-4" />
                {walletBalance}
              </Button>

              {/* Notifications */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="relative">
                    <Bell className="w-5 h-5" />
                    {unreadCount > 0 && (
                      <span className="absolute -top-1 -right-1 w-5 h-5 bg-destructive text-destructive-foreground text-xs rounded-full flex items-center justify-center">
                        {unreadCount}
                      </span>
                    )}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-80">
                  <DropdownMenuLabel>Notifications</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <ScrollArea className="h-[300px]">
                    {notifications.length === 0 ? (
                      <div className="p-4 text-center text-sm text-muted-foreground">
                        No notifications
                      </div>
                    ) : (
                      notifications.map((notif: any) => (
                        <DropdownMenuItem key={notif.id} className="flex-col items-start p-3">
                          <div className="flex items-start justify-between w-full">
                            <div className="flex-1">
                              <p className="font-medium text-sm">{notif.title}</p>
                              <p className="text-xs text-muted-foreground mt-1">{notif.message}</p>
                              <p className="text-xs text-muted-foreground mt-1">{notif.time}</p>
                            </div>
                            {!notif.read && (
                              <div className="w-2 h-2 bg-primary rounded-full mt-1" />
                            )}
                          </div>
                        </DropdownMenuItem>
                      ))
                    )}
                  </ScrollArea>
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Settings */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <Settings className="w-5 h-5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuLabel>My Account</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => onNavigate('marketplace')}>
                    Go to Marketplace
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem 
                    className="text-destructive focus:text-destructive"
                    onClick={onLogout}
                  >
                    Logout
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </header>

        {/* Main Content Area */}
        <main className="flex-1 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
import React, { useEffect, useState } from 'react';
import { NavLink, Link, useLocation } from 'react-router-dom';
import { LogOut, PanelLeft } from 'lucide-react';
import { Bell, BellBadge, Moon2, Sun } from '@duo-icons/react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

function useTheme() {
  const [dark, setDark] = useState(() => {
    try {
      return localStorage.getItem('theme') === 'dark';
    } catch {
      return false;
    }
  });
  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark);
    try {
      localStorage.setItem('theme', dark ? 'dark' : 'light');
    } catch {
      /* ignore */
    }
  }, [dark]);
  return [dark, setDark];
}

// Shared shell for the admin and student portals (ObsidianUI look).
export default function PortalLayout({ brand, menu, children, notificationsPath }) {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [dark, setDark] = useTheme();
  const [open, setOpen] = useState(false);
  const [unread, setUnread] = useState(0);

  // Close the mobile drawer when navigating.
  useEffect(() => setOpen(false), [location.pathname]);

  // Students see an unread badge; refresh on navigation so new admin posts show up.
  useEffect(() => {
    if (!notificationsPath) return;
    api
      .get('/notifications/unread-count')
      .then((res) => setUnread(res.data?.count ?? res.data?.unread ?? 0))
      .catch(() => {});
  }, [notificationsPath, location.pathname]);

  const title = menu.find((m) => location.pathname.startsWith(m.path))?.name || brand;

  return (
    <div className="flex h-screen bg-background text-foreground">
      {open && (
        <div className="fixed inset-0 z-20 bg-black/50 lg:hidden" onClick={() => setOpen(false)} />
      )}

      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-30 flex w-64 flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground transition-transform duration-300 lg:static lg:translate-x-0',
          open ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <div className="flex h-16 items-center gap-2 border-b border-sidebar-border px-6">
          <div className="flex size-8 items-center justify-center rounded-lg bg-primary text-sm font-bold text-primary-foreground">
            M
          </div>
          <span className="text-base font-semibold tracking-tight">{brand}</span>
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
          {menu.map(({ name, icon: Icon, path }) => (
            <NavLink
              key={path}
              to={path}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                    : 'text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
                )
              }
            >
              <Icon className="size-5" />
              <span>{name}</span>
            </NavLink>
          ))}
        </nav>

        <div className="border-t border-sidebar-border p-3">
          <button
            onClick={logout}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-sidebar-accent hover:text-destructive"
          >
            <LogOut className="size-5" />
            Logout
          </button>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-16 items-center justify-between border-b border-border bg-background px-4 lg:px-8">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" className="lg:hidden" onClick={() => setOpen(true)}>
              <PanelLeft />
            </Button>
            <h1 className="text-lg font-semibold tracking-tight">{title}</h1>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              aria-label="Toggle theme"
              onClick={() => setDark((d) => !d)}
            >
              {dark ? <Sun className="size-5" /> : <Moon2 className="size-5" />}
            </Button>

            {notificationsPath && (
              <Button variant="ghost" size="icon" asChild aria-label="Notifications" className="relative">
                <Link to={notificationsPath}>
                  {unread > 0 ? <BellBadge className="size-5" /> : <Bell className="size-5" />}
                  {unread > 0 && (
                    <Badge className="absolute -right-1 -top-1 h-4 min-w-4 justify-center px-1 text-[10px]">
                      {unread}
                    </Badge>
                  )}
                </Link>
              </Button>
            )}

            <div className="ml-2 flex items-center gap-3">
              <span className="hidden text-sm text-muted-foreground sm:block">{user?.name}</span>
              <div className="flex size-8 items-center justify-center rounded-full bg-secondary text-sm font-medium">
                {user?.name?.charAt(0) || '?'}
              </div>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto bg-muted/40 p-4 lg:p-8">{children}</main>
      </div>
    </div>
  );
}

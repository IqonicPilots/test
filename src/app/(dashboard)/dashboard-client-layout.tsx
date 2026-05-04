"use client";

import React from "react";
import { usePathname, useRouter } from "next/navigation";
import { AppSidebar } from "@/components/app-sidebar";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { ThemeCustomizer, ThemeCustomizerTrigger } from "@/components/theme-customizer";
import { useSidebarConfig } from "@/hooks/use-sidebar-config";
import { getStoredAuthSession } from "@/lib/auth-session";
import { useSystemConfig } from "@/hooks/api/use-system-config";
import { getDashboardPageTitle } from "@/lib/dashboard-page-title";
import { useAuthRole } from "@/hooks/use-auth-role";

export default function DashboardClientLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [themeCustomizerOpen, setThemeCustomizerOpen] = React.useState(false);
  const [isAuthorized, setIsAuthorized] = React.useState(false);
  const { config } = useSidebarConfig();
  const { data: systemConfig } = useSystemConfig(isAuthorized);
  const { role } = useAuthRole();
  const isAdmin = role === "admin";

  React.useEffect(() => {
    if (systemConfig?.hide_customizer === true) {
      setThemeCustomizerOpen(false);
    }
  }, [systemConfig?.hide_customizer]);

  React.useEffect(() => {
    const session = getStoredAuthSession();

    if (!session?.accessToken) {
      router.replace("/");
      return;
    }

    setIsAuthorized(true);
  }, [router]);

  React.useEffect(() => {
    if (!isAuthorized) return;

    const pageTitle = getDashboardPageTitle(pathname || "/dashboard");
    document.title = pageTitle;
  }, [isAuthorized, pathname]);

  if (!isAuthorized) {
    return null;
  }

  return (
      <SidebarProvider
      style={{
        "--sidebar-width": "16rem",
        "--sidebar-width-icon": "3rem",
        "--header-height": "calc(var(--spacing) * 14)",
      } as React.CSSProperties}
      className={config.collapsible === "none" ? "sidebar-none-mode" : ""}
    >
      {config.side === "left" ? (
        <>
          <AppSidebar
            variant={config.variant}
            collapsible={config.collapsible}
            side={config.side}
          />
          <SidebarInset>
            <SiteHeader />
            <div className="flex min-w-0 flex-1 flex-col">
              <div className="@container/main flex min-w-0 flex-1 flex-col gap-2">
                <div className="flex min-w-0 flex-1 flex-col gap-4 py-4 md:gap-6 md:py-6">
                  {children}
                </div>
              </div>
            </div>
            <SiteFooter />
          </SidebarInset>
        </>
      ) : (
        <>
          <SidebarInset>
            <SiteHeader />
            <div className="flex min-w-0 flex-1 flex-col">
              <div className="@container/main flex min-w-0 flex-1 flex-col gap-2">
                <div className="flex min-w-0 flex-1 flex-col gap-4 py-4 md:gap-6 md:py-6">
                  {children}
                </div>
              </div>
            </div>
            <SiteFooter />
          </SidebarInset>
          <AppSidebar
            variant={config.variant}
            collapsible={config.collapsible}
            side={config.side}
          />
        </>
      )}

      {/* Always mount ThemeCustomizer for theme hydration for all users; sheet UI is admin-only */}
      <ThemeCustomizer
        open={themeCustomizerOpen}
        onOpenChange={setThemeCustomizerOpen}
        uiHidden={systemConfig?.hide_customizer === true || !isAdmin}
      />
      {(systemConfig?.hide_customizer !== true && isAdmin) ? (
        <ThemeCustomizerTrigger onClick={() => setThemeCustomizerOpen(true)} />
      ) : null}
    </SidebarProvider>
  );
}

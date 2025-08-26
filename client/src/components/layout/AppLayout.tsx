import { ReactNode } from "react";
import { AppSidebar } from "./AppSidebar";
import { BottomNavigation } from "./BottomNavigation";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { useIsMobile } from "@/hooks/use-mobile";

interface AppLayoutProps {
  children: ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  const isMobile = useIsMobile();

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-gradient-to-br from-background to-muted/30">
        {!isMobile && <AppSidebar />}

        <div className="flex-1 flex flex-col">
          <header className="sticky top-0 z-40 flex h-16 shrink-0 items-center gap-2 border-b bg-background/50 backdrop-blur-sm px-4">
            {!isMobile && <SidebarTrigger />}
            <div className="flex items-center gap-2 flex-1">
                <div className="p-1 rounded-full shadow-lg ring-2 transform transition-transform duration-200 hover:scale-105
                bg-slate-800 shadow-slate-700 ring-slate-300/40
                dark:bg-slate-200 dark:shadow-slate-300 dark:ring-slate-700/40
                ">
                <img src="/logo.png" alt="" className="h-[40px] w-[40px]" />
                </div>

              <h1 className="text-sm lg:text-lg font-semibold bg-base-100">
                Smart To-Do Scheduler
              </h1>
            </div>
            <ThemeToggle />
          </header>

          <main className={`flex-1 ${isMobile ? "pb-20 p-1" : "p-3"}`}>
            {children}
          </main>
        </div>

        {isMobile && <BottomNavigation />}
      </div>
    </SidebarProvider>
  );
}

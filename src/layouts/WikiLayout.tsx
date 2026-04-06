import { Outlet, useNavigate } from "react-router-dom";
import { LogOutIcon, UsersIcon } from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarSeparator,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useAuth } from "@/contexts/AuthContext";
import CategoryTree from "@/components/CategoryTree";
import AiAssistantSheet from "@/components/AiAssistantSheet";

export default function WikiLayout() {
  const { user, role, signOut } = useAuth();
  const navigate = useNavigate();

  return (
    <SidebarProvider>
      <Sidebar collapsible="icon">
        <SidebarHeader className="px-3 py-3">
          <div className="flex items-center gap-2 group-data-[collapsible=icon]:justify-center">
            <span className="text-sm font-semibold tracking-tight group-data-[collapsible=icon]:hidden">
              Pew Pew Wiki
            </span>
          </div>
        </SidebarHeader>

        <SidebarSeparator />

        {/* Category tree — filled in T10 */}
        <SidebarContent>
          <CategoryTree />

          {role === "ADMIN" && (
            <>
              <SidebarSeparator />
              <SidebarGroup>
                <SidebarGroupLabel>Admin</SidebarGroupLabel>
                <SidebarGroupContent>
                  <SidebarMenu>
                    <SidebarMenuItem>
                      <SidebarMenuButton
                        tooltip="User Management"
                        onClick={() => navigate("/admin/users")}
                      >
                        <UsersIcon />
                        <span>User Management</span>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  </SidebarMenu>
                </SidebarGroupContent>
              </SidebarGroup>
            </>
          )}
        </SidebarContent>

        <SidebarSeparator />

        <SidebarFooter className="px-2 py-2">
          <div className="flex items-center justify-between gap-2 group-data-[collapsible=icon]:justify-center">
            <span className="truncate text-xs text-muted-foreground group-data-[collapsible=icon]:hidden">
              {user?.email}
            </span>
            <Tooltip>
              <TooltipTrigger
                render={
                  <Button variant="ghost" size="icon-xs" onClick={signOut} aria-label="Sign out" />
                }
              >
                <LogOutIcon />
              </TooltipTrigger>
              <TooltipContent side="right">Sign out</TooltipContent>
            </Tooltip>
          </div>
        </SidebarFooter>
      </Sidebar>

      <SidebarInset>
        {/* Top bar */}
        <header className="flex h-10 items-center gap-2 border-b px-3">
          <SidebarTrigger />
          <div className="ml-auto">
            <AiAssistantSheet />
          </div>
        </header>

        {/* Page content */}
        <div className="flex-1 overflow-auto p-6">
          <Outlet />
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}

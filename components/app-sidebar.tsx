"use client";

import * as React from "react";
import Image from "next/image";
import {
  IconBriefcase,
  IconDashboard,
  IconFileDescription,
  IconMoon,
  IconPackage,
  IconSettings,
  IconSettings2,
  IconSun,
  IconTool,
  IconUsers,
} from "@tabler/icons-react";
import { useTheme } from "next-themes";

import { NavMain } from "@/components/nav-main";
import { NavSecondary } from "@/components/nav-secondary";
import { NavUser } from "@/components/nav-user";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";


const data = {
  navMain: [
    {
      title: "Dashboard",
      url: "/dashboard",
      icon: IconDashboard,
    },
    {
      title: "Intake",
      url: "/intake",
      icon: IconFileDescription,
    },
    {
      title: "Jobs",
      url: "/jobs",
      icon: IconBriefcase,
    },
    {
      title: "Team",
      url: "/team",
      icon: IconUsers,
    },
    {
      title: "Services",
      url: "/services",
      icon: IconTool,
    },
    {
      title: "Materials",
      url: "/materials",
      icon: IconPackage,
    },
    {
      title: "Options",
      url: "/options",
      icon: IconSettings2,
    },
  ],
  navSecondary: [
    {
      title: "Settings",
      url: "#",
      icon: IconSettings,
    },
  ],
};

function SidebarModeSwitcher() {
  const { setTheme, resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <SidebarMenuButton
          onClick={() => setTheme(isDark ? "light" : "dark")}
          tooltip={isDark ? "Light Mode" : "Dark Mode"}
        >
          {isDark ? <IconSun className="!size-5" /> : <IconMoon className="!size-5" />}
          <span>{isDark ? "Light Mode" : "Dark Mode"}</span>
        </SidebarMenuButton>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              className="data-[slot=sidebar-menu-button]:!p-1.5"
            >
              <a href="/dashboard">
                <Image
                  src="/logo.png"
                  alt="Nashville ClearBra"
                  width={140}
                  height={36}
                  className="h-8 w-auto"
                  priority
                />
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={data.navMain} />
        <NavSecondary items={data.navSecondary} className="mt-auto" />
        <SidebarModeSwitcher />
      </SidebarContent>
      <SidebarFooter>
        <NavUser />
      </SidebarFooter>
    </Sidebar>
  );
}

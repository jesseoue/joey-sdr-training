"use client";

import { History, LayoutDashboard, Phone, Settings, Trophy, Users, Zap } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import {
	Sidebar,
	SidebarContent,
	SidebarFooter,
	SidebarGroup,
	SidebarGroupContent,
	SidebarGroupLabel,
	SidebarHeader,
	SidebarMenu,
	SidebarMenuButton,
	SidebarMenuItem,
	SidebarSeparator,
} from "@/components/ui/sidebar";

const navigation = [
	{
		title: "Dashboard",
		href: "/",
		icon: LayoutDashboard,
	},
	{
		title: "Agents",
		href: "/agents",
		icon: Users,
	},
	{
		title: "Leaderboard",
		href: "/leaderboard",
		icon: Trophy,
	},
	{
		title: "Call History",
		href: "/history",
		icon: History,
	},
];

const quickDial = [
	{
		title: "Joey Optimized",
		phone: "+1 (659) 216-7227",
		difficulty: "Medium",
	},
	{
		title: "Joey VP Growth",
		phone: "+1 (617) 370-8226",
		difficulty: "Medium-Hard",
	},
	{
		title: "Joey Elite",
		phone: "+1 (912) 296-2442",
		difficulty: "Hard",
	},
];

export function AppSidebar() {
	const pathname = usePathname();

	return (
		<Sidebar collapsible="icon">
			<SidebarHeader className="border-b border-sidebar-border">
				<SidebarMenu>
					<SidebarMenuItem>
						<SidebarMenuButton size="lg" asChild>
							<Link href="/">
								<div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
									<Zap className="size-4" />
								</div>
								<div className="grid flex-1 text-left text-sm leading-tight">
									<span className="truncate font-semibold">SalesTraining</span>
									<span className="truncate text-xs text-muted-foreground">Cold Call Practice</span>
								</div>
							</Link>
						</SidebarMenuButton>
					</SidebarMenuItem>
				</SidebarMenu>
			</SidebarHeader>

			<SidebarContent>
				<SidebarGroup>
					<SidebarGroupLabel>Navigation</SidebarGroupLabel>
					<SidebarGroupContent>
						<SidebarMenu>
							{navigation.map((item) => (
								<SidebarMenuItem key={item.href}>
									<SidebarMenuButton asChild isActive={pathname === item.href} tooltip={item.title}>
										<Link href={item.href}>
											<item.icon className="size-4" />
											<span>{item.title}</span>
										</Link>
									</SidebarMenuButton>
								</SidebarMenuItem>
							))}
						</SidebarMenu>
					</SidebarGroupContent>
				</SidebarGroup>

				<SidebarSeparator />

				<SidebarGroup>
					<SidebarGroupLabel>Quick Dial</SidebarGroupLabel>
					<SidebarGroupContent>
						<SidebarMenu>
							{quickDial.map((agent) => (
								<SidebarMenuItem key={agent.phone}>
									<SidebarMenuButton tooltip={agent.phone}>
										<Phone className="size-4" />
										<div className="grid flex-1 text-left text-sm leading-tight">
											<span className="truncate">{agent.title}</span>
											<span className="truncate text-xs text-muted-foreground">
												{agent.difficulty}
											</span>
										</div>
									</SidebarMenuButton>
								</SidebarMenuItem>
							))}
						</SidebarMenu>
					</SidebarGroupContent>
				</SidebarGroup>
			</SidebarContent>

			<SidebarFooter className="border-t border-sidebar-border">
				<SidebarMenu>
					<SidebarMenuItem>
						<SidebarMenuButton asChild tooltip="Settings">
							<Link href="/settings">
								<Settings className="size-4" />
								<span>Settings</span>
							</Link>
						</SidebarMenuButton>
					</SidebarMenuItem>
				</SidebarMenu>
			</SidebarFooter>
		</Sidebar>
	);
}

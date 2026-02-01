"use client";

import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";

interface PageHeaderProps {
	title: string;
	description?: string;
	children?: React.ReactNode;
}

export function PageHeader({ title, description, children }: PageHeaderProps) {
	return (
		<header className="sticky top-0 z-40 flex h-14 shrink-0 items-center gap-2 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
			<div className="flex flex-1 items-center gap-2 px-4">
				<SidebarTrigger className="-ml-1" />
				<Separator orientation="vertical" className="mr-2 h-4" />
				<div className="flex flex-1 items-center justify-between">
					<div>
						<h1 className="text-lg font-semibold">{title}</h1>
						{description && <p className="text-sm text-muted-foreground">{description}</p>}
					</div>
					{children && <div className="flex items-center gap-2">{children}</div>}
				</div>
			</div>
		</header>
	);
}

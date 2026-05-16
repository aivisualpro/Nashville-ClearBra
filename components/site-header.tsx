import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";

interface SiteHeaderProps {
  title?: string;
  children?: React.ReactNode;
  /** ID for toolbar portal target */
  toolbarPortalId?: string;
}

export function SiteHeader({ title = "Nashville ClearBra", children, toolbarPortalId }: SiteHeaderProps) {
  return (
    <header className="flex h-(--header-height) shrink-0 items-center gap-2 border-b transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-(--header-height)">
      <div className="flex w-full items-center gap-2 px-4 lg:px-6">
        <SidebarTrigger className="-ml-1" />
        <Separator
          orientation="vertical"
          className="mx-1 data-[orientation=vertical]:h-4"
        />
        <h1 className="text-base font-semibold whitespace-nowrap">{title}</h1>
        {(children || toolbarPortalId) && (
          <Separator
            orientation="vertical"
            className="mx-1 data-[orientation=vertical]:h-4"
          />
        )}
        <div className="flex flex-1 items-center justify-end gap-2" id={toolbarPortalId}>
          {children}
        </div>
      </div>
    </header>
  );
}

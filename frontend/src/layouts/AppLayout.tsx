import { AppSidebar } from "@/components/app-sidebar"
import {
    SidebarInset,
    SidebarProvider,
} from "@/components/ui/sidebar"
import { Outlet } from "react-router-dom"

export default function Page() {
    return (
        <SidebarProvider
            className="h-screen min-h-0 overflow-hidden"
            style={
                {
                    "--sidebar-width": "200px",
                    "--header-height": "calc(var(--spacing) * 12)",
                } as React.CSSProperties
            }
        >
            {/* 左边固定 200px */}
            <AppSidebar variant="sidebar" />

            {/* 剩余区域 */}
            <SidebarInset className="h-full min-h-0 min-w-0 overflow-hidden">
                <Outlet />
            </SidebarInset>
        </SidebarProvider>
    )
}
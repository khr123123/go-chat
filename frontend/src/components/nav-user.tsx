import {IconCreditCard, IconDotsVertical, IconLogout, IconNotification, IconUserCircle,} from "@tabler/icons-react"

import {Avatar, AvatarFallback, AvatarImage,} from "@/components/ui/avatar"

import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuGroup,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

import {SidebarMenu, SidebarMenuButton, SidebarMenuItem, useSidebar,} from "@/components/ui/sidebar"

import {useNavigate} from "react-router-dom"
import {toast} from "sonner"
import {supabase} from "@/lib/supabaseClient"
import type {UserInfo} from "@/store/userStore"
import EditProfileDialog from "@/components/edit-profile-dialog"
import {useState} from "react";

export function NavUser({
                            user,
                        }: {
    user: UserInfo
}) {
    const {isMobile} = useSidebar()
    const navigate = useNavigate()
    const handleLogout = async () => {
        const {error} = await supabase.auth.signOut()

        if (error) {
            toast.error("退出失败", {
                description: error.message,
            })
            return
        }

        toast.success("退出成功", {
            description: "期待下次再见！",
        })

        navigate("/login", {
            replace: true,
        })
    }
    const [editProfileOpen, setEditProfileOpen] = useState(false)
    return (
        <SidebarMenu>
            <SidebarMenuItem>
                <DropdownMenu>
                    <DropdownMenuTrigger className="w-full outline-none">
                        <SidebarMenuButton
                            size="lg"
                            className="w-full data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
                        >
                            <Avatar className="h-8 w-8 rounded-lg">
                                <AvatarImage
                                    src={user.avatar_url || undefined}
                                    alt={user.displayname}
                                />
                                <AvatarFallback className="rounded-lg">
                                    {user.displayname?.charAt(0)?.toUpperCase() || "U"}
                                </AvatarFallback>
                            </Avatar>
                            <span className="truncate font-medium">{user.displayname || "User"}</span>
                            <IconDotsVertical className="ml-auto size-4"/>
                        </SidebarMenuButton>
                    </DropdownMenuTrigger>

                    <DropdownMenuContent
                        className="min-w-56 rounded-lg"
                        side={isMobile ? "bottom" : "right"}
                        align="end"
                        sideOffset={4}
                    >
                        {/* 用户信息 */}
                        <DropdownMenuLabel className="p-0 font-normal">
                            <div className="flex items-center gap-3 px-2 py-2">
                                <Avatar className="h-9 w-9 rounded-lg">
                                    <AvatarImage
                                        src={user.avatar_url || undefined}
                                        alt={user.displayname}
                                    />

                                    <AvatarFallback className="rounded-lg">
                                        {user.displayname?.charAt(0)?.toUpperCase() || "U"}
                                    </AvatarFallback>
                                </Avatar>

                                <div className="grid min-w-0 flex-1 text-left">
                  <span className="truncate text-sm font-medium">
                    {user.displayname || "User"}
                  </span>

                                    <span className="truncate text-xs text-muted-foreground">
                    {user.email}
                  </span>
                                </div>
                            </div>
                        </DropdownMenuLabel>

                        <DropdownMenuSeparator/>

                        <DropdownMenuGroup>
                            <DropdownMenuItem
                                onClick={() => setEditProfileOpen(true)}
                            >
                                <IconUserCircle/>
                                Account
                            </DropdownMenuItem>

                            <DropdownMenuItem
                                onClick={() => navigate("/billing")}
                            >
                                <IconCreditCard/>
                                Billing
                            </DropdownMenuItem>

                            <DropdownMenuItem
                                onClick={() => navigate("/notifications")}
                            >
                                <IconNotification/>
                                Notifications
                            </DropdownMenuItem>
                        </DropdownMenuGroup>

                        <DropdownMenuSeparator/>

                        <DropdownMenuItem
                            onClick={handleLogout}
                            className="text-destructive focus:text-destructive"
                        >
                            <IconLogout/>
                            Log out
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </SidebarMenuItem>
            <EditProfileDialog
                open={editProfileOpen}
                onOpenChange={setEditProfileOpen}
            />
        </SidebarMenu>
    )
}

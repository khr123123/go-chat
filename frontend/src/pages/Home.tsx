import {useCallback, useEffect, useState} from "react"
import {useNavigate} from "react-router-dom"
import {toast} from "sonner"

import {supabase} from "@/lib/supabaseClient"
import {Button} from "@/components/ui/button"
import {Card, CardContent, CardHeader, CardTitle,} from "@/components/ui/card"
import {Spinner} from "@/components/ui/spinner"
import AvatarUpload from "@/components/avatar-upload"

type UserInfo = {
    id: string
    email?: string
    phone?: string
    created_at: string
    updated_at?: string
    last_sign_in_at?: string
    email_confirmed_at?: string
    avatar_url?: string
    bio?: string
    displayname?: string
}

function InfoItem({
                      label,
                      value,
                      mono = false,
                  }: {
    label: string
    value?: string
    mono?: boolean
}) {
    return (
        <div className="rounded-xl border bg-muted/30 p-4">
            <p className="mb-1 text-xs text-muted-foreground">{label}</p>
            <p
                className={[
                    "text-sm font-medium text-foreground break-all",
                    mono ? "font-mono" : "",
                ].join(" ")}
            >
                {value || "-"}
            </p>
        </div>
    )
}

export default function Home() {
    const navigate = useNavigate()
    const [user, setUser] = useState<UserInfo | null>(null)
    const [loading, setLoading] = useState(true)

    const getUser = useCallback(async () => {
        try {
            const {
                data: {user},
                error,
            } = await supabase.auth.getUser()

            if (error || !user) {
                navigate("/login", {replace: true})
                return
            }

            const {data: profile} = await supabase
                .from("profiles")
                .select("*")
                .eq("id", user.id)
                .maybeSingle()
            console.log(user)
            setUser({
                id: user.id,
                email: user.email,
                phone: user.phone,
                created_at: user.created_at,
                updated_at: user.updated_at,
                last_sign_in_at: user.last_sign_in_at,
                email_confirmed_at: user.email_confirmed_at,
                displayname: user?.user_metadata.display_name,
                avatar_url: profile?.avatar_url,
                bio: profile?.bio,
            })
        } catch (error) {
            console.error(error)
            toast.error("获取用户信息失败", {
                description: "请重新登录",
            })
            navigate("/login", {replace: true})
        } finally {
            setLoading(false)
        }
    }, [navigate])

    useEffect(() => {
        getUser()
    }, [getUser])

    const handleAvatarUpdated = async (avatarUrl: string) => {
        if (!user?.id) {
            toast.error("更新失败", {
                description: "用户信息不存在",
            })
            return
        }

        try {
            const {error} = await supabase
                .from("profiles")
                .update({
                    avatar_url: avatarUrl,
                    updated_at: new Date().toISOString(),
                })
                .eq("id", user.id)

            if (error) {
                console.error("更新头像 URL 失败:", error)
                toast.error("头像更新失败", {
                    description: error.message,
                })
                return
            }

            setUser((prev) =>
                prev
                    ? {
                        ...prev,
                        avatar_url: avatarUrl,
                    }
                    : prev
            )

            toast.success("头像更新成功", {
                description: "你的头像已经更新",
            })
        } catch (error) {
            console.error(error)
            toast.error("头像更新失败", {
                description: "服务器发生错误，请稍后再试",
            })
        }
    }

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

    if (loading) {
        return (
            <div className="flex min-h-screen items-center justify-center">
                <Spinner/>
            </div>
        )
    }

    if (!user) return null

    return (
        <div className="min-h-screen bg-background px-4 py-8 md:px-6">
            <div className="mx-auto max-w-7xl">
                <Card className="border shadow-sm">
                    <CardHeader className="pb-4">
                        <CardTitle className="text-2xl font-semibold">
                            Welcome 👋
                        </CardTitle>
                    </CardHeader>

                    <CardContent className="space-y-6">
                        <div className="grid gap-6 lg:grid-cols-[220px_1fr]">
                            {/* 左侧头像区 */}
                            <div
                                className="flex flex-col items-center justify-center rounded-2xl border bg-muted/20 p-6">
                                <AvatarUpload
                                    userId={user.id}
                                    avatarUrl={user.avatar_url}
                                    onUploaded={handleAvatarUpdated}
                                />
                                <p className="mt-3 text-sm text-muted-foreground">
                                    点击头像修改头像
                                </p>
                            </div>

                            {/* 右侧信息区 */}
                            <div className="overflow-x-auto">
                                <div className="grid min-w-[1100px] grid-cols-6 gap-4">
                                    <InfoItem label="Email" value={user.email}/>
                                    <InfoItem label="Phone" value={user.phone}/>
                                    <InfoItem label="Nickname" value={user.displayname}/>
                                    <InfoItem
                                        label="Created At"
                                        value={
                                            user.created_at
                                                ? new Date(user.created_at).toLocaleString()
                                                : "-"
                                        }
                                    />
                                    <InfoItem
                                        label="Last Sign In"
                                        value={
                                            user.last_sign_in_at
                                                ? new Date(user.last_sign_in_at).toLocaleString()
                                                : "-"
                                        }
                                    />
                                    <InfoItem
                                        label="Email Confirmed"
                                        value={user.email_confirmed_at ? "已验证" : "未验证"}
                                    />
                                </div>

                                <div className="mt-4">
                                    <InfoItem label="User ID" value={user.id} mono/>
                                </div>

                                {user.bio && (
                                    <div className="mt-4 rounded-xl border bg-muted/30 p-4">
                                        <p className="mb-1 text-xs text-muted-foreground">Bio</p>
                                        <p className="text-sm font-medium text-foreground whitespace-pre-wrap">
                                            {user.bio}
                                        </p>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* 操作区 */}
                        <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
                            <Button
                                variant="outline"
                                className="sm:w-32"
                                onClick={() => navigate("/login")}
                            >
                                登录页
                            </Button>

                            <Button
                                variant="destructive"
                                className="sm:w-32"
                                onClick={handleLogout}
                            >
                                退出登录
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}

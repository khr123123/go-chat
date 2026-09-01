import {useEffect, useState} from "react"
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
}

export default function Home() {
    const navigate = useNavigate()
    const [user, setUser] = useState<UserInfo | null>(null)
    const [loading, setLoading] = useState(true)
    useEffect(() => {
        getUser()
    }, [])

    const getUser = async () => {
        try {
            const {
                data: {user},
                error,
            } = await supabase.auth.getUser()
            if (error || !user) {
                navigate("/login", {replace: true})
                return
            }
            const {data: profile, error: profileError} =
                await supabase
                    .from("profiles")
                    .select("*")
                    .eq("id", user.id)
                    .maybeSingle()
            setUser({
                id: user.id,
                email: user.email,
                phone: user.phone,
                created_at: user.created_at,
                updated_at: user.updated_at,
                last_sign_in_at: user.last_sign_in_at,
                email_confirmed_at: user.email_confirmed_at,
                avatar_url: profile?.avatar_url,
            })
        } catch (error) {
            toast.error("获取用户信息失败", {
                description: "请重新登录",
            })
            navigate("/login", {replace: true})
        } finally {
            setLoading(false)
        }
    }

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

            // 同时更新页面状态
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
            <div className="min-h-screen flex items-center justify-center">
                <Spinner/>
            </div>
        )
    }
    return (
        <div className="min-h-screen bg-background flex items-center justify-center p-6">
            <Card className="w-full max-w-md">
                <CardHeader>
                    <CardTitle className="text-2xl">
                        Welcome 👋
                    </CardTitle>
                </CardHeader>

                <CardContent className="space-y-6">
                    <div className="flex flex-col items-center gap-3">
                        <AvatarUpload
                            userId={user?.id!}
                            avatarUrl={user?.avatar_url}
                            onUploaded={handleAvatarUpdated}
                        />
                        <p className="text-sm text-muted-foreground">
                            点击头像修改头像
                        </p>

                    </div>

                    <div className="space-y-4">
                        <div>
                            <p className="text-sm text-muted-foreground">
                                Email
                            </p>

                            <p className="font-medium">
                                {user?.email || "-"}
                            </p>
                        </div>

                        <div>
                            <p className="text-sm text-muted-foreground">
                                User ID
                            </p>

                            <p className="font-mono text-sm break-all">
                                {user?.id}
                            </p>
                        </div>

                        <div>
                            <p className="text-sm text-muted-foreground">
                                Phone
                            </p>

                            <p className="font-medium">
                                {user?.phone || "-"}
                            </p>
                        </div>

                        <div>
                            <p className="text-sm text-muted-foreground">
                                Created At
                            </p>

                            <p className="font-medium">
                                {user?.created_at
                                    ? new Date(
                                        user.created_at
                                    ).toLocaleString()
                                    : "-"}
                            </p>
                        </div>

                        <div>
                            <p className="text-sm text-muted-foreground">
                                Last Sign In
                            </p>

                            <p className="font-medium">
                                {user?.last_sign_in_at
                                    ? new Date(
                                        user.last_sign_in_at
                                    ).toLocaleString()
                                    : "-"}
                            </p>
                        </div>

                        <div>
                            <p className="text-sm text-muted-foreground">
                                Email Confirmed
                            </p>

                            <p className="font-medium">
                                {user?.email_confirmed_at
                                    ? "已验证"
                                    : "未验证"}
                            </p>
                        </div>

                    </div>

                    {/* =========================
                        操作
                    ========================= */}
                    <div className="flex gap-3">

                        <Button
                            variant="outline"
                            className="flex-1"
                            onClick={() =>
                                navigate("/login")
                            }
                        >
                            登录页
                        </Button>

                        <Button
                            variant="destructive"
                            className="flex-1"
                            onClick={handleLogout}
                        >
                            退出登录
                        </Button>

                    </div>

                </CardContent>

            </Card>
        </div>
    )
}

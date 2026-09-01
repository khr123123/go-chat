import {useEffect, useState} from "react"
import {useNavigate} from "react-router-dom"
import {toast} from "sonner"

import {supabase} from "@/lib/supabaseClient"
import {Button} from "@/components/ui/button"
import {Card, CardContent, CardHeader, CardTitle,} from "@/components/ui/card"

type UserInfo = {
    id: string
    email?: string
    created_at: string
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

            setUser({
                id: user.id,
                email: user.email,
                created_at: user.created_at,
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

        navigate("/login", {replace: true})
    }

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <p className="text-muted-foreground">
                    Loading...
                </p>
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

                    {/* 用户信息 */}
                    <div className="space-y-4">

                        <div>
                            <p className="text-sm text-muted-foreground">
                                Email
                            </p>

                            <p className="font-medium">
                                {user?.email}
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

                    </div>

                    {/* 操作 */}
                    <div className="flex gap-3">

                        <Button
                            variant="outline"
                            className="flex-1"
                            onClick={() => navigate("/login")}
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

import {useRef, useState} from "react"
import {supabase} from "@/lib/supabaseClient"
import {toast} from "sonner"
import {Button} from "@/components/ui/button"
import {Avatar, AvatarFallback, AvatarImage,} from "@/components/ui/avatar"

type Props = {
    userId: string
    avatarUrl?: string | null
    onUploaded?: (url: string) => void
}

export default function AvatarUpload({
                                         userId,
                                         avatarUrl,
                                         onUploaded,
                                     }: Props) {

    const inputRef = useRef<HTMLInputElement>(null)
    const [loading, setLoading] = useState(false)

    const handleUpload = async (
        e: React.ChangeEvent<HTMLInputElement>
    ) => {

        const file = e.target.files?.[0]

        if (!file) {
            return
        }

        // 检查图片
        if (!file.type.startsWith("image/")) {
            toast.error("上传失败", {
                description: "请选择图片文件",
            })
            return
        }

        // 限制 5MB
        if (file.size > 5 * 1024 * 1024) {
            toast.error("上传失败", {
                description: "头像不能超过 5MB",
            })
            return
        }

        setLoading(true)

        try {

            // 确认当前登录用户
            const {
                data: {user},
                error: userError,
            } = await supabase.auth.getUser()

            if (userError || !user) {
                throw new Error("未登录")
            }

            // 防止别人修改其他用户头像
            if (user.id !== userId) {
                throw new Error("无权修改该用户头像")
            }

            // 获取扩展名
            const extension =
                file.name.split(".").pop()?.toLowerCase() || "jpg"

            // 唯一路径
            const filePath =
                `${user.id}/${crypto.randomUUID()}.${extension}`

            console.log("上传路径:", filePath)

// 上传
            const {
                error: uploadError,
            } = await supabase.storage
                .from("avatars")
                .upload(filePath, file, {
                    cacheControl: "3600",
                    upsert: false,
                    contentType: file.type,
                })

            if (uploadError) {
                throw uploadError
            }

// 获取 Public URL
            const {
                data: {publicUrl},
            } = supabase.storage
                .from("avatars")
                .getPublicUrl(filePath)

// 防止浏览器缓存
            const newAvatarUrl =
                `${publicUrl}?t=${Date.now()}`

            console.log("头像 URL:", newAvatarUrl)

// 更新 profiles
            const {
                error: updateError,
            } = await supabase
                .from("profiles")
                .update({
                    avatar_url: newAvatarUrl,
                    updated_at: new Date().toISOString(),
                })
                .eq("id", user.id)

            if (updateError) {
                throw updateError
            }

            toast.success("头像更新成功")

            onUploaded?.(newAvatarUrl)

        } catch (error) {

            console.error("头像上传失败:", error)

            toast.error("头像上传失败", {
                description:
                    error instanceof Error
                        ? error.message
                        : "请稍后再试",
            })

        } finally {

            setLoading(false)

            if (inputRef.current) {
                inputRef.current.value = ""
            }
        }
    }

    return (
        <div className="flex flex-col items-center gap-4">

            <Avatar className="size-24">

                <AvatarImage
                    src={avatarUrl || undefined}
                    alt="用户头像"
                />

                <AvatarFallback>
                    U
                </AvatarFallback>

            </Avatar>

            <input
                ref={inputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleUpload}
            />

            <Button
                type="button"
                variant="outline"
                disabled={loading}
                onClick={() =>
                    inputRef.current?.click()
                }
            >
                {loading
                    ? "上传中..."
                    : "更换头像"}
            </Button>

        </div>
    )
}

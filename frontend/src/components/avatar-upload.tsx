import {useRef, useState} from "react"
import {Camera} from "lucide-react"
import {supabase} from "@/lib/supabaseClient"
import {toast} from "sonner"
import {Avatar, AvatarFallback, AvatarImage} from "@/components/ui/avatar"

type Props = {
    userId: string
    avatarUrl?: string | null
    onUploaded?: (url: string) => void
}

export default function AvatarUpload({userId, avatarUrl, onUploaded}: Props) {
    const inputRef = useRef<HTMLInputElement>(null)
    const [loading, setLoading] = useState(false)

    const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        if (!file.type.startsWith("image/")) {
            toast.error("Upload failed", {description: "Please select an image file"})
            return
        }

        if (file.size > 5 * 1024 * 1024) {
            toast.error("Upload failed", {description: "Avatar must be smaller than 5MB"})
            return
        }

        setLoading(true)

        try {
            const filePath = `${userId}/${crypto.randomUUID()}.${file.name.split(".").pop() || "png"}`

            const {error} = await supabase.storage.from("avatars").upload(filePath, file)

            if (error) throw error

            const {data} = supabase.storage.from("avatars").getPublicUrl(filePath)
            const url = `${data.publicUrl}?t=${Date.now()}`

            onUploaded?.(url)
            toast.success("Avatar updated")
        } catch (error) {
            console.error(error)
            toast.error("Avatar upload failed", {
                description: error instanceof Error ? error.message : "Please try again later",
            })
        } finally {
            setLoading(false)
            if (inputRef.current) inputRef.current.value = ""
        }
    }

    return (
        <div className="relative group cursor-pointer" onClick={() => !loading && inputRef.current?.click()}>
            <Avatar className="size-28">
                <AvatarImage src={avatarUrl || undefined} alt="Avatar" className="object-cover"/>
                <AvatarFallback className="text-2xl">{userId.slice(0, 2).toUpperCase()}</AvatarFallback>
            </Avatar>

            <div
                className="absolute inset-0 flex items-center justify-center rounded-full bg-black/50 opacity-0 transition-opacity group-hover:opacity-100">
                {loading ? (
                    <div className="size-6 animate-spin rounded-full border-2 border-white border-t-transparent"/>
                ) : (
                    <Camera className="size-7 text-white"/>
                )}
            </div>

            <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={handleUpload}/>
        </div>
    )
}

import {useEffect, useState} from "react"
import {toast} from "sonner"
import {supabase} from "@/lib/supabaseClient"
import {useUserStore} from "@/store/userStore"

import {Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle,} from "@/components/ui/dialog"
import {Button} from "@/components/ui/button"
import {Input} from "@/components/ui/input"
import {Textarea} from "@/components/ui/textarea"
import {Label} from "@/components/ui/label"
import AvatarUpload from "@/components/avatar-upload"

type Props = {
    open: boolean
    onOpenChange: (open: boolean) => void
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
        <div className="rounded-lg border bg-muted/30 p-3">
            <p className="mb-1 text-xs text-muted-foreground">{label}</p>
            <p className={`text-sm font-medium break-all ${mono ? "font-mono" : ""}`}>
                {value || "-"}
            </p>
        </div>
    )
}

export default function EditProfileDialog({open, onOpenChange}: Props) {
    const user = useUserStore(state => state.user)
    const updateUser = useUserStore(state => state.updateUser)

    const [displayName, setDisplayName] = useState("")
    const [bio, setBio] = useState("")
    const [loading, setLoading] = useState(false)

    useEffect(() => {
        if (open) {
            setDisplayName(user.displayname || "")
            setBio(user.bio || "")
        }
    }, [open, user.displayname, user.bio])

    const handleAvatarUpdated = async (avatarUrl: string) => {
        try {
            const {error} = await supabase
                .from("profiles")
                .update({
                    avatar_url: avatarUrl,
                    updated_at: new Date().toISOString(),
                })
                .eq("id", user.id)

            if (error) throw error

            updateUser({avatar_url: avatarUrl})
        } catch (error) {
            console.error(error)
            toast.error("Avatar update failed", {
                description:
                    error instanceof Error
                        ? error.message
                        : "Please try again later",
            })
        }
    }

    const handleSave = async () => {
        if (!displayName.trim()) {
            toast.error("Display Name is required")
            return
        }

        setLoading(true)

        try {
            const {error: profileError} = await supabase
                .from("profiles")
                .update({
                    display_name: displayName.trim(),
                    bio: bio.trim(),
                    updated_at: new Date().toISOString(),
                })
                .eq("id", user.id)
            if (profileError) throw profileError
            updateUser({displayname: displayName.trim(), bio: bio.trim(),})
            toast.success("Profile updated")
            onOpenChange(false)
        } catch (error) {
            console.error(error)
            toast.error("Update failed", {
                description:
                    error instanceof Error
                        ? error.message
                        : "Please try again later",
            })
        } finally {
            setLoading(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-[700px]">
                <DialogHeader>
                    <DialogTitle>Profile</DialogTitle>
                    <DialogDescription>
                        View and update your personal information.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-6">

                    {/* 第一排：Avatar + Profile */}
                    <div className="grid gap-6 rounded-xl border bg-muted/20 p-6 sm:grid-cols-[180px_1fr]">

                        {/* Avatar */}
                        <div className="flex flex-col items-center justify-center">
                            <AvatarUpload
                                userId={user.id}
                                avatarUrl={user.avatar_url}
                                onUploaded={handleAvatarUpdated}
                            />

                            <p className="mt-3 text-xs text-muted-foreground">
                                Hover to change avatar
                            </p>
                        </div>

                        {/* Display Name + Bio */}
                        <div className="flex flex-col justify-center gap-5">

                            <div className="space-y-2">
                                <Label htmlFor="display-name">
                                    Display Name
                                </Label>

                                <Input
                                    id="display-name"
                                    value={displayName}
                                    onChange={e =>
                                        setDisplayName(e.target.value)
                                    }
                                    placeholder="Enter your display name"
                                    disabled={loading}
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="bio">
                                    Bio
                                </Label>

                                <Textarea
                                    id="bio"
                                    value={bio}
                                    onChange={e =>
                                        setBio(e.target.value)
                                    }
                                    placeholder="Tell us about yourself..."
                                    rows={3}
                                    disabled={loading}
                                />
                            </div>

                        </div>
                    </div>

                    {/* 第二排：Account Information */}
                    <div className="space-y-4">

                        <div className="text-sm font-semibold">
                            Account Information
                        </div>

                        <div className="grid gap-3 sm:grid-cols-2">

                            <InfoItem
                                label="Email"
                                value={user.email}
                            />

                            <InfoItem
                                label="Phone"
                                value={user.phone}
                            />

                            <InfoItem
                                label="Email Verified"
                                value={
                                    user.email_confirmed_at
                                        ? "Verified"
                                        : "Not verified"
                                }
                            />

                            <InfoItem
                                label="Created At"
                                value={
                                    user.created_at
                                        ? new Date(
                                            user.created_at
                                        ).toLocaleString()
                                        : "-"
                                }
                            />

                            <InfoItem
                                label="Last Sign In"
                                value={
                                    user.last_sign_in_at
                                        ? new Date(
                                            user.last_sign_in_at
                                        ).toLocaleString()
                                        : "-"
                                }
                            />
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex justify-end gap-2">

                        <Button
                            variant="outline"
                            onClick={() => onOpenChange(false)}
                            disabled={loading}
                        >
                            Cancel
                        </Button>

                        <Button
                            onClick={handleSave}
                            disabled={loading}
                        >
                            {loading ? "Saving..." : "Save Changes"}
                        </Button>

                    </div>
                </div>
            </DialogContent>
        </Dialog>
    )
}

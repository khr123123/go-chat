import {Avatar, AvatarFallback, AvatarImage} from "@/components/ui/avatar";
import {Button} from "@/components/ui/button";
import {MoreHorizontal, Phone, Search, Video} from "lucide-react";
import type {ConversationWithMeta} from "@/types/chat";
import {useUserStore} from "@/store/userStore";

export function ChatHeader({conv}: { conv: ConversationWithMeta }) {
    const user = useUserStore(state => state.user)
    const CURRENT_USER_ID = user.id
    const isGroup = conv.type === "group";
    const other = isGroup
        ? null
        : conv.members.find((m) => m.user_id !== CURRENT_USER_ID);
    const name = isGroup
        ? conv.title
        : other
            ? other?.profile?.display_name
            : "未知用户";
    const avatarUrl = isGroup ? conv.avatar_url : other?.profile?.avatar_url ?? null;

    return (
        <div
            className="flex h-14 items-center justify-between border-b border-border bg-background/80 px-4 backdrop-blur">
            <div className="flex min-w-0 items-center gap-3">
                <Avatar>
                    <AvatarImage src={avatarUrl ?? undefined} alt={name ?? ""}/>
                    <AvatarFallback>{(name ?? "?").slice(0, 2)}</AvatarFallback>
                </Avatar>
                <div className="min-w-0">
                    <div className="truncate text-sm font-semibold text-foreground">
                        {name}
                    </div>
                    <div className="truncate text-xs text-muted-foreground">
                        {isGroup ?? `${conv.members.length} 位成员`}
                    </div>
                </div>
            </div>

            <div className="flex items-center gap-1">
                <Button variant="ghost" size="icon-sm" aria-label="搜索聊天记录">
                    <Search/>
                </Button>
                <Button variant="ghost" size="icon-sm" aria-label="语音">
                    <Phone/>
                </Button>
                <Button variant="ghost" size="icon-sm" aria-label="视频">
                    <Video/>
                </Button>
                <Button variant="ghost" size="icon-sm" aria-label="更多">
                    <MoreHorizontal/>
                </Button>
            </div>
        </div>
    );
}

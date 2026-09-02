import {Avatar, AvatarFallback, AvatarImage} from "@/components/ui/avatar";
import {Badge} from "@/components/ui/badge";
import {Users} from "lucide-react";
import {cn} from "@/lib/utils";
import type {ConversationWithMeta} from "@/types/chat";
import {useUserStore} from "@/store/userStore";

export function ConversationListItem({
                                         conv,
                                         active,
                                         onClick,
                                     }: {
    conv: ConversationWithMeta;
    active: boolean;
    onClick: () => void;
}) {
    const user = useUserStore(state => state.user)
    const CURRENT_USER_ID = user.id
    const isGroup = conv.type === "group";
    const other = isGroup
        ? null
        : conv.members.find((m) => m.user_id !== CURRENT_USER_ID);
    const displayName = isGroup
        ? conv.title ?? "群聊"
        : other?.profile?.display_name;
    const avatarUrl = isGroup ? conv.avatar_url : other?.profile?.avatar_url ?? null;

    const lastAt = conv.last_message_at ? new Date(conv.last_message_at) : null;

    return (
        <button
            type="button"
            onClick={onClick}
            className={cn(
                "group/item flex w-full items-start gap-3 rounded-lg px-3 py-2.5 text-left transition-colors",
                active ? "bg-muted" : "hover:bg-muted/60"
            )}
        >
            <div className="relative">
                {isGroup ? (
                    <div className="grid h-10 w-10 place-items-center rounded-full bg-muted ring-1 ring-border">
                        <Users size={16} className="text-muted-foreground"/>
                    </div>
                ) : (
                    <Avatar>
                        <AvatarImage src={avatarUrl ?? undefined} alt={displayName}/>
                        <AvatarFallback>{displayName}</AvatarFallback>
                    </Avatar>
                )}
                {conv.unread_count > 0 && (
                    <span
                        className="absolute -bottom-0.5 -right-0.5 grid h-4 min-w-4 place-items-center rounded-full bg-primary px-1 text-[10px] font-semibold text-primary-foreground">
            {conv.unread_count}
          </span>
                )}
            </div>

            <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
          <span className="truncate text-sm font-medium text-foreground">
            {displayName}
          </span>
                    {isGroup && (
                        <Badge variant="default" className="text-[10px]">
                            {conv.members.length}
                        </Badge>
                    )}
                    <span className="ml-auto shrink-0 text-[11px] text-muted-foreground">
            {lastAt ? formatTime(lastAt) : ""}
          </span>
                </div>
                <div className="mt-0.5 flex items-center gap-2">
          <span
              className={cn(
                  "min-w-0 flex-1 truncate text-xs",
                  conv.unread_count > 0 ? "text-foreground" : "text-muted-foreground"
              )}
          >
            {conv.last_message_preview ?? "暂无消息"}
          </span>
                    {isGroup && conv.unread_count > 0 && (
                        <span
                            className="grid h-4 min-w-4 place-items-center rounded-full bg-primary px-1 text-[10px] font-semibold text-primary-foreground">
              {conv.unread_count}
            </span>
                    )}
                </div>
            </div>
        </button>
    );
}

function formatTime(d: Date) {
    const now = new Date();
    const sameDay =
        d.getFullYear() === now.getFullYear() &&
        d.getMonth() === now.getMonth() &&
        d.getDate() === now.getDate();
    if (sameDay) return d.toTimeString().slice(0, 5);
    const diff = Math.floor((+now - +d) / 86400000);
    if (diff < 7) return `周${"日一二三四五六"[d.getDay()]}`;
    return `${d.getMonth() + 1}/${d.getDate()}`;
}

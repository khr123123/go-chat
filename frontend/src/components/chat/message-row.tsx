import {
    Message,
    MessageAvatar,
    MessageContent,
    MessageHeader,
    MessageFooter,
} from "@/components/ui/message";
import { Bubble, BubbleContent } from "@/components/ui/bubble";
import {
    Avatar,
    AvatarImage,
    AvatarFallback,
} from "@/components/ui/avatar";
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
} from "@/components/ui/tooltip";
import { Check, CheckCheck, Pencil } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ChatMessage } from "@/types/chat";
import { MessageBody } from "./message-body";
import {useUserStore} from "@/store/userStore";

export function MessageRow({
                               msg,
                               isMe,
                               senderName,
                               senderAvatar,
                           }: {
    msg: ChatMessage;
    isMe: boolean;
    senderName: string;
    senderAvatar: string | null;
}) {

    if (msg.kind === "system") {
        return (
            <Message align="start">
                <MessageContent className="items-center">
                    <Bubble variant="muted">
                        <BubbleContent>{msg.body}</BubbleContent>
                    </Bubble>
                </MessageContent>
            </Message>
        );
    }

    const align: "start" | "end" = isMe ? "end" : "start";
    const variant = isMe ? "default" : "secondary";

    return (
        <Message align={align}>
            <MessageAvatar>
                <Avatar>
                    <AvatarImage src={senderAvatar ?? undefined} alt={senderName} />
                    <AvatarFallback>{senderName.slice(0, 2)}</AvatarFallback>
                </Avatar>
            </MessageAvatar>

            <MessageContent>
                <MessageHeader>
          <span className="text-xs font-medium text-muted-foreground">
            {senderName}
          </span>
                </MessageHeader>

                <Bubble variant={variant}>
                    <BubbleContent>
                        <MessageBody msg={msg} align={align} />
                    </BubbleContent>
                </Bubble>

                <MessageFooter>
          <span className="text-[10px] text-muted-foreground/70">
            {new Date(msg.created_at).toTimeString().slice(0, 5)}
          </span>
                    <RowBadges msg={msg} isMe={isMe} />
                </MessageFooter>
            </MessageContent>
        </Message>
    );
}

function RowBadges({
                       msg,
                       isMe,
                   }: {
    msg: ChatMessage;
    isMe: boolean;
}) {
    const user = useUserStore(state => state.user)
    const CURRENT_USER_ID = user.id
    return (
        <div
            className={cn(
                "ml-2 flex items-center gap-1",
                isMe ? "justify-end" : "justify-start"
            )}
        >
            {msg.is_edited && (
                <Tooltip>
                    <TooltipTrigger asChild>
            <span className="inline-flex items-center text-muted-foreground/70">
              <Pencil size={10} />
            </span>
                    </TooltipTrigger>
                    <TooltipContent>已编辑</TooltipContent>
                </Tooltip>
            )}
            {isMe && (
                <span className="inline-flex items-center text-muted-foreground/70">
          <CheckCheck size={12} />
        </span>
            )}
            {!isMe && msg.sender_id === CURRENT_USER_ID && (
                <span className="inline-flex items-center text-muted-foreground/70">
          <Check size={12} />
        </span>
            )}
        </div>
    );
}

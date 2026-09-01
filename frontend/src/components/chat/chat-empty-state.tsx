import { MessageCircleMore } from "lucide-react";

export function ChatEmptyState() {
    return (
        <div className="flex h-full w-full flex-col items-center justify-center bg-muted/10 text-center">
            <div className="grid h-16 w-16 place-items-center rounded-full bg-muted">
                <MessageCircleMore size={28} className="text-muted-foreground" />
            </div>
            <h2 className="mt-4 text-lg font-semibold">选择一个会话开始聊天</h2>
            <p className="mt-1 max-w-sm text-sm text-muted-foreground">
                从左侧选择好友或群聊，消息将通过 Supabase
                Realtime 实时同步到你和对方的浏览器。
            </p>
        </div>
    );
}

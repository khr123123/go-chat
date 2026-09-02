import {useMemo} from "react";
import {Input} from "@/components/ui/input";
import {ScrollArea} from "@/components/ui/scroll-area";
import {ConversationListItem} from "./conversation-list-item";
import {MessageCircleMore, Plus, Settings} from "lucide-react";
import {Button} from "@/components/ui/button";
import {useChatStore} from "@/store/chatStore";
import {cn} from "@/lib/utils";

export function ChatSidebar() {
    const conversations = useChatStore((s) => s.conversations);
    const selectedId = useChatStore((s) => s.selectedId);
    const search = useChatStore((s) => s.search);
    const setSearch = useChatStore((s) => s.setSearch);
    const selectConversation = useChatStore((s) => s.selectConversation);

    const filtered = useMemo(() => {
        const q = search.trim().toLowerCase();

        const arr = [...conversations].sort(
            (a, b) =>
                new Date(b.last_message_at ?? 0).getTime() -
                new Date(a.last_message_at ?? 0).getTime()
        );

        if (!q) return arr;

        return arr.filter((c) => {
            if (c.title?.toLowerCase().includes(q)) return true;

            return c.members.some((m) =>
                m.user_id.toLowerCase().includes(q)
            );
        });
    }, [conversations, search]);

    const directs = filtered.filter((c) => c.type === "direct");
    const groups = filtered.filter((c) => c.type === "group");

    return (
        <aside className="flex h-full w-[320px] shrink-0 flex-col overflow-hidden border-r border-border bg-background">
            {/* Header */}
            <div className="flex h-14 shrink-0 items-center justify-between gap-2 border-b border-border px-3">
                <div className="flex min-w-0 items-center gap-2">
                    <MessageCircleMore className="size-5 shrink-0 text-primary"/>

                    <span className="truncate whitespace-nowrap text-base font-semibold">
                        Chats
                    </span>
                </div>

                <div className="flex shrink-0 items-center gap-1">
                    <Button
                        variant="ghost"
                        size="icon-sm"
                        aria-label="New chat"
                        title="New chat"
                    >
                        <Plus/>
                    </Button>

                    <Button
                        variant="ghost"
                        size="icon-sm"
                        aria-label="Settings"
                        title="Settings"
                    >
                        <Settings/>
                    </Button>
                </div>
            </div>

            {/* Search */}
            <div className="shrink-0 border-b border-border p-3">
                <Input
                    placeholder="Search chats or friends"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="h-9"
                />
            </div>

            {/* Conversation List */}
            <ScrollArea className="min-h-0 flex-1">
                <div className="px-2 py-2">
                    {/* Friends */}
                    <Section title="Friends">
                        {directs.length === 0 ? (
                            <Empty>No matching friends</Empty>
                        ) : (
                            directs.map((c) => (
                                <ConversationListItem
                                    key={c.id}
                                    conv={c}
                                    active={c.id === selectedId}
                                    onClick={() => selectConversation(c.id)}
                                />
                            ))
                        )}
                    </Section>

                    <div className="my-2 h-px bg-border"/>

                    {/* Group Chats */}
                    <Section title="Group Chats">
                        {groups.length === 0 ? (
                            <Empty>No matching group chats</Empty>
                        ) : (
                            groups.map((c) => (
                                <ConversationListItem
                                    key={c.id}
                                    conv={c}
                                    active={c.id === selectedId}
                                    onClick={() => selectConversation(c.id)}
                                />
                            ))
                        )}
                    </Section>
                </div>
            </ScrollArea>
        </aside>
    );
}

function Section({
                     title,
                     children,
                 }: {
    title: string;
    children: React.ReactNode;
}) {
    return (
        <section className="mb-1 min-w-0">
            <h3
                className={cn(
                    "truncate whitespace-nowrap px-2 py-1 text-[11px] font-medium uppercase tracking-wider text-muted-foreground"
                )}
            >
                {title}
            </h3>

            <div className="flex min-w-0 flex-col gap-0.5">
                {children}
            </div>
        </section>
    );
}

function Empty({children}: { children: React.ReactNode }) {
    return (
        <div className="truncate whitespace-nowrap px-3 py-6 text-center text-xs text-muted-foreground">
            {children}
        </div>
    );
}
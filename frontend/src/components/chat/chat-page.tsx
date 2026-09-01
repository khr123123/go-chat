import { useEffect, useMemo } from "react";
import { ChatSidebar } from "./chat-sidebar";
import { ChatHeader } from "./chat-header";
import { ChatStream } from "./chat-stream";
import { ChatEmptyState } from "./chat-empty-state";
import { MessageComposer } from "./message-composer";
import { useChatStore } from "@/store/chatStore";
import { supabase } from "@/lib/supabaseClient";
import type { ConversationWithMeta } from "@/types/chat";
import { toast } from "sonner";
import { useUserStore } from "@/store/userStore";

export function ChatPage() {
    const user = useUserStore((state) => state.user);

    const conversations = useChatStore((s) => s.conversations);
    const setConversations = useChatStore((s) => s.setConversations);
    const selectedId = useChatStore((s) => s.selectedId);
    const selectConversation = useChatStore((s) => s.selectConversation);

    const CURRENT_USER_ID = user?.id;

    const SEED_USER_IDS = useMemo(
        () =>
            new Set<string>([
                "231c2d34-35ad-4f45-a486-5cb73fe7f102",
                "9a308bb5-c503-4384-9b29-b9e3bc98eae2",
                "2e9c506b-a0af-401f-80a0-9b29bdbbf900",
                "6f18378e-2d68-4897-bec6-5122e452baa2",
            ]),
        []
    );

    // 拉取会话列表
    useEffect(() => {
        if (!CURRENT_USER_ID) {
            return;
        }

        let cancelled = false;

        async function loadConversations() {
            const { data: convs, error } = await supabase
                .from("conversations")
                .select(`
            *,
            members:conversation_members(
                *,
                profile:profiles!conversation_members_user_profile_fkey(
                    id,
                    avatar_url,
                    bio
                )
            )
        `)
                .order("last_message_at", {
                    ascending: false,
                    nullsFirst: false,
                });

            if (error) {
                toast.error("会话列表拉取失败: " + error.message);
                return;
            }

            const list = (convs ?? []) as ConversationWithMeta[];

            // 查询未读数
            await Promise.all(
                list.map(async (conversation) => {
                    const me = (conversation.members ?? []).find(
                        (member) => member.user_id === CURRENT_USER_ID
                    );

                    const { count, error: unreadError } = await supabase
                        .from("messages")
                        .select("*", {
                            count: "exact",
                            head: true,
                        })
                        .eq("conversation_id", conversation.id)
                        .gt(
                            "created_at",
                            me?.last_read_at ??
                            "1970-01-01T00:00:00.000Z"
                        )
                        .neq("sender_id", CURRENT_USER_ID)
                        .eq("is_deleted", false);

                    if (unreadError) {
                        console.error(
                            "获取未读数失败:",
                            conversation.id,
                            unreadError
                        );
                        conversation.unread_count = 0;
                        return;
                    }

                    conversation.unread_count = count ?? 0;
                })
            );

            if (cancelled) {
                return;
            }

            setConversations(list);

            if (!selectedId && list.length > 0) {
                selectConversation(list[0].id);
            }
        }

        loadConversations();

        return () => {
            cancelled = true;
        };
    }, [
        CURRENT_USER_ID,
        selectedId,
        setConversations,
        selectConversation,
    ]);

    const selected = useMemo(
        () =>
            conversations.find(
                (conversation) => conversation.id === selectedId
            ) ?? null,
        [conversations, selectedId]
    );

    const metaMap = useMemo(() => {
        const map: Record<
            string,
            {
                name: string;
                avatar: string | null;
            }
        > = {};

        if (!selected) {
            return map;
        }

        for (const member of selected.members) {
            map[member.user_id] = {
                name: SEED_USER_IDS.has(member.user_id)
                    ? `User ${member.user_id.slice(0, 6)}`
                    : member.profile?.bio ??
                    `User ${member.user_id.slice(0, 6)}`,
                avatar: member.profile?.avatar_url ?? null,
            };
        }

        return map;
    }, [selected, SEED_USER_IDS]);

    return (
        <div className="flex h-full w-full overflow-hidden bg-background">
            <ChatSidebar />

            <main className="flex min-w-0 flex-1 flex-col">
                {selected ? (
                    <>
                        <ChatHeader conv={selected} />

                        <ChatStream
                            convId={selected.id}
                            metaMap={metaMap}
                        />

                        <MessageComposer
                            convId={selected.id}
                            onSent={() => {
                                // Realtime 会负责消息同步
                            }}
                        />
                    </>
                ) : (
                    <ChatEmptyState />
                )}
            </main>
        </div>
    );
}
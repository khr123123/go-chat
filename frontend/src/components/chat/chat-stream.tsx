"use client";
import {useEffect, useMemo, useRef} from "react";
import {
    MessageScroller,
    MessageScrollerButton,
    MessageScrollerContent,
    MessageScrollerItem,
    MessageScrollerProvider,
    MessageScrollerViewport,
} from "@/components/ui/message-scroller";
import {MessageRow} from "./message-row";
import type {ChatMessage} from "@/types/chat";
import {useChatStore} from "@/store/chatStore";
// import supabase inside this file lazily to avoid a circular import edge-case
import {supabase} from "@/lib/supabaseClient";
import {useUserStore} from "@/store/userStore";

interface MetaMap {
    [uid: string]: { name: string; avatar: string | null };
}

export function ChatStream({
                               convId,
                               metaMap,
                           }: {
    convId: string;
    metaMap: MetaMap;
}) {
    const user = useUserStore(state => state.user)
    const CURRENT_USER_ID = user.id
    const typingByConv = useChatStore((s) => s.typingByConv);

    const messagesByConv = useChatStore(
        (state) => state.messagesByConv
    );

    const messages = messagesByConv[convId] ?? [];
    const typing = typingByConv[convId] ?? [];
    const setMessages = useChatStore((s) => s.setMessages);
    const appendMessage = useChatStore((s) => s.appendMessage);
    const replaceMessage = useChatStore((s) => s.replaceMessage);
    const setTyping = useChatStore((s) => s.setTyping);

    const lastIdRef = useRef<string | null>(null);

    // -------- 初次拉取 --------
    useEffect(() => {
        let cancelled = false;
        (async () => {
            const {data, error} = await supabase
                .from("messages")
                .select(`
        *,
        attachments:message_attachments(*),
        sender:profiles!messages_sender_profile_fkey(
            id,
            avatar_url,
            bio
        )
    `)
                .eq("conversation_id", convId)
                .order("created_at", {ascending: true})
                .limit(200);
            if (!cancelled) {
                if (!error && data) {
                    setMessages(
                        convId,
                        (data as unknown as ChatMessage[]).map((m) => ({
                            ...m,
                            attachments: m.attachments ?? [],
                        }))
                    );
                    lastIdRef.current =
                        (data as unknown as ChatMessage[]).at(-1)?.id ?? null;
                }
            }
        })();

        return () => {
            cancelled = true;
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [convId]);

    // -------- Realtime --------
    useEffect(() => {
        const channel = supabase
            .channel(`conv:${convId}`, {
                config: {broadcast: {self: false}, presence: {key: convId}},
            })
            .on(
                "postgres_changes",
                {
                    event: "INSERT",
                    schema: "public",
                    table: "messages",
                    filter: `conversation_id=eq.${convId}`,
                },
                async (payload) => {
                    const inserted = payload.new as ChatMessage;
                    const {data: att} = await supabase
                        .from("message_attachments")
                        .select("*")
                        .eq("message_id", inserted.id);
                    appendMessage(convId, {
                        ...inserted,
                        attachments: (att ?? []) as any,
                    });
                }
            )
            .on(
                "postgres_changes",
                {
                    event: "UPDATE",
                    schema: "public",
                    table: "messages",
                    filter: `conversation_id=eq.${convId}`,
                },
                (payload) => {
                    const oldRow = payload.old as ChatMessage;
                    const newRow = payload.new as ChatMessage;
                    replaceMessage(convId, oldRow.id, {
                        ...newRow,
                        attachments: messages.find((m) => m.id === newRow.id)?.attachments ?? [],
                    });
                }
            )
            .on("broadcast", {event: "typing"}, (payload) => {
                const from = (payload as any).payload?.from as string;
                if (!from) return;
                setTyping(convId, Array.from(new Set([...typing, from])).slice(-5));
            })
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [convId]);

    // -------- 已读位点 --------
    useEffect(() => {
        const last = messages[messages.length - 1];
        if (!last) return;
        supabase
            .from("conversation_members")
            .update({
                last_read_message_id: last.id,
                last_read_at: new Date().toISOString(),
            })
            .eq("conversation_id", convId)
            .eq("user_id", CURRENT_USER_ID)
            .then(() => {
            });
    }, [convId, messages.length]);

    const groups = useMemo(() => groupByTurn(messages), [messages]);

    return (
        <MessageScrollerProvider
            autoScroll
            defaultScrollPosition="last-anchor"
            scrollPreviousItemPeek={64}
        >
            <MessageScroller className="relative h-full">
                <MessageScrollerViewport className="flex-1 bg-gradient-to-b from-background to-muted/20">
                    <MessageScrollerContent className="mx-auto flex w-full max-w-3xl flex-col gap-3 px-6 py-6">
                        {groups.map(({turnId, items}) => {
                            const first = items[0];
                            const isMeTurn = first.sender_id === CURRENT_USER_ID;
                            const align: "start" | "end" = isMeTurn ? "end" : "start";
                            return (
                                <MessageScrollerItem
                                    key={turnId}
                                    messageId={turnId}
                                    scrollAnchor={isMeTurn}
                                    className="flex flex-col gap-1.5"
                                >
                                    <div
                                        className={`flex w-full flex-col gap-1.5 ${
                                            align === "end" ? "items-end" : "items-start"
                                        }`}
                                    >
                                        {items.map((m) => {
                                            const meta = m.sender_id
                                                ? metaMap[m.sender_id]
                                                : undefined;
                                            return (
                                                <MessageRow
                                                    key={m.id}
                                                    msg={m}
                                                    isMe={m.sender_id === CURRENT_USER_ID}
                                                    senderName={meta?.name ?? "未知用户"}
                                                    senderAvatar={meta?.avatar ?? null}
                                                />
                                            );
                                        })}
                                    </div>
                                </MessageScrollerItem>
                            );
                        })}
                    </MessageScrollerContent>
                </MessageScrollerViewport>
                <div className="pointer-events-none absolute bottom-4 left-6 z-50 ">
                    <div className="pointer-events-auto ">
                        <MessageScrollerButton/>
                    </div>
                </div>
            </MessageScroller>
        </MessageScrollerProvider>
    );
}

// ---- 工具：把连续同发送者消息合并成 turn ----
type Uuid = string;

function groupByTurn(msgs: ChatMessage[]) {
    const groups: { turnId: string; items: ChatMessage[] }[] = [];
    let cur: { turnId: string; items: ChatMessage[] } | null = null;
    for (const m of msgs) {
        if (m.kind === "system") {
            groups.push({turnId: m.id, items: [m]});
            cur = null;
            continue;
        }
        if (
            cur &&
            cur.items[cur.items.length - 1]?.sender_id === m.sender_id &&
            +new Date(m.created_at) -
            +new Date(cur.items[cur.items.length - 1]!.created_at) <
            5 * 60_000
        ) {
            cur.items.push(m);
        } else {
            cur = {turnId: m.id, items: [m]};
            groups.push(cur);
        }
    }
    return groups;
}


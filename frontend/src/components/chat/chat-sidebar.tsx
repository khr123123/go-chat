import { useCallback, useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ConversationListItem } from "./conversation-list-item";
import {
    MessageCircleMore,
    Plus,
    Settings,
    Check,
    X,
    Loader2,
    UserPlus,
    Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useChatStore } from "@/store/chatStore";
import { cn } from "@/lib/utils";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import type { ConversationWithMeta } from "@/types/chat";

/* ================= 类型（对应 conversation_requests 表） ================= */
type RequestType = "direct" | "group";
type RequestStatus = "pending" | "accepted" | "rejected" | "cancelled";

interface RequestRow {
    id: string;
    type: RequestType;
    requester_id: string;
    target_user_id: string | null;
    target_conversation_id: string | null;
    message: string | null;
    status: RequestStatus;
    decided_by: string | null;
    decided_at: string | null;
    created_at: string;
    requester?: { id: string; display_name: string | null; avatar_url: string | null } | null;
    target_user?: { id: string; display_name: string | null; avatar_url: string | null } | null;
    target_conversation?: { id: string; title: string | null; avatar_url: string | null } | null;
}

interface ProfileRow {
    id: string;
    display_name: string | null;
    avatar_url: string | null;
}

interface GroupRow {
    id: string;
    title: string | null;
    avatar_url: string | null;
}

export function ChatSidebar() {
    const conversations = useChatStore((s) => s.conversations);
    const selectedId = useChatStore((s) => s.selectedId);
    const search = useChatStore((s) => s.search);
    const setSearch = useChatStore((s) => s.setSearch);
    const selectConversation = useChatStore((s) => s.selectConversation);
    const setConversations = useChatStore((s) => s.setConversations);

    /* ================= 申请：本地 state ================= */
    const [incomingRequests, setIncomingRequests] = useState<RequestRow[]>([]);
    const [outgoingRequests, setOutgoingRequests] = useState<RequestRow[]>([]);
    const [requestsLoading, setRequestsLoading] = useState(false);
    const [requestsError, setRequestsError] = useState<string | null>(null);

    const [dialogOpen, setDialogOpen] = useState(false);
    const [friendQuery, setFriendQuery] = useState("");
    const [groupQuery, setGroupQuery] = useState("");
    const [users, setUsers] = useState<ProfileRow[]>([]);
    const [groups, setGroups] = useState<GroupRow[]>([]);
    const [sendingId, setSendingId] = useState<string | null>(null);
    const [dialogError, setDialogError] = useState<string | null>(null);

    /* ================= 加载会话列表（接受好友申请后刷新侧栏） ================= */
    const loadConversations = useCallback(async () => {
        const { data, error } = await supabase
            .from("conversations")
            .select("*, members:conversation_members(*)")
            .order("last_message_at", { ascending: false, nullsFirst: false });
        if (error) throw error;
        setConversations((data ?? []) as ConversationWithMeta[]);
    }, [setConversations]);

    /* ================= 加载申请（直接查表，RLS 只返回与自己相关的行） ================= */
    const loadRequests = useCallback(async () => {
        const {
            data: { user },
        } = await supabase.auth.getUser();
        if (!user) return;

        setRequestsLoading(true);
        setRequestsError(null);
        try {
            const { data, error } = await supabase
                .from("conversation_requests")
                .select(
                    "*, requester:requester_id(id, display_name, avatar_url), target_user:target_user_id(id, display_name, avatar_url), target_conversation:target_conversation_id(id, title, avatar_url)"
                )
                .eq("status", "pending")
                .order("created_at", { ascending: false });
            if (error) throw error;

            const rows = (data ?? []) as RequestRow[];
            // RLS 已保证返回的行都与我相关，这里只区分"收到"和"发出"
            setIncomingRequests(rows.filter((r) => r.requester_id !== user.id));
            setOutgoingRequests(rows.filter((r) => r.requester_id === user.id));
        } catch (e) {
            setRequestsError(e instanceof Error ? e.message : "加载申请失败");
        } finally {
            setRequestsLoading(false);
        }
    }, []);


   
    /* ================= 首次加载 ================= */
    useEffect(() => {
        void loadRequests();
        void loadConversations();
    }, [loadRequests, loadConversations]);

    /* ================= 实时订阅（RLS 自动过滤，只推送与自己相关的变更） ================= */
    useEffect(() => {
        const channel = supabase
            .channel("conversation_requests")
            .on(
                "postgres_changes",
                { event: "*", schema: "public", table: "conversation_requests" },
                () => void loadRequests()
            )
            .subscribe();
        return () => void supabase.removeChannel(channel);
    }, [loadRequests]);

    /* ================= 接受 / 拒绝（乐观更新，失败回滚） ================= */
    const handleAccept = async (requestId: string) => {
        // 乐观移除
        setIncomingRequests((prev) => prev.filter((r) => r.id !== requestId));
        const { error } = await supabase.rpc("accept_request", {
            p_request_id: requestId,
        });
        if (error) {
            setRequestsError(error.message);
            void loadRequests(); // 回滚：重新拉取
            return;
        }
        // 好友申请接受后服务端已建好单聊，刷新会话列表
        try {
            await loadConversations();
        } catch (e) {
            setRequestsError(e instanceof Error ? e.message : "刷新会话失败");
        }
    };

    const handleReject = async (requestId: string) => {
        setIncomingRequests((prev) => prev.filter((r) => r.id !== requestId));
        const { error } = await supabase.rpc("reject_request", {
            p_request_id: requestId,
        });
        if (error) {
            setRequestsError(error.message);
            void loadRequests();
        }
    };

    /* ================= 发起申请（好友 / 入群） ================= */
    const handleSend = async (
        targetUserId?: string,
        targetConversationId?: string
    ) => {
        const key = targetUserId ?? targetConversationId ?? "";
        setSendingId(key);
        setDialogError(null);
        try {
            const { error } = await supabase.rpc("send_request", {
                p_target_user_id: targetUserId ?? null,
                p_target_conversation_id: targetConversationId ?? null,
                p_message: null,
            });
            if (error) throw error;
            void loadRequests(); // 刷新"已发送"列表
        } catch (e) {
            setDialogError(e instanceof Error ? e.message : "发送失败");
        } finally {
            setSendingId(null);
        }
    };

    /* ================= 撤销自己发出的申请 ================= */
    const handleCancel = async (requestId: string) => {
        setOutgoingRequests((prev) => prev.filter((r) => r.id !== requestId));
        const { error } = await supabase.rpc("cancel_request", {
            p_request_id: requestId,
        });
        if (error) {
            setDialogError(error.message);
            void loadRequests();
        }
    };

    /* ================= 弹窗内搜索用户 / 群（防抖） ================= */
    useEffect(() => {
        if (!dialogOpen) return;
        const q = friendQuery.trim();
        if (!q) {
            setUsers([]);
            return;
        }
        const t = setTimeout(async () => {
            const { data, error } = await supabase.rpc("search_users", { p_query: q });
            if (!error) setUsers((data ?? []) as ProfileRow[]);
        }, 300);
        return () => clearTimeout(t);
    }, [friendQuery, dialogOpen]);

    useEffect(() => {
        if (!dialogOpen) return;
        const t = setTimeout(async () => {
            const { data, error } = await supabase.rpc("search_joinable_groups", {
                p_query: groupQuery.trim() || null,
            });
            if (!error) setGroups((data ?? []) as GroupRow[]);
        }, 300);
        return () => clearTimeout(t);
    }, [groupQuery, dialogOpen]);

    /* ================= 会话过滤（原有逻辑不变） ================= */
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
            return c.members.some((m) => m.user_id.toLowerCase().includes(q));
        });
    }, [conversations, search]);

    const directs = filtered.filter((c) => c.type === "direct");
    const groupList = filtered.filter((c) => c.type === "group");

    return (
        <aside className="flex h-full w-[320px] shrink-0 flex-col overflow-hidden border-r border-border bg-background">
            {/* Header */}
            <div className="flex h-14 shrink-0 items-center justify-between gap-2 border-b border-border px-3">
                <div className="flex min-w-0 items-center gap-2">
                    <MessageCircleMore className="size-5 shrink-0 text-primary" />
                    <span className="truncate whitespace-nowrap text-base font-semibold">Chats</span>
                </div>
                <div className="flex shrink-0 items-center gap-1">
                    <Button
                        variant="ghost"
                        size="icon-sm"
                        aria-label="New request"
                        title="New request"
                        onClick={() => setDialogOpen(true)}
                    >
                        <Plus />
                    </Button>
                    <Button variant="ghost" size="icon-sm" aria-label="Settings" title="Settings">
                        <Settings />
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
                    {/* Requests */}
                    <Section
                        title={
                            incomingRequests.length
                                ? `Requests (${incomingRequests.length})`
                                : "Requests"
                        }
                    >
                        {requestsLoading && incomingRequests.length === 0 ? (
                            <Empty>Loading…</Empty>
                        ) : incomingRequests.length === 0 ? (
                            <Empty>No pending requests</Empty>
                        ) : (
                            incomingRequests.map((r) => (
                                <RequestListItem
                                    key={r.id}
                                    request={r}
                                    onAccept={handleAccept}
                                    onReject={handleReject}
                                />
                            ))
                        )}
                        {requestsError && (
                            <p className="px-3 py-1 text-xs text-destructive">{requestsError}</p>
                        )}
                    </Section>

                    <div className="my-2 h-px bg-border" />

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

                    <div className="my-2 h-px bg-border" />

                    {/* Group Chats */}
                    <Section title="Group Chats">
                        {groupList.length === 0 ? (
                            <Empty>No matching group chats</Empty>
                        ) : (
                            groupList.map((c) => (
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

            {/* 新申请弹窗 */}
            <NewRequestDialog
                open={dialogOpen}
                onOpenChange={setDialogOpen}
                users={users}
                groups={groups}
                friendQuery={friendQuery}
                setFriendQuery={setFriendQuery}
                groupQuery={groupQuery}
                setGroupQuery={setGroupQuery}
                outgoing={outgoingRequests}
                sendingId={sendingId}
                error={dialogError}
                onSend={handleSend}
                onCancel={handleCancel}
            />
        </aside>
    );
}

/* ================= 收到的申请项 ================= */
function RequestListItem({
                             request,
                             onAccept,
                             onReject,
                         }: {
    request: RequestRow;
    onAccept: (id: string) => void;
    onReject: (id: string) => void;
}) {
    const isDirect = request.type === "direct";
    const name = isDirect
        ? request.requester?.display_name ?? "Unknown user"
        : request.target_conversation?.title ?? "Unknown group";
    const avatar = isDirect
        ? request.requester?.avatar_url
        : request.target_conversation?.avatar_url;

    return (
        <div className="flex items-center gap-2 rounded-md px-2 py-1.5 hover:bg-accent/50">
            <Avatar className="size-8 shrink-0">
                <AvatarImage src={avatar ?? undefined} />
                <AvatarFallback>{name.slice(0, 1).toUpperCase()}</AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{name}</p>
                <p className="truncate text-xs text-muted-foreground">
                    {isDirect ? "Friend request" : "Group join request"}
                    {request.message ? ` · ${request.message}` : ""}
                </p>
            </div>
            <div className="flex shrink-0 items-center gap-1">
                <Button
                    size="icon-xs"
                    variant="default"
                    title="Accept"
                    onClick={() => onAccept(request.id)}
                >
                    <Check className="size-3.5" />
                </Button>
                <Button
                    size="icon-xs"
                    variant="ghost"
                    title="Reject"
                    onClick={() => onReject(request.id)}
                >
                    <X className="size-3.5" />
                </Button>
            </div>
        </div>
    );
}

/* ================= 新申请弹窗（好友 / 入群 / 已发送） ================= */
function NewRequestDialog({
                              open,
                              onOpenChange,
                              users,
                              groups,
                              friendQuery,
                              setFriendQuery,
                              groupQuery,
                              setGroupQuery,
                              outgoing,
                              sendingId,
                              error,
                              onSend,
                              onCancel,
                          }: {
    open: boolean;
    onOpenChange: (v: boolean) => void;
    users: ProfileRow[];
    groups: GroupRow[];
    friendQuery: string;
    setFriendQuery: (v: string) => void;
    groupQuery: string;
    setGroupQuery: (v: string) => void;
    outgoing: RequestRow[];
    sendingId: string | null;
    error: string | null;
    onSend: (targetUserId?: string, targetConversationId?: string) => void;
    onCancel: (id: string) => void;
}) {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>New Request</DialogTitle>
                    <DialogDescription>Add a friend or request to join a group</DialogDescription>
                </DialogHeader>

                <Tabs defaultValue="friend">
                    <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="friend">
                            <UserPlus className="mr-1 size-4" /> Add Friend
                        </TabsTrigger>
                        <TabsTrigger value="group">
                            <Users className="mr-1 size-4" /> Join Group
                        </TabsTrigger>
                    </TabsList>

                    <TabsContent value="friend" className="space-y-2">
                        <Input
                            placeholder="Search by name or ID"
                            value={friendQuery}
                            onChange={(e) => setFriendQuery(e.target.value)}
                        />
                        <div className="max-h-64 space-y-1 overflow-y-auto">
                            {users.map((u) => (
                                <div key={u.id} className="flex items-center gap-2 rounded-md border p-2">
                                    <Avatar className="size-8">
                                        <AvatarImage src={u.avatar_url ?? undefined} />
                                        <AvatarFallback>{(u.display_name ?? "?").slice(0, 1)}</AvatarFallback>
                                    </Avatar>
                                    <span className="min-w-0 flex-1 truncate text-sm">
                    {u.display_name ?? u.id}
                  </span>
                                    <Button size="xs" disabled={sendingId === u.id} onClick={() => onSend(u.id)}>
                                        {sendingId === u.id ? (
                                            <Loader2 className="size-3 animate-spin" />
                                        ) : (
                                            "Add"
                                        )}
                                    </Button>
                                </div>
                            ))}
                            {friendQuery.trim() && users.length === 0 && (
                                <p className="py-4 text-center text-xs text-muted-foreground">
                                    No users found
                                </p>
                            )}
                        </div>
                    </TabsContent>

                    <TabsContent value="group" className="space-y-2">
                        <Input
                            placeholder="Search groups"
                            value={groupQuery}
                            onChange={(e) => setGroupQuery(e.target.value)}
                        />
                        <div className="max-h-64 space-y-1 overflow-y-auto">
                            {groups.map((g) => (
                                <div key={g.id} className="flex items-center gap-2 rounded-md border p-2">
                                    <Avatar className="size-8">
                                        <AvatarImage src={g.avatar_url ?? undefined} />
                                        <AvatarFallback>{(g.title ?? "G").slice(0, 1)}</AvatarFallback>
                                    </Avatar>
                                    <span className="min-w-0 flex-1 truncate text-sm">
                    {g.title ?? "Unnamed group"}
                  </span>
                                    <Button
                                        size="xs"
                                        disabled={sendingId === g.id}
                                        onClick={() => onSend(undefined, g.id)}
                                    >
                                        {sendingId === g.id ? (
                                            <Loader2 className="size-3 animate-spin" />
                                        ) : (
                                            "Join"
                                        )}
                                    </Button>
                                </div>
                            ))}
                            {groups.length === 0 && (
                                <p className="py-4 text-center text-xs text-muted-foreground">
                                    No joinable groups
                                </p>
                            )}
                        </div>
                    </TabsContent>
                </Tabs>

                {/* 已发送的申请（可撤销） */}
                {outgoing.length > 0 && (
                    <div className="space-y-1 border-t pt-2">
                        <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                            Sent ({outgoing.length})
                        </p>
                        {outgoing.map((r) => {
                            const name =
                                r.type === "direct"
                                    ? r.target_user?.display_name ?? r.target_user_id ?? "User"
                                    : r.target_conversation?.title ?? "Group";
                            return (
                                <div key={r.id} className="flex items-center gap-2 rounded-md border p-2">
                                    <span className="min-w-0 flex-1 truncate text-xs">{name}</span>
                                    <Button size="xs" variant="ghost" onClick={() => onCancel(r.id)}>
                                        Cancel
                                    </Button>
                                </div>
                            );
                        })}
                    </div>
                )}

                {error && <p className="text-xs text-destructive">{error}</p>}
            </DialogContent>
        </Dialog>
    );
}

/* ================= 原有辅助组件 ================= */
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
            <div className="flex min-w-0 flex-col gap-0.5">{children}</div>
        </section>
    );
}

function Empty({ children }: { children: React.ReactNode }) {
    return (
        <div className="truncate whitespace-nowrap px-3 py-6 text-center text-xs text-muted-foreground">
            {children}
        </div>
    );
}

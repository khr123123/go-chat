import { create } from "zustand";
import type {
    ConversationWithMeta,
    ChatMessage,
    PendingAttachment,
} from "@/types/chat";

interface ChatState {
    conversations: ConversationWithMeta[];
    selectedId: string | null;
    messagesByConv: Record<string, ChatMessage[]>;
    search: string;
    pending: PendingAttachment[];
    typingByConv: Record<string, Uuid[]>;

    setConversations: (list: ConversationWithMeta[]) => void;
    selectConversation: (id: string | null) => void;
    setMessages: (convId: string, msgs: ChatMessage[]) => void;
    appendMessage: (convId: string, msg: ChatMessage) => void;
    replaceMessage: (convId: string, oldId: string, msg: ChatMessage) => void;
    setSearch: (q: string) => void;
    addPending: (a: PendingAttachment) => void;
    updatePending: (id: string, p: Partial<PendingAttachment>) => void;
    removePending: (id: string) => void;
    setTyping: (convId: string, userIds: Uuid[]) => void;
}

type Uuid = string;

export const useChatStore = create<ChatState>((set) => ({
    conversations: [],
    selectedId: null,
    messagesByConv: {},
    search: "",
    pending: [],
    typingByConv: {},

    setConversations: (list) => set({ conversations: list }),
    selectConversation: (id) => set({ selectedId: id }),
    setMessages: (convId, msgs) =>
        set((s) => ({ messagesByConv: { ...s.messagesByConv, [convId]: msgs } })),
    appendMessage: (convId, msg) =>
        set((s) => {
            const list = s.messagesByConv[convId] ?? [];
            if (list.some((m) => m.id === msg.id)) return s;
            return {
                messagesByConv: { ...s.messagesByConv, [convId]: [...list, msg] },
            };
        }),
    replaceMessage: (convId, oldId, msg) =>
        set((s) => {
            const list = (s.messagesByConv[convId] ?? []).map((m) =>
                m.id === oldId ? msg : m
            );
            return { messagesByConv: { ...s.messagesByConv, [convId]: list } };
        }),
    setSearch: (q) => set({ search: q }),
    addPending: (a) => set((s) => ({ pending: [...s.pending, a] })),
    updatePending: (id, p) =>
        set((s) => ({
            pending: s.pending.map((it) => (it.localId === id ? { ...it, ...p } : it)),
        })),
    removePending: (id) =>
        set((s) => ({ pending: s.pending.filter((it) => it.localId !== id) })),
    setTyping: (convId, userIds) =>
        set((s) => ({ typingByConv: { ...s.typingByConv, [convId]: userIds } })),
}));

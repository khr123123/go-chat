export type Uuid = string;

export type ConversationType = "direct" | "group";

export interface Profile {
    id: Uuid;
    display_name: string | null;
    avatar_url: string | null;
    bio: string | null;
    last_seen_at?: string | null;
}

export interface Conversation {
    id: Uuid;
    type: ConversationType;
    title: string | null;
    description: string | null;
    avatar_url: string | null;
    last_message_at: string | null;
    last_message_preview: string | null;
    created_by: Uuid;
}

export interface ConversationMember {
    conversation_id: Uuid;
    user_id: Uuid;
    role: "owner" | "admin" | "member";
    joined_at: string;
    last_read_message_id: Uuid | null;
    last_read_at: string | null;
    profile?: Profile;
}

export interface MessageAttachment {
    id: Uuid;
    message_id: Uuid;
    storage_path: string;
    mime_type: string | null;
    size_bytes: number | null;
    width: number | null;
    height: number | null;
}

export type MessageKind = "text" | "image" | "file" | "system";

export interface ChatMessage {
    id: Uuid;
    conversation_id: Uuid;
    sender_id: Uuid | null;
    kind: MessageKind;
    body: string | null;
    reply_to_id: Uuid | null;
    is_edited: boolean;
    is_deleted: boolean;
    created_at: string;
    attachments?: MessageAttachment[];
    sender?: Profile | null;
}

export interface ConversationWithMeta extends Conversation {
    members: ConversationMember[];
    unread_count: number;
}

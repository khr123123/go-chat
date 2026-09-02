export type Uuid = string;
export type ConversationType = "direct" | "group";

export interface Profile {
    id: Uuid;
    avatar_url: string | null;
    bio: string | null;
    display_name:string;
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

export interface MemberRow {
    conversation_id: Uuid;
    user_id: Uuid;
    display_name:string;
    role: "owner" | "admin" | "member";
    last_read_message_id: Uuid | null;
    last_read_at: string | null;
    profile: Profile | null;
}

export type MessageKind = "text" | "image" | "file" | "system";

export interface AttachmentRow {
    id: Uuid;
    message_id: Uuid;
    storage_path: string;
    mime_type: string | null;
    size_bytes: number | null;
    width: number | null;
    height: number | null;
}

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
    attachments: AttachmentRow[];
}

export interface ConversationWithMeta extends Conversation {
    members: MemberRow[];
    unread_count: number;
}

export interface PendingAttachment {
    localId: string;
    file: File;
    previewUrl: string;
    status: "uploading" | "done" | "error";
    progress: number;
    storagePath?: string;
}

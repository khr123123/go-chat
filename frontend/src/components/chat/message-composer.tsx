import {useMemo, useRef, useState} from "react";
import {Button} from "@/components/ui/button";
import {ImagePlus, Paperclip, Send, Smile} from "lucide-react";
import {cn} from "@/lib/utils";
import {useChatStore} from "@/store/chatStore";
import {AttachmentGroup} from "@/components/ui/attachment";
import {AttachmentChip} from "./attachment-chip";
import type {AttachmentRow, ChatMessage, PendingAttachment} from "@/types/chat";
import {toast} from "sonner";
import {useUserStore} from "@/store/userStore";
import {supabase} from "@/lib/supabaseClient";

interface Props {
    convId: string;
    onSent: (msg: ChatMessage) => void;
}

export function MessageComposer({convId, onSent}: Props) {
    const user = useUserStore(state => state.user)
    const CURRENT_USER_ID = user.id
    const [text, setText] = useState("");
    const fileRef = useRef<HTMLInputElement>(null);

    const imageRef = useRef<HTMLInputElement>(null);

    const pendingList = useChatStore((s) => s.pending);

    const pending = useMemo(
        () => pendingList.filter((p) => p.status !== "done"),
        [pendingList]
    );
    const addPending = useChatStore((s) => s.addPending);
    const updatePending = useChatStore((s) => s.updatePending);
    const removePending = useChatStore((s) => s.removePending);

    const send = async () => {
        const t = text.trim();
        if (!t && pending.length === 0) return;
        setText("");

        if (pending.length > 0) {
            for (const p of pending) {
                await uploadAndSend(convId, t, p);
            }
        } else {
            await sendText(convId, t);
        }
    };

    const sendText = async (convId: string, body: string) => {
        const {
            data: {user: authUser},
            error: authError,
        } = await supabase.auth.getUser();

        if (authError || !authUser) {
            toast.error("用户未登录");
            console.error("auth error:", authError);
            return;
        }

        console.log("========== SEND MESSAGE ==========");
        console.log("auth user:", authUser.id);
        console.log("store user:", CURRENT_USER_ID);
        console.log("conversation:", convId);
        console.log("body:", body);

        const {data, error} = await supabase
            .from("messages")
            .insert({
                conversation_id: convId,
                sender_id: authUser.id,
                kind: "text",
                body,
            })
            .select("*")
            .maybeSingle();

        if (error) {
            console.error("MESSAGE INSERT ERROR");
            console.error("code:", error.code);
            console.error("message:", error.message);
            console.error("details:", error.details);
            console.error("hint:", error.hint);

            toast.error(`发送失败: ${error.message}`);
            return;
        }

        console.log("MESSAGE INSERT SUCCESS:", data);

        if (data) {
            onSent({
                ...(data as ChatMessage),
                attachments: [],
            });
        }
    };

    const uploadAndSend = async (
        convId: string,
        body: string,
        p: PendingAttachment
    ) => {
        try {
            updatePending(p.localId, {status: "uploading", progress: 0});
            const folder = `${convId}/${CURRENT_USER_ID}`;
            const path = `${folder}/${Date.now()}-${p.file.name}`;
            const {error: upErr} = await supabase.storage
                .from("attachments")
                .upload(path, p.file, {contentType: p.file.type, upsert: false});
            if (upErr) throw upErr;

            const {data: pub} = supabase.storage
                .from("attachments")
                .getPublicUrl(path);

            const isImage = p.file.type.startsWith("image/");
            const {data: msg, error: msgErr} = await supabase
                .from("messages")
                .insert({
                    conversation_id: convId,
                    sender_id: CURRENT_USER_ID,
                    kind: isImage ? "image" : "file",
                    body: body || null,
                })
                .select()
                .single();
            if (msgErr) throw msgErr;

            await supabase.from("message_attachments").insert({
                message_id: msg.id,
                storage_path: pub.publicUrl,
                mime_type: p.file.type,
                size_bytes: p.file.size,
            });

            onSent({
                ...(msg as ChatMessage),
                attachments: [
                    {
                        id: crypto.randomUUID(),
                        message_id: msg.id,
                        storage_path: pub.publicUrl,
                        mime_type: p.file.type,
                        size_bytes: p.file.size,
                        width: null,
                        height: null,
                    } as AttachmentRow,
                ],
            });
            removePending(p.localId);
            setText("");
        } catch (e) {
            const err = e as Error;
            toast.error("上传失败: " + err.message);
            updatePending(p.localId, {status: "error"});
        }
    };

    const queueFiles = (files: FileList | null) => {
        if (!files) return;
        for (const f of Array.from(files)) {
            const localId = crypto.randomUUID();
            addPending({
                localId,
                file: f,
                previewUrl: f.type.startsWith("image/")
                    ? URL.createObjectURL(f)
                    : "",
                status: "uploading",
                progress: 0,
            });
        }
    };

    return (
        <div className="border-t border-border bg-background/80 px-4 py-3 backdrop-blur">
            {pending.length > 0 && (
                <div className="mb-2">
                    <AttachmentGroup>
                        {pending.map((p) => (
                            <AttachmentChip key={p.localId} p={p}/>
                        ))}
                    </AttachmentGroup>
                </div>
            )}

            <div className="flex items-end gap-2 rounded-xl border border-border bg-muted/30 p-2 shadow-sm">
                <input
                    ref={fileRef}
                    type="file"
                    hidden
                    multiple
                    onChange={(e) => {
                        queueFiles(e.target.files);
                        e.target.value = "";
                    }}
                />
                <input
                    ref={imageRef}
                    type="file"
                    hidden
                    accept="image/*"
                    multiple
                    onChange={(e) => {
                        queueFiles(e.target.files);
                        e.target.value = "";
                    }}
                />

                <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    aria-label="上传文件"
                    onClick={() => fileRef.current?.click()}
                >
                    <Paperclip/>
                </Button>
                <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    aria-label="上传图片"
                    onClick={() => imageRef.current?.click()}
                >
                    <ImagePlus/>
                </Button>

                <textarea
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    onKeyDown={(e) => {
                        if (e.key === "Enter" && !e.shiftKey) {
                            e.preventDefault();
                            send();
                        }
                    }}
                    rows={1}
                    placeholder="输入消息,Enter 发送,Shift+Enter 换行"
                    className={cn(
                        "max-h-32 flex-1 resize-none bg-transparent px-2 py-1.5 text-sm",
                        "placeholder:text-muted-foreground focus:outline-none"
                    )}
                />

                <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    aria-label="表情"
                >
                    <Smile/>
                </Button>
                <Button type="button" size="icon" aria-label="发送" onClick={send}>
                    <Send/>
                </Button>
            </div>
        </div>
    );
}

import { useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { ImagePlus, Paperclip, Send, Smile } from "lucide-react";
import { cn } from "@/lib/utils";
import { useChatStore } from "@/store/chatStore";
import { AttachmentGroup } from "@/components/ui/attachment";
import { AttachmentChip } from "./attachment-chip";
import type {
    AttachmentRow,
    ChatMessage,
    PendingAttachment,
} from "@/types/chat";
import { toast } from "sonner";
import { supabase } from "@/lib/supabaseClient";

interface Props {
    convId: string;
    onSent: (msg: ChatMessage) => void;
}

export function MessageComposer({ convId, onSent }: Props) {
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

    /** 定位 RLS 报错：打印 code/details，才能知道是哪一步 */
    const logErr = (step: string, e: unknown) => {
        const err = e as { code?: string; details?: string; message?: string };
        console.error(`[${step}]`, {
            code: err.code,        // PostgREST RLS = 42501
            details: err.details,  // 会指明违反哪条 policy
            message: err.message,
        });
    };

    /** 获取当前登录用户 */
    const getAuthUser = async () => {
        const { data, error } = await supabase.auth.getUser();
        if (error || !data.user) {
            toast.error("用户未登录");
            return null;
        }
        return data.user;
    };

    /** 发送消息 */
    const send = async () => {
        const body = text.trim();
        if (!body && pending.length === 0) return;

        const authUser = await getAuthUser();
        if (!authUser) return;

        setText("");

        if (pending.length === 0) {
            await sendText(convId, body, authUser.id);
            return;
        }

        // 快照当前待发列表，避免循环中 store 变化影响遍历
        const toSend = [...pending];
        for (let i = 0; i < toSend.length; i++) {
            await uploadAndSend(
                convId,
                i === 0 ? body : "",
                toSend[i],
                authUser.id
            );
        }
    };

    /** 发送纯文本消息 */
    const sendText = async (
        conversationId: string,
        body: string,
        senderId: string
    ) => {
        const { data, error } = await supabase
            .from("messages")
            .insert({
                conversation_id: conversationId,
                sender_id: senderId,
                kind: "text",
                body,
            })
            .select("*")
            .single();

        if (error) {
            logErr("sendText insert messages", error);
            toast.error(`发送失败: ${error.message}`);
            return;
        }

        if (data) {
            onSent({ ...(data as ChatMessage), attachments: [] });
        }
    };

    /**
     * 上传附件并发送消息
     *
     * 流程：
     * 1. 创建 messages
     * 2. 得到 message.id
     * 3. 使用 conversationId/messageId/fileName 作为 Storage path
     * 4. 上传文件
     * 5. 创建 message_attachments
     * 6. 返回消息
     */
    const uploadAndSend = async (
        conversationId: string,
        body: string,
        p: PendingAttachment,
        senderId: string
    ) => {
        try {
            updatePending(p.localId, { status: "uploading", progress: 0 });

            const isImage = p.file.type.startsWith("image/");

            // 第一步：先建 message（Storage path 需要 messageId）
            const { data: msg, error: msgErr } = await supabase
                .from("messages")
                .insert({
                    conversation_id: conversationId,
                    sender_id: senderId,
                    kind: isImage ? "image" : "file",
                    body: body || null,
                })
                .select("*")
                .single();

            if (msgErr) {
                logErr("step1 insert messages", msgErr);
                throw msgErr;
            }
            if (!msg) throw new Error("创建消息失败");

            // 第二步：构造 Storage path：convId/messageId/文件名
            const safeFileName = sanitizeKey(p.file.name);
            const path = [conversationId, msg.id, `${Date.now()}-${safeFileName}`].join("/");
            // 第三步：上传文件
            const { error: uploadError } = await supabase.storage
                .from("attachments")
                .upload(path, p.file, {
                    contentType: p.file.type || "application/octet-stream",
                    upsert: false,
                });

            if (uploadError) {
                logErr("step3 storage upload", uploadError);
                await supabase.from("messages").delete().eq("id", msg.id);
                throw uploadError;
            }

            updatePending(p.localId, { status: "uploading", progress: 100 });

            // 第四步：创建 message_attachments
            const { data: attachment, error: attErr } = await supabase
                .from("message_attachments")
                .insert({
                    message_id: msg.id,
                    storage_path: path,
                    mime_type: p.file.type || "application/octet-stream",
                    size_bytes: p.file.size,
                })
                .select("*")
                .single();

            if (attErr) {
                logErr("step4 insert message_attachments", attErr);
                await supabase.storage.from("attachments").remove([path]);
                await supabase.from("messages").delete().eq("id", msg.id);
                throw attErr;
            }

            onSent({
                ...(msg as ChatMessage),
                attachments: [{ ...(attachment as AttachmentRow) }],
            });

            removePending(p.localId);
        } catch (e) {
            const err = e instanceof Error ? e : new Error(String(e));
            console.error("uploadAndSend 失败:", err);
            toast.error(`上传失败: ${err.message}`);
            updatePending(p.localId, { status: "error", progress: 0 });
        }
    };

    /** 将文件加入待上传列表 */
    const queueFiles = (files: FileList | null) => {
        if (!files) return;
        for (const file of Array.from(files)) {
            const localId = crypto.randomUUID();
            addPending({
                localId,
                file,
                previewUrl: file.type.startsWith("image/")
                    ? URL.createObjectURL(file)
                    : "",
                // 类型里没有 queued，用 uploading 作为初始状态
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
                            <AttachmentChip key={p.localId} p={p} />
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
                    <Paperclip />
                </Button>

                <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    aria-label="上传图片"
                    onClick={() => imageRef.current?.click()}
                >
                    <ImagePlus />
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
                    placeholder="输入消息，Enter 发送，Shift+Enter 换行"
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
                    <Smile />
                </Button>

                <Button
                    type="button"
                    size="icon"
                    aria-label="发送"
                    onClick={send}
                >
                    <Send />
                </Button>
            </div>
        </div>
    );
}
/**
 * 清洗成 Supabase/S3 合法的对象 key
 * - 非 ASCII（中文等）→ 下划线
 * - 非法字符/空格 → 下划线
 * - 折叠连续点/下划线，去首尾
 * - 截断长度，保留扩展名
 */
const sanitizeKey = (name: string) => {
    const dotIdx = name.lastIndexOf(".");
    const ext = dotIdx > 0 ? name.slice(dotIdx).toLowerCase() : "";
    const base = dotIdx > 0 ? name.slice(0, dotIdx) : name;

    const safe = base
        .replace(/[^\x00-\x7F]/g, "_")          // 中文等非 ASCII → _
        .replace(/[\\/:*?"<>|%\s]+/g, "_")      // 非法字符/空格 → _
        .replace(/\.+/g, "_")                    // 连续点 → _
        .replace(/_+/g, "_")                     // 连续下划线 → _
        .replace(/^[._]+|[._]+$/g, "")           // 去首尾点/下划线
        .slice(0, 120);                          // 留足 key 长度余量

    return (safe || "file") + ext;
};

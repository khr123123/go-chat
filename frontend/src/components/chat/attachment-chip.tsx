import {
    Attachment,
    AttachmentMedia,
    AttachmentContent,
    AttachmentTitle,
    AttachmentDescription,
    AttachmentActions,
    AttachmentAction,
} from "@/components/ui/attachment";
import { FileText, X, Image as ImageIcon } from "lucide-react";
import { useChatStore } from "@/store/chatStore";
import type { PendingAttachment } from "@/types/chat";

export function AttachmentChip({ p }: { p: PendingAttachment }) {
    const updatePending = useChatStore((s) => s.updatePending);
    const removePending = useChatStore((s) => s.removePending);
    const isImage = p.file.type.startsWith("image/");
    const state =
        p.status === "uploading"
            ? "uploading"
            : p.status === "error"
                ? "error"
                : "done";

    return (
        <Attachment state={state} size="sm">
            <AttachmentMedia variant={isImage ? "image" : "icon"}>
                {isImage ? (
                    <img
                        src={p.previewUrl}
                        alt={p.file.name}
                        className="block h-full w-full object-cover"
                    />
                ) : (
                    <ImageIcon />
                )}
            </AttachmentMedia>
            <AttachmentContent>
                <AttachmentTitle>{p.file.name}</AttachmentTitle>
                <AttachmentDescription>
                    {p.status === "uploading"
                        ? `上传中 · ${p.progress}%`
                        : p.status === "error"
                            ? "失败"
                            : `${p.file.type.split("/")[1] ?? "FILE"} · ${formatBytes(
                                p.file.size
                            )}`}
                </AttachmentDescription>
            </AttachmentContent>
            <AttachmentActions>
                <AttachmentAction
                    aria-label={`移除 ${p.file.name}`}
                    onClick={() => removePending(p.localId)}
                >
                    <X />
                </AttachmentAction>
            </AttachmentActions>
        </Attachment>
    );
}

function formatBytes(n: number) {
    if (n < 1024) return `${n} B`;
    if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
    if (n < 1024 * 1024 * 1024) return `${(n / 1024 / 1024).toFixed(1)} MB`;
    return `${(n / 1024 / 1024 / 1024).toFixed(2)} GB`;
}

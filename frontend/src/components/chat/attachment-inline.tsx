import {
    Attachment,
    AttachmentMedia,
    AttachmentContent,
    AttachmentTitle,
    AttachmentDescription,
} from "@/components/ui/attachment";
import { FileText, Image as ImageIcon, Download } from "lucide-react";
import type { AttachmentRow } from "@/types/chat";

export function AttachmentInline({ a }: { a: AttachmentRow }) {
    const isImage = a.mime_type?.startsWith("image/") ?? false;
    const name = a.storage_path.split("/").pop() ?? "file";

    return (
        <Attachment orientation="horizontal">
            {isImage ? (
                <AttachmentMedia
                    variant="image"
                    className="overflow-hidden rounded-md"
                >
                    <img
                        src={a.storage_path}
                        alt={name}
                        className="block max-h-[260px] w-auto object-cover"
                    />
                </AttachmentMedia>
            ) : (
                <AttachmentMedia>
                    {isImage ? <ImageIcon /> : <FileText />}
                </AttachmentMedia>
            )}

            <AttachmentContent>
                <AttachmentTitle>{name}</AttachmentTitle>
                <AttachmentDescription>
                    {a.mime_type?.split("/")[1]?.toUpperCase() ?? "FILE"}
                    {a.size_bytes ? ` · ${formatBytes(a.size_bytes)}` : ""}
                </AttachmentDescription>
            </AttachmentContent>

            <div className="ml-2 grid h-8 w-8 shrink-0 place-items-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground">
                <a
                    href={a.storage_path}
                    target="_blank"
                    rel="noreferrer"
                    aria-label="下载附件"
                    className="grid h-full w-full place-items-center"
                >
                    <Download size={16} />
                </a>
            </div>
        </Attachment>
    );
}

function formatBytes(n: number) {
    if (n < 1024) return `${n} B`;
    if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
    if (n < 1024 * 1024 * 1024) return `${(n / 1024 / 1024).toFixed(1)} MB`;
    return `${(n / 1024 / 1024 / 1024).toFixed(2)} GB`;
}

import { cn } from "@/lib/utils";
import { AttachmentGroup as AttachmentGroupComp } from "@/components/ui/attachment";
import type { ChatMessage } from "@/types/chat";

import { AttachmentGroupAlias } from "./attachment-group";
export {}; // place-holder so the linter accepts the unused-import warning suppression

export function MessageBody({
                                msg,
                                align,
                            }: {
    msg: ChatMessage;
    align: "start" | "end";
}) {
    if (msg.kind === "system") {
        return (
            <div
                className={cn(
                    "rounded-md bg-muted/60 px-3 py-1.5 text-xs italic text-muted-foreground",
                    align === "end" ? "ml-auto" : "mr-auto"
                )}
            >
                {msg.body}
            </div>
        );
    }

    const imgs = msg.attachments.filter(
        (a) => a.mime_type?.startsWith("image/") ?? false
    );
    const files = msg.attachments.filter(
        (a) => !(a.mime_type?.startsWith("image/") ?? false)
    );

    return (
        <div className={cn("flex flex-col gap-1.5", align === "end" ? "items-end" : "items-start")}>
            {msg.body && (
                <div className="whitespace-pre-wrap break-words text-sm leading-relaxed">
                    {msg.body}
                </div>
            )}
            {imgs.length > 0 && (
                <AttachmentGroupComp className="max-w-[420px]">
                    {imgs.map((a) => (
                        <ImageCard key={a.id} src={a.storage_path} />
                    ))}
                </AttachmentGroupComp>
            )}
            {files.length > 0 && (
                <div className="flex flex-col gap-1.5">
                    {files.map((a) => (
                        <AttachmentGroupAlias key={a.id} attachments={[a]} />
                    ))}
                </div>
            )}
        </div>
    );
}

function ImageCard({ src }: { src: string }) {
    return (
        <div className="overflow-hidden rounded-md ring-1 ring-border bg-muted">
            <img
                src={src}
                alt=""
                className="block max-h-[260px] w-auto object-cover"
                loading="lazy"
            />
        </div>
    );
}

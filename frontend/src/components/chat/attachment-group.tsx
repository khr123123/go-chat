import {
    AttachmentGroup
} from "@/components/ui/attachment";
import { AttachmentInline } from "./attachment-inline";
import type { AttachmentRow } from "@/types/chat";

export function AttachmentGroupAlias({
                                    attachments,
                                }: {
    attachments: AttachmentRow[];
}) {
    return (
        <AttachmentGroup>
            {attachments.map((a) => (
                <AttachmentInline key={a.id} a={a} />
            ))}
        </AttachmentGroup>
    );
}

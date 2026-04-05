import { forwardRef, useImperativeHandle } from "react";
import { useCreateBlockNote } from "@blocknote/react";
import { BlockNoteView } from "@blocknote/shadcn";
import type { Block } from "@blocknote/core";
import "@blocknote/shadcn/style.css";

export interface EditorHandle {
  getContent: () => Block[];
}

interface EditorProps {
  initialContent?: Block[];
  editable?: boolean;
}

const Editor = forwardRef<EditorHandle, EditorProps>(
  ({ initialContent, editable = true }, ref) => {
    const editor = useCreateBlockNote({
      initialContent: initialContent?.length ? initialContent : undefined,
    });

    useImperativeHandle(ref, () => ({
      getContent: () => editor.document as Block[],
    }));

    return (
      <BlockNoteView editor={editor} editable={editable} />
    );
  }
);

Editor.displayName = "Editor";

export default Editor;

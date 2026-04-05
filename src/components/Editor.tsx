import { forwardRef, useImperativeHandle } from "react";
import { useCreateBlockNote } from "@blocknote/react";
import { BlockNoteViewRaw } from "@blocknote/react";
import type { Block } from "@blocknote/core";
import "@blocknote/react/style.css";

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

    return <BlockNoteViewRaw editor={editor} editable={editable} />;
  }
);

Editor.displayName = "Editor";

export default Editor;

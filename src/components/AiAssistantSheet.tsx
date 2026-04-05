import { useEffect, useRef, useState } from "react";
import { SparklesIcon, SendHorizonalIcon } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { askWikiCallable } from "@/lib/functions";

interface Message {
  role: "user" | "assistant";
  text: string;
}

export default function AiAssistantSheet() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Scroll to bottom on new messages
  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages, loading]);

  const handleSend = async () => {
    const query = input.trim();
    if (!query || loading) return;

    setInput("");
    setMessages((prev) => [...prev, { role: "user", text: query }]);
    setLoading(true);

    try {
      const result = await askWikiCallable({ question: query });
      setMessages((prev) => [...prev, { role: "assistant", text: result.data.answer }]);
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", text: "Sorry, something went wrong." },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      void handleSend();
    }
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      {/* T22: trigger button — sits in the WikiLayout top bar */}
      <Tooltip>
        <TooltipTrigger
          render={
            <Button
              variant="ghost"
              size="icon-sm"
              aria-label="AI assistant"
              onClick={() => setOpen(true)}
            />
          }
        >
          <SparklesIcon className="size-4" />
        </TooltipTrigger>
        <TooltipContent side="bottom">AI assistant</TooltipContent>
      </Tooltip>

      <SheetContent side="right" className="flex flex-col p-0 sm:max-w-md">
        <SheetHeader className="border-b px-4 py-3">
          <SheetTitle className="flex items-center gap-2">
            <SparklesIcon className="size-4" />
            AI Assistant
          </SheetTitle>
        </SheetHeader>

        {/* Scrollable message area */}
        <div
          ref={scrollRef}
          className="flex-1 overflow-y-auto px-4 py-3 space-y-3"
        >
          {messages.length === 0 && (
            <p className="text-center text-sm text-muted-foreground pt-8">
              Ask anything about the wiki…
            </p>
          )}

          {messages.map((msg, i) => (
            <div
              key={i}
              className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[80%] rounded-lg px-3 py-2 text-sm ${
                  msg.role === "user"
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground"
                }`}
              >
                {msg.text}
              </div>
            </div>
          ))}

          {loading && (
            <div className="flex justify-start">
              <div className="max-w-[80%] rounded-lg bg-muted px-3 py-2 text-sm text-muted-foreground">
                <span className="animate-pulse">Thinking…</span>
              </div>
            </div>
          )}
        </div>

        {/* Input area */}
        <div className="border-t px-4 py-3 flex items-center gap-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask a question…"
            disabled={loading}
            className="flex-1"
          />
          <Button
            size="icon-sm"
            onClick={() => void handleSend()}
            disabled={!input.trim() || loading}
            aria-label="Send"
          >
            <SendHorizonalIcon className="size-4" />
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}

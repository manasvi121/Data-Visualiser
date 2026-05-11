import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, type UIMessage } from "ai";
import { useEffect, useMemo, useRef, useState } from "react";
import { Bot, Send, Sparkles, User } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { Button } from "@/components/ui/button";
import { buildDatasetSummary, type Dataset } from "@/lib/dataset";

const SUGGESTIONS = [
  "Summarise the dataset in 5 bullets",
  "What are the most surprising patterns?",
  "Which columns correlate the most?",
  "Suggest 3 next analyses I should run",
];

function messageText(m: UIMessage) {
  return m.parts
    .map((p) => (p.type === "text" ? p.text : ""))
    .join("");
}

export function Chatbot({ dataset }: { dataset: Dataset }) {
  const summary = useMemo(() => buildDatasetSummary(dataset), [dataset]);
  const transport = useMemo(
    () =>
      new DefaultChatTransport({
        api: "/api/chat",
        body: () => ({ datasetSummary: summary }),
      }),
    [summary],
  );
  const { messages, sendMessage, status, error } = useChat({
    id: "dataset-chat",
    transport,
  });
  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, status]);

  useEffect(() => {
    inputRef.current?.focus();
  }, [status]);

  const isLoading = status === "submitted" || status === "streaming";

  const submit = (text: string) => {
    const t = text.trim();
    if (!t || isLoading) return;
    sendMessage({ text: t });
    setInput("");
  };

  return (
    <div className="glass rounded-2xl shadow-card flex flex-col h-[600px]">
      <div className="flex items-center gap-2 px-5 py-4 border-b border-border/50">
        <div className="h-8 w-8 rounded-lg bg-gradient-primary grid place-items-center">
          <Bot className="h-4 w-4 text-primary-foreground" />
        </div>
        <div>
          <p className="font-display text-base">AI Data Analyst</p>
          <p className="text-xs text-muted-foreground">
            Grounded in {dataset.fileName}
          </p>
        </div>
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto px-5 py-4 space-y-5">
        {messages.length === 0 && (
          <div>
            <div className="flex items-start gap-3">
              <Sparkles className="h-4 w-4 text-primary-glow mt-1" />
              <p className="text-sm text-muted-foreground">
                Ask anything about your dataset, or try a suggestion:
              </p>
            </div>
            <div className="mt-4 grid sm:grid-cols-2 gap-2">
              {SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  onClick={() => submit(s)}
                  className="text-left text-sm rounded-lg border border-border/60 px-3 py-2 hover:bg-primary/10 hover:border-primary/40 transition-colors"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((m) => (
          <Message key={m.id} role={m.role} text={messageText(m)} />
        ))}

        {isLoading && messages[messages.length - 1]?.role === "user" && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Bot className="h-4 w-4 text-primary-glow" />
            <span className="animate-pulse">Thinking…</span>
          </div>
        )}

        {error && (
          <p className="text-sm text-destructive">
            {error.message?.includes("429")
              ? "Rate limited — try again in a moment."
              : error.message?.includes("402")
                ? "AI credits exhausted — please add more credits."
                : `Error: ${error.message}`}
          </p>
        )}
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          submit(input);
        }}
        className="border-t border-border/50 p-3 flex gap-2"
      >
        <textarea
          ref={inputRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              submit(input);
            }
          }}
          rows={1}
          placeholder="Ask about your data…"
          className="flex-1 resize-none bg-input/60 border border-border/60 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
        />
        <Button type="submit" variant="hero" size="icon" disabled={isLoading || !input.trim()}>
          <Send className="h-4 w-4" />
        </Button>
      </form>
    </div>
  );
}

function Message({ role, text }: { role: string; text: string }) {
  if (role === "user") {
    return (
      <div className="flex items-start gap-3 justify-end">
        <div className="bg-primary text-primary-foreground rounded-2xl rounded-tr-sm px-4 py-2 max-w-[80%] text-sm">
          {text}
        </div>
        <div className="h-7 w-7 rounded-full bg-secondary grid place-items-center">
          <User className="h-3.5 w-3.5" />
        </div>
      </div>
    );
  }
  return (
    <div className="flex items-start gap-3">
      <div className="h-7 w-7 rounded-full bg-gradient-primary grid place-items-center flex-shrink-0">
        <Bot className="h-3.5 w-3.5 text-primary-foreground" />
      </div>
      <div className="prose prose-invert prose-sm max-w-none text-foreground prose-p:my-2 prose-ul:my-2 prose-headings:font-display prose-headings:mt-3">
        <ReactMarkdown>{text}</ReactMarkdown>
      </div>
    </div>
  );
}

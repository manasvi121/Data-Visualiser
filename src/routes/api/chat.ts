import "@tanstack/react-start";
import { createFileRoute } from "@tanstack/react-router";
import { convertToModelMessages, streamText, type UIMessage } from "ai";
import { createLovableAiGatewayProvider } from "@/lib/ai-gateway";

type ChatRequestBody = { messages?: unknown; datasetSummary?: string };

export const Route = createFileRoute("/api/chat")({
  server: {
    handlers: {
      POST: async ({ request }: { request: Request }) => {
        const { messages, datasetSummary } = (await request.json()) as ChatRequestBody;
        if (!Array.isArray(messages))
          return new Response("Messages required", { status: 400 });

        const key = process.env.LOVABLE_API_KEY;
        if (!key) return new Response("Missing LOVABLE_API_KEY", { status: 500 });

        const gateway = createLovableAiGatewayProvider(key);
        const model = gateway("google/gemini-3-flash-preview");

        const system = `You are an expert data analyst assistant. The user has uploaded a dataset and you must give precise, correct, evidence-grounded insights and answer questions strictly based on the data summary below. If a question cannot be answered from the data, say so. Use markdown, short sections, and bullet points. Reference specific column names and numbers.

DATASET CONTEXT:
${datasetSummary ?? "No dataset uploaded yet."}`;

        try {
          const result = streamText({
            model,
            system,
            messages: await convertToModelMessages(messages as UIMessage[]),
          });
          return result.toUIMessageStreamResponse({
            originalMessages: messages as UIMessage[],
          });
        } catch (e) {
          const msg = e instanceof Error ? e.message : "AI error";
          return new Response(msg, { status: 500 });
        }
      },
    },
  },
});

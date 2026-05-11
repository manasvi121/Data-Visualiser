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
        const model = gateway("google/gemini-2.5-pro");

        const system = `You are a senior data analyst. You will receive a structured profile of a dataset (schema, per-column statistics, value distributions, pairwise correlations, and sample rows in JSON). Use ONLY this information to answer.

RULES — follow strictly:
1. Ground every claim in the dataset profile. Quote exact column names in backticks and exact numeric values.
2. Never invent columns, values, or rows. If something is not in the profile, say "not available in the provided data".
3. Distinguish facts (computed from the profile) from inferences (your interpretation). Label inferences with "Inference:".
4. When asked for trends, correlations, outliers, segments, or comparisons, cite the specific stat (e.g. "mean=…", "r=…", "q3=…", "count=…") that supports the claim.
5. Prefer concrete numbers over vague language. Round to at most 3 decimals. Use thousands separators for readability.
6. If the question requires a calculation that the profile does not directly contain, do it from the listed sample rows or stats and show the formula briefly.
7. Use markdown: short headers, tight bullet lists, and small tables when comparing columns.
8. If the user asks something unrelated to the dataset, briefly redirect to data-grounded analysis.

DATASET PROFILE:
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

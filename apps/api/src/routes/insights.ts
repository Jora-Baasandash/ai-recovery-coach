import type { FastifyInstance } from "fastify";
import { formatOccurredOn } from "../lib/dates.js";
import { parseStoredInsightOutput } from "../lib/insight-output.js";
import {
  CRISIS_RESOURCE_OUTPUT,
  looksLikeCrisis,
  SAFETY_PROMPT_VERSION,
} from "../lib/safety.js";
import { INSIGHT_CONTEXT_LIMIT, type InsightCheckIn } from "../llm/types.js";

const VISIBLE_INSIGHT_STATUSES = ["success", "skipped_safety"];

export async function insightRoutes(app: FastifyInstance): Promise<void> {
  app.post(
    "/check-ins/:id/insight",
    { onRequest: [app.authenticate] },
    async (request, reply) => {
      const { id } = request.params as { id: string };
      const userId = request.user.sub;

      const source = await app.prisma.checkIn.findFirst({
        where: { id, userId },
      });

      if (!source) {
        return reply.code(404).send({ error: "Check-in not found" });
      }

      const existing = await app.prisma.insight.findFirst({
        where: {
          sourceCheckInId: id,
          userId,
          status: { in: VISIBLE_INSIGHT_STATUSES },
        },
        orderBy: { createdAt: "desc" },
      });

      if (existing) {
        return serializeInsight(existing);
      }

      if (looksLikeCrisis(source.trigger, source.note)) {
        const created = await app.prisma.insight.create({
          data: {
            userId,
            sourceCheckInId: id,
            promptVersion: SAFETY_PROMPT_VERSION,
            model: "none",
            inputCheckInIds: [id],
            output: CRISIS_RESOURCE_OUTPUT,
            latencyMs: 0,
            status: "skipped_safety",
          },
        });

        return reply.code(201).send(serializeInsight(created));
      }

      const history = await app.prisma.checkIn.findMany({
        where: {
          userId,
          occurredOn: { lte: source.occurredOn },
        },
        orderBy: { occurredOn: "desc" },
        take: INSIGHT_CONTEXT_LIMIT,
      });

      const checkIns: InsightCheckIn[] = history
        .slice()
        .reverse()
        .map((row) => ({
          id: row.id,
          occurredOn: formatOccurredOn(row.occurredOn),
          urgeIntensity: row.urgeIntensity,
          actedOnUrge: row.actedOnUrge,
          trigger: row.trigger,
        }));

      try {
        const generated = await app.insights.generate(checkIns);
        const created = await app.prisma.insight.create({
          data: {
            userId,
            sourceCheckInId: id,
            promptVersion: generated.promptVersion,
            model: generated.model,
            inputCheckInIds: checkIns.map((row) => row.id),
            output: generated.output,
            inputTokens: generated.inputTokens,
            outputTokens: generated.outputTokens,
            latencyMs: generated.latencyMs,
            status: "success",
          },
        });

        return reply.code(201).send(serializeInsight(created));
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "Insight generation failed";

        await app.prisma.insight.create({
          data: {
            userId,
            sourceCheckInId: id,
            promptVersion: "insight-v1",
            model: process.env.LLM_MODEL ?? "unknown",
            inputCheckInIds: checkIns.map((row) => row.id),
            output: {},
            latencyMs: 0,
            status: "failed",
            error: message,
          },
        });

        return reply.code(503).send({ error: message });
      }
    },
  );

  app.get(
    "/insights/latest",
    { onRequest: [app.authenticate] },
    async (request, reply) => {
      const insight = await app.prisma.insight.findFirst({
        where: {
          userId: request.user.sub,
          status: { in: VISIBLE_INSIGHT_STATUSES },
        },
        orderBy: { createdAt: "desc" },
      });

      if (!insight) {
        return reply.code(404).send({ error: "No insight yet" });
      }

      return serializeInsight(insight);
    },
  );
}

function serializeInsight(insight: {
  id: string;
  sourceCheckInId: string;
  promptVersion: string;
  model: string;
  status: string;
  output: unknown;
  createdAt: Date;
}) {
  return {
    id: insight.id,
    sourceCheckInId: insight.sourceCheckInId,
    promptVersion: insight.promptVersion,
    model: insight.model,
    status: insight.status,
    output: parseStoredInsightOutput(insight.output),
    disclaimer:
      "This is a support tool, not medical or therapeutic advice.",
    createdAt: insight.createdAt.toISOString(),
  };
}

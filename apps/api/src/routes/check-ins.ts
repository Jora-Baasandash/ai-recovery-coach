import { Prisma } from "@prisma/client";
import type { FastifyInstance } from "fastify";
import { formatOccurredOn, parseOccurredOn } from "../lib/dates.js";

const createCheckInSchema = {
  type: "object",
  required: ["urgeIntensity", "actedOnUrge"],
  additionalProperties: false,
  properties: {
    occurredOn: { type: "string", pattern: "^\\d{4}-\\d{2}-\\d{2}$" },
    urgeIntensity: { type: "integer", minimum: 0, maximum: 10 },
    actedOnUrge: { type: "boolean" },
    trigger: { type: "string", maxLength: 200 },
    note: { type: "string", maxLength: 1000 },
  },
} as const;

export async function checkInRoutes(app: FastifyInstance): Promise<void> {
  app.post(
    "/check-ins",
    {
      onRequest: [app.authenticate],
      schema: { body: createCheckInSchema },
    },
    async (request, reply) => {
      const body = request.body as {
        occurredOn?: string;
        urgeIntensity: number;
        actedOnUrge: boolean;
        trigger?: string;
        note?: string;
      };

      let occurredOn: Date;
      try {
        occurredOn = parseOccurredOn(body.occurredOn);
      } catch {
        return reply.code(400).send({ error: "occurredOn must be YYYY-MM-DD" });
      }

      try {
        const checkIn = await app.prisma.checkIn.create({
          data: {
            userId: request.user.sub,
            occurredOn,
            urgeIntensity: body.urgeIntensity,
            actedOnUrge: body.actedOnUrge,
            trigger: body.trigger?.trim() || null,
            note: body.note?.trim() || null,
          },
        });

        return reply.code(201).send(serializeCheckIn(checkIn));
      } catch (error) {
        if (
          error instanceof Prisma.PrismaClientKnownRequestError &&
          error.code === "P2002"
        ) {
          return reply
            .code(409)
            .send({ error: "A check-in already exists for that day" });
        }

        throw error;
      }
    },
  );

  app.get(
    "/check-ins",
    { onRequest: [app.authenticate] },
    async (request) => {
      const checkIns = await app.prisma.checkIn.findMany({
        where: { userId: request.user.sub },
        orderBy: { occurredOn: "desc" },
        take: 30,
      });

      return { checkIns: checkIns.map(serializeCheckIn) };
    },
  );
}

function serializeCheckIn(checkIn: {
  id: string;
  occurredOn: Date;
  urgeIntensity: number;
  actedOnUrge: boolean;
  trigger: string | null;
  note: string | null;
  createdAt: Date;
}) {
  return {
    id: checkIn.id,
    occurredOn: formatOccurredOn(checkIn.occurredOn),
    urgeIntensity: checkIn.urgeIntensity,
    actedOnUrge: checkIn.actedOnUrge,
    trigger: checkIn.trigger,
    note: checkIn.note,
    createdAt: checkIn.createdAt.toISOString(),
  };
}

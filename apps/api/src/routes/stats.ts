import type { FastifyInstance } from "fastify";
import {
  formatOccurredOn,
  parseOccurredOn,
  shiftUtcDate,
  utcToday,
} from "../lib/dates.js";
import { computeCheckInStreak } from "../lib/streak.js";

export async function statsRoutes(app: FastifyInstance): Promise<void> {
  app.get(
    "/check-ins/stats",
    { onRequest: [app.authenticate] },
    async (request) => {
      const userId = request.user.sub;
      const today = utcToday();
      const windowStart = shiftUtcDate(today, -6);
      const window = {
        gte: parseOccurredOn(windowStart),
        lte: parseOccurredOn(today),
      };

      const [totalCheckIns, last7, last7ActedOnUrge, dates] = await Promise.all([
        app.prisma.checkIn.count({ where: { userId } }),
        app.prisma.checkIn.aggregate({
          where: { userId, occurredOn: window },
          _avg: { urgeIntensity: true },
          _count: true,
        }),
        app.prisma.checkIn.count({
          where: { userId, occurredOn: window, actedOnUrge: true },
        }),
        app.prisma.checkIn.findMany({
          where: { userId },
          select: { occurredOn: true },
          orderBy: { occurredOn: "desc" },
        }),
      ]);

      const average = last7._avg.urgeIntensity;

      return {
        totalCheckIns,
        checkInStreak: computeCheckInStreak(
          dates.map((row) => formatOccurredOn(row.occurredOn)),
          today,
        ),
        last7AverageUrge:
          average === null ? null : Math.round(average * 10) / 10,
        last7ActedOnUrge,
        last7DidNotAct: last7._count - last7ActedOnUrge,
      };
    },
  );
}

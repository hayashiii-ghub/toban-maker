import { z } from "zod";

/** POST /api/schedules response */
export const createScheduleResponseSchema = z.object({
  slug: z.string(),
  editToken: z.string(),
});

/** GET /api/schedules/:slug and GET /api/schedules/:slug/edit response */
export const scheduleResponseSchema = z.object({
  slug: z.string(),
  name: z.string(),
  rotation: z.number(),
  groups: z.array(
    z.object({
      id: z.string(),
      tasks: z.array(z.string()),
      emoji: z.string(),
      memberIds: z.array(z.string()).optional(),
    }),
  ),
  members: z.array(
    z.object({
      id: z.string(),
      name: z.string(),
      color: z.string(),
      bgColor: z.string(),
      textColor: z.string(),
      skipped: z.boolean().optional(),
    }),
  ),
  rotationConfig: z
    .object({
      mode: z.enum(["manual", "date"]),
      startDate: z.string().optional(),
      cycleDays: z.number().optional(),
      skipSaturday: z.boolean().optional(),
      skipSunday: z.boolean().optional(),
      skipHolidays: z.boolean().optional(),
    })
    .optional(),
  assignmentMode: z.enum(["member", "task"]).optional(),
  designThemeId: z.string().optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export type CreateScheduleResponseData = z.infer<typeof createScheduleResponseSchema>;
export type ScheduleResponseData = z.infer<typeof scheduleResponseSchema>;

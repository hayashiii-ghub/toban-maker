import type { AssignmentMode, RotationConfig } from "@/rotation/types";
import {
  createScheduleResponseSchema,
  scheduleResponseSchema,
  type CreateScheduleResponseData,
  type ScheduleResponseData,
} from "./apiSchemas";

interface ScheduleWriteMember {
  id: string;
  name: string;
  color: string;
  bgColor: string;
  textColor: string;
  skipped?: boolean;
}

interface ScheduleWriteData {
  name: string;
  rotation: number;
  groups: { id: string; tasks: string[]; emoji: string; memberIds?: string[] }[];
  members: ScheduleWriteMember[];
  rotationConfig?: RotationConfig;
  assignmentMode?: AssignmentMode;
  designThemeId?: string;
}

export class ApiError extends Error {
  constructor(message: string, public status: number) {
    super(message);
    this.name = "ApiError";
  }
}

function parseResponse<T>(schema: { parse(data: unknown): T }, data: unknown, endpoint: string): T {
  try {
    return schema.parse(data);
  } catch (error) {
    throw new Error(
      `Invalid API response from ${endpoint}: ${error instanceof Error ? error.message : String(error)}`,
      { cause: error },
    );
  }
}

const BASE = "/api/schedules";

export async function createSchedule(
  data: ScheduleWriteData,
  options?: { keepalive?: boolean },
): Promise<CreateScheduleResponseData> {
  const res = await fetch(BASE, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    keepalive: options?.keepalive,
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new ApiError(`Failed to create schedule: ${res.status}`, res.status);
  const json = await res.json();
  return parseResponse(createScheduleResponseSchema, json, "POST /api/schedules");
}

export async function getSchedule(slug: string): Promise<ScheduleResponseData> {
  const res = await fetch(`${BASE}/${slug}`);
  if (!res.ok) throw new ApiError(`Failed to fetch schedule: ${res.status}`, res.status);
  const json = await res.json();
  return parseResponse(scheduleResponseSchema, json, `GET /api/schedules/${slug}`);
}

export async function getScheduleForEdit(
  slug: string,
  editToken: string,
): Promise<ScheduleResponseData> {
  const res = await fetch(`${BASE}/${slug}/edit`, {
    headers: { "x-edit-token": editToken },
  });
  if (!res.ok) throw new ApiError(`Failed to fetch editable schedule: ${res.status}`, res.status);
  const json = await res.json();
  return parseResponse(scheduleResponseSchema, json, `GET /api/schedules/${slug}/edit`);
}

export async function updateSchedule(
  slug: string,
  editToken: string,
  data: ScheduleWriteData,
  options?: { keepalive?: boolean },
): Promise<void> {
  const res = await fetch(`${BASE}/${slug}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      "x-edit-token": editToken,
    },
    keepalive: options?.keepalive,
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new ApiError(`Failed to update schedule: ${res.status}`, res.status);
}

export async function publishSchedule(slug: string, editToken: string): Promise<void> {
  const res = await fetch(`${BASE}/${slug}/publish`, {
    method: "POST",
    headers: { "x-edit-token": editToken },
  });
  if (!res.ok) throw new ApiError(`Failed to publish schedule: ${res.status}`, res.status);
}

export async function deleteSchedule(slug: string, editToken: string): Promise<void> {
  const res = await fetch(`${BASE}/${slug}`, {
    method: "DELETE",
    headers: { "x-edit-token": editToken },
  });
  if (!res.ok) throw new ApiError(`Failed to delete schedule: ${res.status}`, res.status);
}

import type { AssignmentMode, RotationConfig, ScheduleDTO, CreateScheduleResponse } from "@/rotation/types";

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

const BASE = "/api/schedules";

export async function createSchedule(
  data: ScheduleWriteData,
  options?: { keepalive?: boolean },
): Promise<CreateScheduleResponse> {
  const res = await fetch(BASE, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    keepalive: options?.keepalive,
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new ApiError(`Failed to create schedule: ${res.status}`, res.status);
  return res.json();
}

export async function getSchedule(slug: string): Promise<ScheduleDTO> {
  const res = await fetch(`${BASE}/${slug}`);
  if (!res.ok) throw new ApiError(`Failed to fetch schedule: ${res.status}`, res.status);
  return res.json();
}

export async function getScheduleForEdit(
  slug: string,
  editToken: string,
): Promise<ScheduleDTO> {
  const res = await fetch(`${BASE}/${slug}/edit`, {
    headers: { "x-edit-token": editToken },
  });
  if (!res.ok) throw new ApiError(`Failed to fetch editable schedule: ${res.status}`, res.status);
  return res.json();
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

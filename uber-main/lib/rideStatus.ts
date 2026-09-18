/** Maps between app-level status strings and live DB ride_status enum. */
export type DbRideStatus =
  "requested" | "accepted" | "started" | "completed" | "cancelled";

const TO_DB: Record<string, DbRideStatus> = {
  REQUESTED: "requested",
  requested: "requested",
  searching: "requested",
  SEARCHING: "requested",
  ACCEPTED: "accepted",
  ARRIVING: "accepted",
  accepted: "accepted",
  IN_PROGRESS: "started",
  STARTED: "started",
  started: "started",
  COMPLETED: "completed",
  completed: "completed",
  CANCELLED: "cancelled",
  cancelled: "cancelled",
};

export function toDbStatus(status: string): DbRideStatus {
  return TO_DB[status] ?? "requested";
}

export function isActiveRideStatus(status: string): boolean {
  const s = toDbStatus(status);
  return s === "accepted" || s === "started";
}

export function isTerminalStatus(status: string): boolean {
  const s = toDbStatus(status);
  return s === "completed" || s === "cancelled";
}

export const ACTIVE_RIDE_STATUSES: DbRideStatus[] = [
  "accepted",
  "started",
  "completed",
];

export const OPEN_REQUEST_STATUS: DbRideStatus = "requested";

import { getPlanningDayKey, isPlannedToday } from "../today-plan";

describe("Today plan reset", () => {
  it("keeps a late-night selection until the configured local hour", () => {
    const plannedAt = new Date("2026-10-10T22:00:00Z");
    expect(isPlannedToday(plannedAt, new Date("2026-10-11T02:59:00Z"), "Europe/London", 4)).toBe(true);
    expect(isPlannedToday(plannedAt, new Date("2026-10-11T03:00:00Z"), "Europe/London", 4)).toBe(false);
  });

  it("uses the chosen timezone across a daylight saving change", () => {
    const plannedAt = new Date("2026-10-24T22:00:00Z");
    expect(isPlannedToday(plannedAt, new Date("2026-10-25T03:59:00Z"), "Europe/London", 4)).toBe(true);
    expect(isPlannedToday(plannedAt, new Date("2026-10-25T04:00:00Z"), "Europe/London", 4)).toBe(false);
  });

  it("handles a reset shortly after midnight", () => {
    expect(getPlanningDayKey(new Date("2026-10-11T00:30:00Z"), "Europe/London", 4)).toBe("2026-10-10");
    expect(getPlanningDayKey(new Date("2026-10-11T03:00:00Z"), "Europe/London", 4)).toBe("2026-10-11");
  });
});

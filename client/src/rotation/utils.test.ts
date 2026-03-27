import { afterEach, describe, expect, it, vi } from "vitest";
import { DEFAULT_APP_STATE } from "./defaultState";
import { STORAGE_KEY } from "./constants";
import { getHolidaysForYear } from "./holidays";
import {
  computeAssignments,
  computeDateRotationForDate,
  loadState,
  normalizeRotation,
} from "./utils";

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("normalizeRotation", () => {
  it("wraps positive and negative values into member bounds", () => {
    expect(normalizeRotation(4, 3)).toBe(1);
    expect(normalizeRotation(-1, 3)).toBe(2);
    expect(normalizeRotation(2.9, 3)).toBe(2);
  });

  it("falls back to zero for invalid input", () => {
    expect(normalizeRotation(Number.NaN, 3)).toBe(0);
    expect(normalizeRotation(1, 0)).toBe(0);
  });
});

describe("computeAssignments", () => {
  it("rotates members across groups", () => {
    const groups = [
      { id: "g1", tasks: ["掃除"], emoji: "🧹" },
      { id: "g2", tasks: ["給食"], emoji: "🍽" },
      { id: "g3", tasks: ["日直"], emoji: "📋" },
    ];
    const members = [
      { id: "m1", name: "松丸", color: "#3B82F6", bgColor: "#DBEAFE", textColor: "#1E3A5F" },
      { id: "m2", name: "山下", color: "#EF4444", bgColor: "#FEE2E2", textColor: "#7F1D1D" },
      { id: "m3", name: "田中", color: "#10B981", bgColor: "#D1FAE5", textColor: "#064E3B" },
    ];
    const assignments = computeAssignments(groups, members, 1);

    expect(assignments.map(({ member }) => member.name)).toEqual(["山下", "田中", "松丸"]);
  });
});

describe("loadState", () => {
  it("drops malformed schedules from localStorage", () => {
    const getItem = vi.fn(() => JSON.stringify({
      schedules: [
        {
          id: "broken",
          name: "壊れたデータ",
          rotation: 999,
          groups: [{ id: "g1", emoji: "🧹", tasks: [123, ""] }],
          members: [{ id: "m1", name: "A", color: "#000" }],
        },
      ],
      activeScheduleId: "broken",
    }));

    vi.stubGlobal("localStorage", {
      getItem,
      setItem: vi.fn(),
    });

    const state = loadState();

    expect(getItem).toHaveBeenCalledWith(STORAGE_KEY);
    expect(state).toEqual(DEFAULT_APP_STATE);
  });

  it("normalizes valid stored rotation and active schedule", () => {
    const memberCount = DEFAULT_APP_STATE.schedules[0].members.length;
    vi.stubGlobal("localStorage", {
      getItem: vi.fn(() => JSON.stringify({
        schedules: [
          {
            ...DEFAULT_APP_STATE.schedules[0],
            rotation: 7,
          },
        ],
        activeScheduleId: "missing",
      })),
      setItem: vi.fn(),
    });

    const state = loadState();

    expect(state.activeScheduleId).toBe(DEFAULT_APP_STATE.schedules[0].id);
    expect(state.schedules[0].rotation).toBe(7 % memberCount);
  });

  it("preserves pinned schedules from localStorage", () => {
    vi.stubGlobal("localStorage", {
      getItem: vi.fn(() => JSON.stringify({
        schedules: [
          {
            ...DEFAULT_APP_STATE.schedules[0],
            pinned: true,
          },
        ],
        activeScheduleId: DEFAULT_APP_STATE.schedules[0].id,
      })),
      setItem: vi.fn(),
    });

    const state = loadState();

    expect(state.schedules[0].pinned).toBe(true);
  });
});

describe("computeDateRotationForDate", () => {
  it("keeps the previous assignment on skipped days", () => {
    expect(
      computeDateRotationForDate(
        {
          mode: "date",
          startDate: "2026-03-02",
          cycleDays: 1,
          skipSaturday: true,
          skipSunday: true,
        },
        3,
        new Date(2026, 2, 7),
      ),
    ).toBe(1);
  });

  it("cycleDays > 1 の場合、サイクル単位でローテーションが進む", () => {
    // 開始3/2(月), cycleDays=3, 対象3/5(木) → 有効日数3 / cycleDays3 = 1サイクル
    expect(
      computeDateRotationForDate(
        { mode: "date", startDate: "2026-03-02", cycleDays: 3 },
        4,
        new Date(2026, 2, 5),
      ),
    ).toBe(1);
  });

  it("開始日が未来の場合は0を返す", () => {
    expect(
      computeDateRotationForDate(
        { mode: "date", startDate: "2026-12-01", cycleDays: 1 },
        3,
        new Date(2026, 2, 27),
      ),
    ).toBe(0);
  });

  it("祝日スキップが有効な場合、祝日をカウントしない", () => {
    // 2026-01-01(木・元日) → 2026-01-02(金): 有効日数0（元日スキップ）
    expect(
      computeDateRotationForDate(
        { mode: "date", startDate: "2026-01-01", cycleDays: 1, skipHolidays: true },
        3,
        new Date(2026, 0, 2),
      ),
    ).toBe(0);
  });

  it("startDate や cycleDays が未設定なら0を返す", () => {
    expect(
      computeDateRotationForDate({ mode: "date" }, 3, new Date(2026, 2, 27)),
    ).toBe(0);
    expect(
      computeDateRotationForDate({ mode: "date", startDate: "2026-03-01" }, 3, new Date(2026, 2, 27)),
    ).toBe(0);
  });

  it("memberCount が0なら0を返す", () => {
    expect(
      computeDateRotationForDate(
        { mode: "date", startDate: "2026-03-01", cycleDays: 1 },
        0,
        new Date(2026, 2, 27),
      ),
    ).toBe(0);
  });
});

describe("computeAssignments - 専用メンバー", () => {
  const members = [
    { id: "m1", name: "Aさん", color: "#3B82F6", bgColor: "#DBEAFE", textColor: "#1E3A5F" },
    { id: "m2", name: "Bさん", color: "#EF4444", bgColor: "#FEE2E2", textColor: "#7F1D1D" },
    { id: "m3", name: "Cさん", color: "#10B981", bgColor: "#D1FAE5", textColor: "#064E3B" },
  ];

  it("memberIds 指定のグループは専用プールからメンバーを割り当てる", () => {
    const groups = [
      { id: "g1", tasks: ["掃除"], emoji: "🧹", memberIds: ["m1", "m2"] },
      { id: "g2", tasks: ["給食"], emoji: "🍽" },
    ];
    const assignments = computeAssignments(groups, members, 0);

    // g1 は m1, m2 のプール → rotation=0 → m1
    expect(assignments[0].member.name).toBe("Aさん");
    // g2 は全メンバー → rotation=0 + groupIndex=1 → m2
    expect(assignments[1].member.name).toBe("Bさん");
  });

  it("skipped メンバーは割り当てから除外される", () => {
    const membersWithSkip = [
      ...members,
      { id: "m4", name: "Dさん", color: "#000", bgColor: "#fff", textColor: "#000", skipped: true },
    ];
    const groups = [{ id: "g1", tasks: ["掃除"], emoji: "🧹" }];
    const assignments = computeAssignments(groups, membersWithSkip, 0);

    expect(assignments[0].member.name).toBe("Aさん");
    expect(assignments.every(a => a.member.name !== "Dさん")).toBe(true);
  });
});

describe("getHolidaysForYear", () => {
  it("includes the 2020 olympic holiday overrides", () => {
    const holidays2020 = getHolidaysForYear(2020);
    const holidayMap2020 = new Map(holidays2020.map((holiday) => [holiday.date, holiday.name]));

    expect(holidayMap2020.get("2020-07-23")).toBe("海の日");
    expect(holidayMap2020.get("2020-07-24")).toBe("スポーツの日");
    expect(holidayMap2020.get("2020-08-10")).toBe("山の日");
    expect(holidayMap2020.has("2020-10-12")).toBe(false);
  });

  it("includes the 2021 olympic holiday overrides", () => {
    const holidays2021 = getHolidaysForYear(2021);
    const holidayMap2021 = new Map(holidays2021.map((holiday) => [holiday.date, holiday.name]));

    expect(holidayMap2021.get("2021-07-22")).toBe("海の日");
    expect(holidayMap2021.get("2021-07-23")).toBe("スポーツの日");
    expect(holidayMap2021.get("2021-08-08")).toBe("山の日");
    expect(holidayMap2021.get("2021-08-09")).toBe("振替休日");
    expect(holidayMap2021.has("2021-10-11")).toBe(false);
  });
});

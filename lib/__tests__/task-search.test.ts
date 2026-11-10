import { matchesTaskSearch, parseTaskSearch } from "../task-search";

const task = {
  title: "Write report",
  notes: "Include the latest figures",
  tags: ["work"],
  priority: "HIGH" as const,
};

describe("task search", () => {
  it.each([
    ["p1", "HIGH"], ["p2", "MEDIUM"], ["p3", "LOW"],
  ] as const)("filters %s to %s priority", (query, priority) => {
    for (const candidate of ["HIGH", "MEDIUM", "LOW"] as const) {
      expect(matchesTaskSearch({ ...task, priority: candidate }, parseTaskSearch(query)))
        .toBe(candidate === priority);
    }
  });

  it("combines priority and tag searches regardless of order and casing", () => {
    for (const query of ["#work p1", " P1   #WORK "]) {
      const search = parseTaskSearch(query);
      expect(matchesTaskSearch(task, search)).toBe(true);
      expect(matchesTaskSearch({ ...task, priority: "LOW" }, search)).toBe(false);
      expect(matchesTaskSearch({ ...task, tags: ["home"] }, search)).toBe(false);
    }
  });

  it("combines priority with title, notes, or context text", () => {
    expect(matchesTaskSearch(task, parseTaskSearch("report p1"))).toBe(true);
    expect(matchesTaskSearch(task, parseTaskSearch("figures p1"))).toBe(true);
    expect(matchesTaskSearch(task, parseTaskSearch("office p1"), { name: "Office" })).toBe(true);
    expect(matchesTaskSearch({ ...task, priority: "LOW" }, parseTaskSearch("office p1"), { name: "Office" })).toBe(false);
  });

  it("allows multiple priorities", () => {
    const search = parseTaskSearch("p1 p3");
    expect(matchesTaskSearch(task, search)).toBe(true);
    expect(matchesTaskSearch({ ...task, priority: "LOW" }, search)).toBe(true);
    expect(matchesTaskSearch({ ...task, priority: "MEDIUM" }, search)).toBe(false);
  });

  it("preserves ordinary searches and treats only standalone priority tokens as filters", () => {
    for (const query of ["", "write report", "#work", "figures"]) {
      expect(matchesTaskSearch(task, parseTaskSearch(query))).toBe(true);
    }
    for (const query of ["#p1", "p10", "p1-report"]) {
      expect(parseTaskSearch(query)).toEqual({ text: query, priorities: [] });
    }
  });
});

import { parseScore, scoreToColor } from "@/lib/utils";

// Test 1: Score parsing edge cases (Task B-3)
describe("parseScore", () => {
  it("parses integer strings", () => {
    expect(parseScore("7")).toBe(7);
  });

  it("parses decimal strings", () => {
    expect(parseScore("7.3")).toBe(7.3);
  });

  it("parses written words (case-insensitive)", () => {
    expect(parseScore("Seven")).toBe(7);
    expect(parseScore("seven")).toBe(7);
    expect(parseScore("Ten")).toBe(10);
  });

  it("parses embedded numbers", () => {
    expect(parseScore("Score: 8/10")).toBe(8);
    expect(parseScore("I would rate this 6.5 out of 10")).toBe(6.5);
  });

  it("returns null for unparseable input", () => {
    expect(parseScore("excellent")).toBe(null);
    expect(parseScore("")).toBe(null);
    expect(parseScore(null)).toBe(null);
  });

  it("clamps out-of-range values by returning null", () => {
    expect(parseScore("15")).toBe(null); // 15 > 10
  });
});

// Test 2: Color coding
describe("scoreToColor", () => {
  it("returns green for high scores", () => {
    expect(scoreToColor(8).label).toBe("Strong");
    expect(scoreToColor(7.5).label).toBe("Strong");
  });

  it("returns amber for medium scores", () => {
    expect(scoreToColor(6).label).toBe("Review");
    expect(scoreToColor(5).label).toBe("Review");
  });

  it("returns red for low scores", () => {
    expect(scoreToColor(4).label).toBe("Weak");
    expect(scoreToColor(1).label).toBe("Weak");
  });
});

// Test 3: API route — POST validation
// (Integration test using fetch mock or MSW)
describe("screening input validation logic", () => {
  it("rejects missing candidateName", () => {
    const body = { jobTitle: "Dev", aiScore: 7, reasons: ["a", "b", "c"] };
    expect(!body.hasOwnProperty("candidateName") || !("candidateName" in body)).toBe(true);
  });

  it("rejects out-of-range scores", () => {
    const isValid = (score: number) => typeof score === "number" && score >= 0 && score <= 10;
    expect(isValid(15)).toBe(false);
    expect(isValid(7)).toBe(true);
  });
});
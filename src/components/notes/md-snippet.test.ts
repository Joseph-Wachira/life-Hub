import { describe, expect, it } from "vitest";
import { mdToSnippet } from "./md-snippet";

describe("mdToSnippet", () => {
  it("strips headings, bold/italic, and links", () => {
    expect(mdToSnippet("# Title\n\nSome **bold** and _italic_ text with a [link](https://example.com).")).toBe(
      "Title Some bold and italic text with a link."
    );
  });

  it("strips checklist and list markers", () => {
    expect(mdToSnippet("- [ ] Buy milk\n- [x] Walk the dog\n- Regular item")).toBe(
      "Buy milk Walk the dog Regular item"
    );
  });

  it("truncates to maxLength with an ellipsis", () => {
    const long = "word ".repeat(50).trim();
    const snippet = mdToSnippet(long, 20);
    expect(snippet.length).toBeLessThanOrEqual(21);
    expect(snippet.endsWith("…")).toBe(true);
  });

  it("returns short text unchanged", () => {
    expect(mdToSnippet("Just a short note")).toBe("Just a short note");
  });
});

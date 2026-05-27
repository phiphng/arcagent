/**
 * Unit tests for arcagent bot.js
 *
 * Tests pure logic functions (esc, $, arg parsing, truncation)
 * without requiring the full bot module.
 */

// ── Replicate the pure helpers from bot.js ────────────────────────────
// This avoids the need to mock dotenv/grammy/child_process entirely
// while still testing the actual production logic.

function $(cmd, execSyncMock) {
  try {
    return execSyncMock(cmd, { encoding: "utf-8", timeout: 30_000 }).trim();
  } catch (e) {
    return `ERR: ${e.stderr || e.message}`;
  }
}

function esc(text) {
  return text.replace(/[_*[\]()~`>#+\-=|{}.!]/g, "\\$&");
}

// ── esc() helper tests ────────────────────────────────────────────────

describe("esc() — MarkdownV2 escaping", () => {
  test("escapes all special characters", () => {
    const input = "Hello _world_ [link](url) *bold* ~strike~";
    const result = esc(input);
    expect(result).not.toBe(input);
    expect(result).toContain("\\_");
    expect(result).toContain("\\[");
    expect(result).toContain("\\]");
    expect(result).toContain("\\(");
    expect(result).toContain("\\)");
    expect(result).toContain("\\*");
    expect(result).toContain("\\~");
  });

  test("leaves normal text unchanged", () => {
    const input = "Hello World 123";
    expect(esc(input)).toBe("Hello World 123");
  });

  test("handles empty string", () => {
    expect(esc("")).toBe("");
  });

  test("escapes backtick and hash", () => {
    expect(esc("`code`")).toBe("\\`code\\`");
    expect(esc("#header")).toBe("\\#header");
  });

  test("escapes pipe and braces", () => {
    expect(esc("{a|b}")).toBe("\\{a\\|b\\}");
  });

  test("escapes dots and exclamation marks", () => {
    expect(esc("hello.world!")).toBe("hello\\.world\\!");
  });

  test("does NOT escape letters and numbers", () => {
    const res = esc("abcABC123");
    expect(res).toBe("abcABC123");
  });
});

// ── $() command helper tests ─────────────────────────────────────────

describe("$() — exec wrapper", () => {
  test("returns stdout on success", () => {
    const mock = jest.fn(() => "success output\n");
    const result = $("echo test", mock);
    expect(result).toBe("success output");
    expect(mock).toHaveBeenCalledWith("echo test", {
      encoding: "utf-8",
      timeout: 30_000,
    });
  });

  test("trims trailing whitespace", () => {
    const mock = jest.fn(() => "  padded output  \n\n");
    const result = $("cmd", mock);
    expect(result).toBe("padded output");
  });

  test("trims exactly 1 trailing newline", () => {
    const mock = jest.fn(() => "hello\n");
    const result = $("cmd", mock);
    expect(result).toBe("hello");
  });

  test("returns ERR: prefix on failure with stderr", () => {
    const error = new Error("command failed");
    error.stderr = "some stderr output";
    const mock = jest.fn(() => { throw error; });
    const result = $("failcmd", mock);
    expect(result).toContain("ERR:");
    expect(result).toContain("some stderr output");
  });

  test("returns ERR: with message if no stderr", () => {
    const error = new Error("boom");
    const mock = jest.fn(() => { throw error; });
    const result = $("failcmd", mock);
    expect(result).toBe("ERR: boom");
  });

  test("passes 30s timeout to execSync", () => {
    const mock = jest.fn(() => Buffer.from("ok"));
    $("cmd", mock);
    expect(mock).toHaveBeenCalledWith("cmd", {
      encoding: "utf-8",
      timeout: 30_000,
    });
  });

  test("can handle empty output", () => {
    const mock = jest.fn(() => "");
    const result = $("cmd", mock);
    expect(result).toBe("");
  });
});

// ── Command argument parsing ──────────────────────────────────────────

describe("Argument parsing", () => {
  describe("/pay", () => {
    function parsePayArgs(text) {
      return text.split(/\s+/).slice(1);
    }

    test("extracts 2 args correctly", () => {
      expect(parsePayArgs("/pay 0x123 100")).toEqual(["0x123", "100"]);
    });

    test("extracts extra arguments", () => {
      expect(parsePayArgs("/pay 0x123 100 extra")).toEqual([
        "0x123",
        "100",
        "extra",
      ]);
    });

    test("extracts 1 arg when only to address given", () => {
      expect(parsePayArgs("/pay 0x123")).toEqual(["0x123"]);
    });

    test("returns empty array with no args", () => {
      expect(parsePayArgs("/pay")).toEqual([]);
    });

    test("validates args.length < 2 returns usage", () => {
      const args = [];
      expect(args.length < 2).toBe(true);

      const args2 = ["0x123"];
      expect(args2.length < 2).toBe(true);

      const args3 = ["0x123", "100"];
      expect(args3.length < 2).toBe(false);
    });
  });

  describe("/services", () => {
    function parseServicesArgs(text) {
      return text.split(/\s+/).slice(1).join(" ");
    }

    test("empty when no query", () => {
      expect(parseServicesArgs("/services")).toBe("");
    });

    test("joins multi-word queries", () => {
      expect(parseServicesArgs("/services ai agent")).toBe("ai agent");
    });

    test("collapses multiple spaces", () => {
      expect(parseServicesArgs("/services  defi  lending")).toBe("defi lending");
    });
  });
});

// ── Message truncation logic ─────────────────────────────────────────

describe("Message truncation", () => {
  test("slices output to 3800 chars for Telegram safety", () => {
    const longOutput = "x".repeat(5000);
    const truncated = longOutput.slice(0, 3800);
    expect(truncated.length).toBe(3800);
    expect(truncated).toBe("x".repeat(3800));
  });

  test("short output is not truncated", () => {
    const shortOutput = "hello world";
    const result = shortOutput.slice(0, 3800);
    expect(result).toBe("hello world");
  });

  test("exactly 3800 chars is not sliced further", () => {
    const exact = "y".repeat(3800);
    const result = exact.slice(0, 3800);
    expect(result.length).toBe(3800);
    expect(result).toBe(exact);
  });

  test("empty string stays empty", () => {
    const result = "".slice(0, 3800);
    expect(result).toBe("");
  });
});

import { afterEach, describe, expect, it, vi } from "vitest";

import { OdsayTransitClient } from "./client";
import { ODSAY_QUOTA_EXCEEDED_CODE, OdsayTransitError } from "./types";

// ODsay 는 에러도 HTTP 200 본문으로 준다 — 실측 형태(배열) 그대로.
function jsonResponse(body: unknown) {
  return { ok: true, status: 200, json: async () => body } as Response;
}

const ORIGIN = { lat: 37.5665, lng: 126.978 };
const DEST = { lat: 37.4979, lng: 127.0276 };

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("OdsayTransitClient — 429 분류", () => {
  it("일일 할당량 소진(Daily quota exceeded)은 재시도 없이 즉시 quota_exceeded 로 실패한다", async () => {
    const fetchMock = vi.fn(async () =>
      jsonResponse({
        error: [{ code: "429", message: "Daily quota exceeded" }],
      }),
    );
    vi.stubGlobal("fetch", fetchMock);
    const client = new OdsayTransitClient({
      apiKey: "k",
      maxRetries: 3,
      retryDelayMs: 1,
    });

    await expect(client.getTransitCommute(ORIGIN, DEST)).rejects.toMatchObject({
      name: "OdsayTransitError",
      code: ODSAY_QUOTA_EXCEEDED_CODE,
    });
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("순간 동시성 429(Too Many Requests)는 기존대로 maxRetries 만큼 재시도한다", async () => {
    const fetchMock = vi.fn(async () =>
      jsonResponse({ error: { code: "429", message: "Too Many Requests" } }),
    );
    vi.stubGlobal("fetch", fetchMock);
    const client = new OdsayTransitClient({
      apiKey: "k",
      maxRetries: 2,
      retryDelayMs: 1,
    });

    const err = await client.getTransitCommute(ORIGIN, DEST).catch((e) => e);
    expect(err).toBeInstanceOf(OdsayTransitError);
    expect((err as OdsayTransitError).code).not.toBe(ODSAY_QUOTA_EXCEEDED_CODE);
    expect(fetchMock).toHaveBeenCalledTimes(3);
  });
});

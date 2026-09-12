import { fireCreateMutation } from "./fire-create-mutation";
import { NetworkError } from "@/lib/api/client";

describe("fireCreateMutation", () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("navigates away right after a fast success, without an error", async () => {
    const onNavigateAway = jest.fn();
    const onError = jest.fn();

    fireCreateMutation({ mutateAsync: () => Promise.resolve("ok"), onNavigateAway, onError, timeoutMs: 2000 });
    await Promise.resolve();
    await Promise.resolve();

    expect(onNavigateAway).toHaveBeenCalledTimes(1);
    expect(onError).not.toHaveBeenCalled();
  });

  it("surfaces a real (non-network) failure and stays put", async () => {
    const onNavigateAway = jest.fn();
    const onError = jest.fn();

    fireCreateMutation({
      mutateAsync: () => Promise.reject(new Error("Title is required.")),
      onNavigateAway,
      onError,
      timeoutMs: 2000,
    });
    await Promise.resolve();
    await Promise.resolve();

    expect(onError).toHaveBeenCalledWith("Title is required.");
    expect(onNavigateAway).not.toHaveBeenCalled();
  });

  it("treats a NetworkError as queued rather than failed", async () => {
    const onNavigateAway = jest.fn();
    const onError = jest.fn();

    fireCreateMutation({
      mutateAsync: () => Promise.reject(new NetworkError("offline")),
      onNavigateAway,
      onError,
      timeoutMs: 2000,
    });
    await Promise.resolve();
    await Promise.resolve();

    expect(onNavigateAway).toHaveBeenCalledTimes(1);
    expect(onError).not.toHaveBeenCalled();
  });

  it("navigates away after the timeout when the mutation is still pending (offline-paused)", () => {
    const onNavigateAway = jest.fn();
    const onError = jest.fn();
    const hangingForever = new Promise(() => {});

    fireCreateMutation({ mutateAsync: () => hangingForever, onNavigateAway, onError, timeoutMs: 2000 });
    expect(onNavigateAway).not.toHaveBeenCalled();

    jest.advanceTimersByTime(2000);
    expect(onNavigateAway).toHaveBeenCalledTimes(1);
    expect(onError).not.toHaveBeenCalled();
  });

  it("does not navigate away a second time if the mutation later settles after the timeout fired", async () => {
    const onNavigateAway = jest.fn();
    const onError = jest.fn();
    let resolveLate: (value: unknown) => void = () => {};
    const late = new Promise((resolve) => {
      resolveLate = resolve;
    });

    fireCreateMutation({ mutateAsync: () => late, onNavigateAway, onError, timeoutMs: 2000 });
    jest.advanceTimersByTime(2000);
    expect(onNavigateAway).toHaveBeenCalledTimes(1);

    resolveLate("ok");
    await Promise.resolve();
    await Promise.resolve();

    expect(onNavigateAway).toHaveBeenCalledTimes(1);
    expect(onError).not.toHaveBeenCalled();
  });
});

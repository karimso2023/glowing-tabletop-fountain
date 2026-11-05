import { act, cleanup, render } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ProductVideo } from "@/components/store/ProductVideo";

let observers: { callback: IntersectionObserverCallback; options: IntersectionObserverInit | undefined }[];
let play: ReturnType<typeof vi.spyOn>;

function intersect(index: number) {
  const observer = observers[index];
  if (!observer) throw new Error("Missing observer");
  act(() => observer.callback([{ isIntersecting: true } as IntersectionObserverEntry], {} as IntersectionObserver));
}

beforeEach(() => {
  observers = [];
  vi.stubGlobal("IntersectionObserver", class {
    constructor(callback: IntersectionObserverCallback, options?: IntersectionObserverInit) { observers.push({ callback, options }); }
    observe() {}
    disconnect() {}
  });
  vi.spyOn(HTMLMediaElement.prototype, "load").mockImplementation(() => {});
  play = vi.spyOn(HTMLMediaElement.prototype, "play").mockResolvedValue(undefined);
});
afterEach(() => { cleanup(); vi.restoreAllMocks(); vi.unstubAllGlobals(); });

describe("product video playback", () => {
  it("defers loading until near viewport and plays muted only when visible", () => {
    const { container } = render(<ProductVideo src="/real.mp4" poster="/poster.jpg" />);
    const video = container.querySelector("video");
    expect(video?.getAttribute("src")).toBeNull();
    expect(observers[0]?.options?.rootMargin).toBe("300px 0px");
    intersect(0);
    expect(video?.getAttribute("src")).toBe("/real.mp4");
    expect(play).not.toHaveBeenCalled();
    intersect(1);
    expect(play).toHaveBeenCalledTimes(1);
    expect(video?.muted).toBe(true);
    expect(video?.controls).toBe(true);
    expect(video?.playsInline).toBe(true);
  });
  it("does not replay after manual pause or overwrite manual unmute", () => {
    const { container } = render(<ProductVideo src="/real.mp4" poster="/poster.jpg" />);
    intersect(1);
    const video = container.querySelector("video");
    if (!video) throw new Error("Missing video");
    video.muted = false;
    video.dispatchEvent(new Event("pause"));
    intersect(1);
    expect(play).toHaveBeenCalledTimes(1);
    expect(video.muted).toBe(false);
  });
  it("handles autoplay rejection without retrying, retaining manual controls", async () => {
    play.mockRejectedValue(new Error("Autoplay blocked"));
    const { container } = render(<ProductVideo src="/real.mp4" poster="/poster.jpg" />);
    intersect(1);
    await act(async () => { await Promise.resolve(); });
    intersect(1);
    expect(play).toHaveBeenCalledTimes(1);
    expect(container.querySelector("video")?.controls).toBe(true);
  });
});
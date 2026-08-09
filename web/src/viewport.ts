/**
 * CSS `100dvh` is meant to track the actually-visible viewport as iOS
 * Safari's toolbar shows/hides, but in practice it's unreliable - it can
 * report a value taller than what's really on screen (most visibly on
 * iPhone, less consistently on iPad), pushing the sticky bottom action bar
 * partly off-screen with no way to reach it. `visualViewport.height` is the
 * actual, currently-visible height and updates live as Safari's chrome
 * changes, so track it in a CSS custom property instead and let `100dvh`
 * remain only as the pre-JS/unsupported-browser fallback.
 */
export function updateAppHeight(): void {
  const height = window.visualViewport?.height ?? window.innerHeight;
  document.documentElement.style.setProperty("--app-height", `${height}px`);
}

export function initAppHeightTracking(): void {
  updateAppHeight();
  window.addEventListener("resize", updateAppHeight);
  window.addEventListener("orientationchange", updateAppHeight);
  window.visualViewport?.addEventListener("resize", updateAppHeight);
}

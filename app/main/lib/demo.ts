declare global {
  var __ADRS_DEMO_SETTINGS: { now: string | null; model: string } | undefined;
}

const defaults = { now: null, model: process.env.SAKURA_MODEL || "gpt-oss-120b" };

export function getDemoSettings() {
  globalThis.__ADRS_DEMO_SETTINGS ??= { ...defaults };
  return globalThis.__ADRS_DEMO_SETTINGS;
}

export function getDemoNow(): Date {
  const value = getDemoSettings().now;
  return value ? new Date(value) : new Date();
}

export function updateDemoSettings(patch: { now?: string | null; model?: string }) {
  const settings = getDemoSettings();
  if (patch.now !== undefined) settings.now = patch.now;
  if (patch.model !== undefined) settings.model = patch.model;
  return settings;
}

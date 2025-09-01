export type GlamArConfig = {
  apiKey: string;
  platform?: string;
  meta?: any;
  parentDomain?: string;
  development?: boolean;
};

let currentConfig: GlamArConfig | null = null;
const waiters: Array<(cfg: GlamArConfig) => void> = [];

export function setGlamArConfig(cfg: GlamArConfig) {
  currentConfig = cfg;
  // wake everyone waiting
  while (waiters.length) waiters.shift()!(cfg);
}

export function getGlamArConfig(): GlamArConfig | null {
  return currentConfig;
}

/** Resolves the first time config is set; resolves immediately if already set */
export function waitForGlamArConfig(): Promise<GlamArConfig> {
  if (currentConfig) return Promise.resolve(currentConfig);
  return new Promise((resolve) => waiters.push(resolve));
}

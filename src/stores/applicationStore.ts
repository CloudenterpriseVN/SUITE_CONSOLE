import { atom } from 'jotai'
import { loadable } from "jotai/utils";
import { requestWithFallback } from "@/utils/request";

export interface SuiteApp {
  id: string;
  name: string;
  code: string;
  desc?: string;
  connected?: boolean;
  logo?: string;
}

export const appsState = atom(async () => {
  const data = await requestWithFallback<SuiteApp[]>('/apps', [])
  return data
})

export const savedAppState = atom<SuiteApp["code"]>("");

export const activeAppState = atom(async (get) => {
  const savedApp = get(savedAppState);
  if (savedApp) {
    const apps = await get(appsState);
    const match_apps = apps.filter((a) =>
      a.code == savedApp
    );
    return (match_apps.length > 0) ? match_apps[0] : undefined;
  }
  return undefined;
});

// Active team ID
export const activeTeamIdAtom = atom<string | null>(null)

// Loadable versions for non-blocking UI
export const loadableAppsState = loadable(appsState)

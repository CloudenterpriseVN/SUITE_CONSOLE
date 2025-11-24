import { atom } from 'jotai'
import { atomWithStorage } from "jotai/utils";
import { requestWithFallback } from "@/utils/request";

export interface Team {
  id: string;
  name: string;
  description?: string;
}

export interface SuiteApp {
  id: string;
  name: string;
  code: string;
  desc?: string;
  connected?: boolean;
  logo?: string;
}


export const teamsState = atom(async () => {
  const data = await requestWithFallback<Team[]>('/teams', [{
    id: 'default',
    name: 'Default',
  }])
  return data
})

export const appsState = atom(async () => {
  const data = await requestWithFallback<SuiteApp[]>('/apps', [])
  return data
})


export const savedAppState = atomWithStorage<SuiteApp["code"]>("current_app", "");

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




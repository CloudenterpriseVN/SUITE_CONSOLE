import { atom } from 'jotai'
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

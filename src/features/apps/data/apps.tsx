import {
  IconBrandFigma,
  IconBrandNotion,
  IconBrandSlack,
  IconBrandTelegram,
  IconBrandTrello,
} from '@tabler/icons-react'

export const apps = [
  {
    name: 'WMS',
    logo: <IconBrandTelegram />,
    connected: false,
    desc: 'Mobile solution for inventory activities.',
  },
  {
    name: 'DMS',
    logo: <IconBrandNotion />,
    connected: true,
    desc: 'Used for salesman on-the-road',
  },
  {
    name: 'TMS',
    logo: <IconBrandFigma />,
    connected: true,
    desc: 'Driver',
  },
  {
    name: 'AMS',
    logo: <IconBrandTrello />,
    connected: false,
    desc: 'Works with / without connection',
  },
  {
    name: 'APS',
    logo: <IconBrandTrello />,
    connected: false,
    desc: 'MRP Scheduling',
  },
  {
    name: 'MES',
    logo: <IconBrandSlack />,
    connected: false,
    desc: 'Keep track all activities on manufacturing floor',
  },
]

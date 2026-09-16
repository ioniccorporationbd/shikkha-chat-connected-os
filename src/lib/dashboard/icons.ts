import type { IconType } from "react-icons";
import {
  FiActivity,
  FiAward,
  FiBarChart2,
  FiBox,
  FiBriefcase,
  FiFileText,
  FiGrid,
  FiMonitor,
  FiSettings,
  FiShield,
  FiUserCheck,
  FiUsers,
} from "react-icons/fi";

/** Icon keys come from the API (`stat.icon`), so unknown keys fall back safely. */
const STAT_ICONS: Record<string, IconType> = {
  users: FiUsers,
  building: FiBriefcase,
  customer: FiUserCheck,
  box: FiBox,
  badge: FiAward,
  receipt: FiFileText,
  shield: FiShield,
  device: FiMonitor,
  grid: FiGrid,
};

export function statIcon(key: string): IconType {
  return STAT_ICONS[key] ?? FiActivity;
}

export const NAV_ICONS: Record<string, IconType> = {
  overview: FiGrid,
  analytics: FiBarChart2,
  reports: FiFileText,
  users: FiUsers,
  settings: FiSettings,
};

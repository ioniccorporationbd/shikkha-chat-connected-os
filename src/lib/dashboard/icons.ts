import type { IconType } from "react-icons";
import {
  FiActivity,
  FiAward,
  FiBarChart2,
  FiBox,
  FiBriefcase,
  FiClock,
  FiCreditCard,
  FiDollarSign,
  FiFileText,
  FiGrid,
  FiHeadphones,
  FiMonitor,
  FiPackage,
  FiSettings,
  FiShield,
  FiUserCheck,
  FiUserPlus,
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
  customers: FiUserPlus,
  checkin: FiClock,
  expenseclaim: FiDollarSign,
  paymenthistory: FiCreditCard,
  servicebuild: FiPackage,
  helpdesk: FiHeadphones,
  analytics: FiBarChart2,
  reports: FiFileText,
  users: FiUsers,
  settings: FiSettings,
};

export const DASHBOARD_LIST_CHANGED_EVENT = 'dashboard-list-changed';

export function notifyDashboardListChanged() {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent(DASHBOARD_LIST_CHANGED_EVENT));
}

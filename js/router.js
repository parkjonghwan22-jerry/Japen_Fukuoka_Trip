export const TABS = ['map', 'checklist', 'transit', 'expense'];

export function resolveTab(tab) {
  return TABS.includes(tab) ? tab : 'map';
}

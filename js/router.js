export const TABS = ['home', 'map', 'checklist', 'transit', 'expense'];

export function resolveTab(tab) {
  return TABS.includes(tab) ? tab : 'home';
}

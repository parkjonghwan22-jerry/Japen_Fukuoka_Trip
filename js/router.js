export const TABS = ['home', 'schedule'];

export function resolveTab(tab) {
  return TABS.includes(tab) ? tab : 'home';
}

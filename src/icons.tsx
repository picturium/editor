import type { ComponentChildren, JSX } from 'preact';
import type { Group } from './types';

const Icon = ({ children }: { children: ComponentChildren }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
    {children}
  </svg>
);

export const GROUP_ICON: Record<Group, JSX.Element> = {
  crop: <Icon><path d="M7 2.5V15a2 2 0 0 0 2 2h12.5" /><path d="M2.5 7H15a2 2 0 0 1 2 2v12.5" /></Icon>,
  size: <Icon><path d="M14.5 3.5h6v6" /><path d="M9.5 20.5h-6v-6" /><path d="M20.5 3.5l-7 7" /><path d="M3.5 20.5l7-7" /></Icon>,
  canvas: <Icon><rect x="3" y="3" width="18" height="18" rx="2" /><rect x="8" y="8" width="8" height="8" /></Icon>,
  filter: <Icon><path d="M3.5 6h9M17.5 6h3M3.5 12h3M11.5 12h9M3.5 18h11M19.5 18h1" /><circle cx="15" cy="6" r="2.2" /><circle cx="9" cy="12" r="2.2" /><circle cx="17" cy="18" r="2.2" /></Icon>,
  mark: <Icon><path d="M12 3s6.5 6.6 6.5 11.2a6.5 6.5 0 0 1-13 0C5.5 9.6 12 3 12 3z" /></Icon>,
  out: <Icon><path d="M12 3.5v11.5" /><path d="M7 10.5l5 5 5-5" /><path d="M4 20.5h16" /></Icon>,
  motion: <Icon><path d="M12 3.5l9 4.8-9 4.8-9-4.8 9-4.8z" /><path d="M3 13l9 4.8 9-4.8" /></Icon>,
  deliv: <Icon><path d="M13 2.5L4.5 13.5H11l-1 8L18.5 10.5H12l1-8z" /></Icon>,
};

export const ICON = {
  image: <Icon><rect x="3" y="4" width="18" height="16" rx="2" /><circle cx="9" cy="10" r="1.6" /><path d="M4 18l5-5 4 4 3-3 4 4" /></Icon>,
  sun: <Icon><circle cx="12" cy="12" r="4" /><path d="M12 2.5v2M12 19.5v2M2.5 12h2M19.5 12h2M5.3 5.3l1.4 1.4M17.3 17.3l1.4 1.4M5.3 18.7l1.4-1.4M17.3 6.7l1.4-1.4" /></Icon>,
  moon: <Icon><path d="M20.5 13.2A8.5 8.5 0 1 1 10.8 3.5a6.6 6.6 0 0 0 9.7 9.7z" /></Icon>,
  close: <Icon><path d="M6 6l12 12M18 6L6 18" /></Icon>,
  compare: <Icon><rect x="3" y="5" width="18" height="14" rx="2" /><path d="M12 2.5v19" /></Icon>,
  copy: <Icon><rect x="9" y="9" width="11.5" height="11.5" rx="2" /><path d="M5 15V5.5a2 2 0 0 1 2-2H15" /></Icon>,
};

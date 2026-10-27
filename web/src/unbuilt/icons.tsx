// UNBUILT tool/object icons (Designer-owned). Minimal geometric stroke
// icons: no added meaning beyond the labeled tool or object they sit on.
// Every use pairs the icon with a visible text label and a tooltip.
interface IconProps {
  size?: number;
}

function Base({ size = 22, children }: IconProps & { children: React.ReactNode }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
      {children}
    </svg>
  );
}

export function SelectIcon({ size }: IconProps) {
  return (
    <Base size={size}>
      <path d="M6 3l13 9.5-7.5 1L9 21 6 3z" />
    </Base>
  );
}

export function PanIcon({ size }: IconProps) {
  return (
    <Base size={size}>
      <path d="M12 3v18M3 12h18" />
      <path d="M12 3l-2.5 2.5M12 3l2.5 2.5M12 21l-2.5-2.5M12 21l2.5-2.5M3 12l2.5-2.5M3 12l2.5 2.5M21 12l-2.5-2.5M21 12l-2.5 2.5" />
    </Base>
  );
}

export function SiteIcon({ size }: IconProps) {
  return (
    <Base size={size}>
      <rect x="4" y="4" width="16" height="16" strokeDasharray="3 2" />
    </Base>
  );
}

export function OpenSpaceIcon({ size }: IconProps) {
  return (
    <Base size={size}>
      <rect x="5" y="5" width="14" height="14" />
      <circle cx="12" cy="12" r="2.5" />
    </Base>
  );
}

export function CirculationIcon({ size }: IconProps) {
  return (
    <Base size={size}>
      <path d="M4 18c4-1 3-6 7-7s5-5 9-5" />
      <path d="M4 21c4-1 3-6 7-7s5-5 9-5" strokeWidth={1} opacity={0.6} />
    </Base>
  );
}

export function HomesIcon({ size }: IconProps) {
  return (
    <Base size={size}>
      <path d="M5 11l7-6 7 6v9H5v-9z" />
      <path d="M10 20v-5h4v5" />
    </Base>
  );
}

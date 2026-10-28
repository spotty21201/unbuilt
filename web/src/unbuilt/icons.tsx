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
  return <Base size={size}><path d="M8 12V5a1.5 1.5 0 013 0v6-8a1.5 1.5 0 013 0v8-6a1.5 1.5 0 013 0v7-4a1.5 1.5 0 013 0v7c0 5-3 8-7 8-3 0-5-2-7-5l-3-4a1.5 1.5 0 012-2l3 3z" /></Base>;
}

export function SiteIcon({ size }: IconProps) {
  return <Base size={size}><path d="M4 17V6l12-2 4 13-8 4z" /><path d="M2 4h4v4H2zM14 2h4v4h-4zM18 15h4v4h-4zM2 15h4v4H2z" fill="currentColor" stroke="none" /></Base>;
}

export function OpenSpaceIcon({ size }: IconProps) {
  return <Base size={size}><path d="M15 19v-7m-3 9h9M5 21v-8m-3 8h7" /><path d="M11 10c-3-4 0-8 3-8s6 3 4 6c4 1 4 6 0 7h-5c-4-1-4-4-2-5zM5 6L1 13h8z" /></Base>;
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
  return <Base size={size}><path d="M4 21V7h8V3h8v18zM1 21h22M8 10v2m0 3v2m8-11v2m0 3v2m0 3v2" /></Base>;
}

export function FitIcon({ size }: IconProps) {
  return <Base size={size}><path d="M3 9V3h6m6 0h6v6m0 6v6h-6m-6 0H3v-6" /><rect x="8" y="8" width="8" height="8" /></Base>;
}
export function LayersIcon({ size }: IconProps) {
  return <Base size={size}><path d="M12 3L2 9l10 6 10-6-10-6zM2 13l10 6 10-6M5 18l7 4 7-4" /></Base>;
}
export function ExpandIcon({ size }: IconProps) {
  return <Base size={size}><path d="M3 9V3h6m6 0h6v6M3 15v6h6m6 0h6v-6M3 3l6 6m12-6l-6 6M3 21l6-6m12 6l-6-6" /></Base>;
}
export function UndoIcon({ size }: IconProps) {
  return <Base size={size}><path d="M9 5L3 10l6 5M4 10h10a6 6 0 110 12" transform="translate(0 -2)" /></Base>;
}
export function RedoIcon({ size }: IconProps) {
  return <Base size={size}><path d="M15 5l6 5-6 5m5-5H10a6 6 0 100 12" transform="translate(0 -2)" /></Base>;
}
export function LockIcon({ size }: IconProps) {
  return <Base size={size}><rect x="5" y="10" width="14" height="11" /><path d="M8 10V6a4 4 0 018 0v4M12 14v3" /></Base>;
}
export function InspectIcon({ size }: IconProps) {
  return <Base size={size}><rect x="4" y="4" width="16" height="16" /><path d="M8 11l3 3 6-7" /></Base>;
}
export function AssistantIcon({ size }: IconProps) {
  return <Base size={size}><path d="M5 19L17 7m-9 9l-3-3M17 2v4m-2-2h4M6 2v5M3.5 4.5h5M20 13v6m-3-3h6" /></Base>;
}

export function DrawSiteIcon({ size }: IconProps) {
  return <Base size={size}><path d="M4 18V6l11-3 4 7M3 17h3v3H3zM3 4h3v3H3zM14 2h3v3h-3zM16 18h7m-3.5-3.5v7" /></Base>;
}
export function DownloadIcon({ size }: IconProps) {
  return <Base size={size}><path d="M12 3v12m-4-4l4 4 4-4M4 15v5h16v-5" /></Base>;
}

import { useMemo } from 'react';

interface IndividualNetworkVennProps {
  leftLabel: string;
  rightLabel: string;
  leftTotal: number;
  rightTotal: number;
  common: number;
}

function getLabelFontSize(label: string): number {
  const length = label.length;
  if (length >= 30) return 8;
  if (length >= 24) return 9;
  if (length >= 18) return 10;
  if (length >= 14) return 11;
  if (length >= 10) return 12;
  return 13;
}

export function IndividualNetworkVenn({
  leftLabel,
  rightLabel,
  leftTotal,
  rightTotal,
  common,
}: IndividualNetworkVennProps) {
  const LEFT_CENTER_X = 136;
  const RIGHT_CENTER_X = 294;
  const CENTER_X = 215;
  const CENTER_Y = 125;
  const OUTER_RADIUS = 122;
  const INNER_RADIUS = 74;
  const NAME_HORIZONTAL_OFFSET = 45;

  const safeCommon = Math.max(0, Math.min(common, leftTotal, rightTotal));
  const safeLeft = Math.max(leftTotal, safeCommon);
  const safeRight = Math.max(rightTotal, safeCommon);
  const displayLeftLabel = useMemo(() => leftLabel.trim() || '?', [leftLabel]);
  const displayRightLabel = useMemo(() => rightLabel.trim() || '?', [rightLabel]);

  const leftNameFontSize = useMemo(() => getLabelFontSize(displayLeftLabel), [displayLeftLabel]);
  const rightNameFontSize = useMemo(() => getLabelFontSize(displayRightLabel), [displayRightLabel]);
  const leftNeedsCompression = displayLeftLabel.length > 9;
  const rightNeedsCompression = displayRightLabel.length > 9;

  const leftValueFontSize = useMemo(() => {
    const digits = `${safeLeft}`.length;
    if (digits >= 4) return 30;
    if (digits === 3) return 36;
    if (digits === 2) return 42;
    return 48;
  }, [safeLeft]);

  const rightValueFontSize = useMemo(() => {
    const digits = `${safeRight}`.length;
    if (digits >= 4) return 30;
    if (digits === 3) return 36;
    if (digits === 2) return 42;
    return 48;
  }, [safeRight]);

  const commonValueFontSize = useMemo(() => {
    const digits = `${safeCommon}`.length;
    if (digits >= 4) return 30;
    if (digits === 3) return 34;
    if (digits === 2) return 40;
    return 46;
  }, [safeCommon]);

  const commonLabelFontSize = 11;
  const commonLineGap = 8;
  const commonBlockHeight = commonValueFontSize + commonLineGap + commonLabelFontSize;
  const commonNumberY = CENTER_Y - commonBlockHeight / 2 + commonValueFontSize / 2;
  const commonLabelY = CENTER_Y + commonBlockHeight / 2 - commonLabelFontSize / 2;

  return (
    <div>
      <svg
        viewBox="0 0 430 250"
        className="mx-auto h-[250px] w-full"
        role="img"
        aria-label="Visualisation des reseaux individuels et des relations en commun"
      >
        <defs>
          <filter id="vennCenterGlow" x="-40%" y="-40%" width="180%" height="180%">
            <feDropShadow dx="0" dy="8" stdDeviation="9" floodColor="#8B5CF6" floodOpacity="0.16" />
          </filter>
        </defs>

        <circle cx={LEFT_CENTER_X} cy={CENTER_Y} r={OUTER_RADIUS} fill="rgba(196,181,253,0.34)" stroke="#A78BFA" strokeWidth="1.8" />
        <circle cx={RIGHT_CENTER_X} cy={CENTER_Y} r={OUTER_RADIUS} fill="rgba(251,207,232,0.36)" stroke="#F472B6" strokeWidth="1.8" />

        <circle cx={CENTER_X} cy={CENTER_Y} r={INNER_RADIUS} fill="#FFFFFF" stroke="#C4B5FD" strokeWidth="2" filter="url(#vennCenterGlow)" />

        <text
          x={LEFT_CENTER_X - NAME_HORIZONTAL_OFFSET}
          y="101"
          textAnchor="middle"
          fontSize={leftNameFontSize}
          fontWeight="600"
          fill="#6D28D9"
          textLength={leftNeedsCompression ? 96 : undefined}
          lengthAdjust={leftNeedsCompression ? 'spacingAndGlyphs' : undefined}
        >
          {displayLeftLabel}
        </text>
        <text x={LEFT_CENTER_X - 28} y="162" textAnchor="middle" fontSize={leftValueFontSize} fontWeight="700" fill="#6D28D9">
          {safeLeft}
        </text>

        <text
          x={RIGHT_CENTER_X + NAME_HORIZONTAL_OFFSET}
          y="101"
          textAnchor="middle"
          fontSize={rightNameFontSize}
          fontWeight="600"
          fill="#DB2777"
          textLength={rightNeedsCompression ? 96 : undefined}
          lengthAdjust={rightNeedsCompression ? 'spacingAndGlyphs' : undefined}
        >
          {displayRightLabel}
        </text>
        <text x={RIGHT_CENTER_X + 28} y="162" textAnchor="middle" fontSize={rightValueFontSize} fontWeight="700" fill="#DB2777">
          {safeRight}
        </text>

        <text
          x={CENTER_X}
          y={commonNumberY}
          textAnchor="middle"
          dominantBaseline="middle"
          fontSize={commonValueFontSize}
          fontWeight="700"
          fill="#0F766E"
        >
          {safeCommon}
        </text>
        <text
          x={CENTER_X}
          y={commonLabelY}
          textAnchor="middle"
          dominantBaseline="middle"
          fontSize={commonLabelFontSize}
          letterSpacing="2.2"
          fontWeight="600"
          fill="#5B21B6"
        >
          EN COMMUN
        </text>
      </svg>
    </div>
  );
}

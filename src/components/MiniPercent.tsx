interface MiniPercentProps {
  percent: number;
  color: string;
}

const SIZE = 32;
const CENTER = SIZE / 2;
const RADIUS = 12;
const WIDTH = 5;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

/** Small per-row circle showing one leaf item's own share of total capacity. */
export function MiniPercent({ percent, color }: MiniPercentProps) {
  const clamped = Math.max(0, Math.min(percent, 100));
  const lenPx = (clamped / 100) * CIRCUMFERENCE;

  return (
    <div className="mini-percent" aria-label={`${Math.round(percent)}% of capacity`}>
      <svg width={SIZE} height={SIZE} viewBox={`0 0 ${SIZE} ${SIZE}`}>
        <g transform={`rotate(-90 ${CENTER} ${CENTER})`}>
          <circle
            cx={CENTER}
            cy={CENTER}
            r={RADIUS}
            fill="none"
            stroke="var(--gridline)"
            strokeWidth={WIDTH}
          />
          {lenPx > 0 && (
            <circle
              cx={CENTER}
              cy={CENTER}
              r={RADIUS}
              fill="none"
              stroke={color}
              strokeWidth={WIDTH}
              strokeDasharray={`${lenPx} ${CIRCUMFERENCE}`}
              strokeLinecap="round"
            />
          )}
        </g>
      </svg>
      <span className="mini-percent-label">{Math.round(percent)}%</span>
    </div>
  );
}

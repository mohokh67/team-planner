export interface DonutSlice {
  id: string;
  label: string;
  estimate: number;
  color: string;
}

interface DonutChartProps {
  capacity: number;
  allocated: number;
  slices: DonutSlice[]; // checked leaf items only, in display order
  unitLabel: string;
}

const SIZE = 144;
const CENTER = SIZE / 2;
const MAIN_RADIUS = 54;
const MAIN_WIDTH = 16;
const OVERFLOW_RADIUS = 66;
const OVERFLOW_WIDTH = 6;
const GAP = 2;

const MAIN_CIRCUMFERENCE = 2 * Math.PI * MAIN_RADIUS;
const OVERFLOW_CIRCUMFERENCE = 2 * Math.PI * OVERFLOW_RADIUS;

export function DonutChart({
  capacity,
  allocated,
  slices,
  unitLabel,
}: DonutChartProps) {
  const remaining = Math.max(capacity - allocated, 0);
  const overflowAmount = Math.max(allocated - capacity, 0);
  const percent = capacity > 0 ? Math.round((allocated / capacity) * 100) : 0;

  let cumulative = 0; // capacity-equivalent units consumed so far, unclamped
  const arcs = capacity > 0
    ? slices.map((slice) => {
        const start = Math.min(cumulative, capacity);
        const clampedLen = Math.max(
          0,
          Math.min(slice.estimate, capacity - start),
        );
        cumulative += slice.estimate;
        const lenPx = (clampedLen / capacity) * MAIN_CIRCUMFERENCE;
        const offsetPx = (start / capacity) * MAIN_CIRCUMFERENCE;
        return { ...slice, lenPx, offsetPx };
      })
    : [];

  const remainingLenPx =
    capacity > 0 ? (remaining / capacity) * MAIN_CIRCUMFERENCE : 0;
  const remainingOffsetPx =
    capacity > 0
      ? (Math.min(allocated, capacity) / capacity) * MAIN_CIRCUMFERENCE
      : 0;

  const overflowLenPx =
    capacity > 0
      ? (Math.min(overflowAmount, capacity) / capacity) * OVERFLOW_CIRCUMFERENCE
      : 0;

  return (
    <div className="donut" role="img" aria-label={
      `${allocated} of ${capacity} ${unitLabel} allocated` +
      (overflowAmount > 0 ? `, ${overflowAmount} ${unitLabel} over capacity` : "")
    }>
      <svg width={SIZE} height={SIZE} viewBox={`0 0 ${SIZE} ${SIZE}`}>
        <g transform={`rotate(-90 ${CENTER} ${CENTER})`}>
          <circle
            cx={CENTER}
            cy={CENTER}
            r={MAIN_RADIUS}
            fill="none"
            stroke="var(--gridline)"
            strokeWidth={MAIN_WIDTH}
          />
          {arcs.map(
            (arc) =>
              arc.lenPx > 0 && (
                <circle
                  key={arc.id}
                  cx={CENTER}
                  cy={CENTER}
                  r={MAIN_RADIUS}
                  fill="none"
                  stroke={arc.color}
                  strokeWidth={MAIN_WIDTH}
                  strokeDasharray={`${Math.max(arc.lenPx - GAP, 0)} ${MAIN_CIRCUMFERENCE}`}
                  strokeDashoffset={-arc.offsetPx}
                  strokeLinecap="round"
                >
                  <title>{arc.label}</title>
                </circle>
              ),
          )}
          {remainingLenPx > 0 && (
            <circle
              cx={CENTER}
              cy={CENTER}
              r={MAIN_RADIUS}
              fill="none"
              stroke="var(--baseline)"
              strokeWidth={MAIN_WIDTH}
              strokeDasharray={`${Math.max(remainingLenPx - GAP, 0)} ${MAIN_CIRCUMFERENCE}`}
              strokeDashoffset={-remainingOffsetPx}
            >
              <title>Remaining capacity</title>
            </circle>
          )}
          {overflowLenPx > 0 && (
            <circle
              cx={CENTER}
              cy={CENTER}
              r={OVERFLOW_RADIUS}
              fill="none"
              stroke="var(--status-critical)"
              strokeWidth={OVERFLOW_WIDTH}
              strokeDasharray={`${overflowLenPx} ${OVERFLOW_CIRCUMFERENCE}`}
              strokeLinecap="round"
            >
              <title>Over capacity</title>
            </circle>
          )}
        </g>
      </svg>
      <div className="donut-center">
        <span className="donut-percent">{percent}%</span>
        <span className="donut-sub">
          {overflowAmount > 0
            ? `−${overflowAmount} ${unitLabel} over`
            : `${remaining} ${unitLabel} left`}
        </span>
      </div>
    </div>
  );
}

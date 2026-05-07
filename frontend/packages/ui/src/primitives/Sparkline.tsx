export interface SparklineProps {
  data: number[];
  width?: number;
  height?: number;
  color?: string;
  /** Render the area fill below the line. Default true. */
  fill?: boolean;
  /** Highlight the last data point with a small dot. Default true. */
  endDot?: boolean;
  className?: string;
  ariaLabel?: string;
}

/**
 * Minimal SVG sparkline — line + area fill + last-point dot. No deps. Use for
 * inline trend indicators (article views over 30d, etc.).
 */
export function Sparkline({
  data,
  width = 80,
  height = 22,
  color = "var(--cobalt)",
  fill = true,
  endDot = true,
  className,
  ariaLabel,
}: SparklineProps) {
  if (data.length === 0) return null;
  if (data.length === 1) {
    const cy = height / 2;
    return (
      <svg
        width={width}
        height={height}
        className={className}
        aria-label={ariaLabel}
        role={ariaLabel ? "img" : undefined}
      >
        <circle cx={width - 1} cy={cy} r={2} fill={color} />
      </svg>
    );
  }
  const max = Math.max(...data);
  const min = Math.min(...data);
  const span = max - min || 1;
  const step = width / (data.length - 1);
  const points = data.map((v, i) => {
    const x = i * step;
    const y = height - ((v - min) / span) * (height - 2) - 1;
    return [x, y] as const;
  });
  const linePath = points
    .map(([x, y], i) => `${i === 0 ? "M" : "L"}${x.toFixed(2)} ${y.toFixed(2)}`)
    .join(" ");
  const areaPath = `${linePath} L${width} ${height} L0 ${height}Z`;
  const last = points[points.length - 1]!;
  return (
    <svg
      width={width}
      height={height}
      className={className}
      aria-label={ariaLabel}
      role={ariaLabel ? "img" : undefined}
    >
      {fill ? <path d={areaPath} fill={color} fillOpacity={0.12} /> : null}
      <path
        d={linePath}
        fill="none"
        stroke={color}
        strokeWidth={1.5}
        strokeLinejoin="round"
        strokeLinecap="round"
      />
      {endDot ? <circle cx={last[0]} cy={last[1]} r={2} fill={color} /> : null}
    </svg>
  );
}

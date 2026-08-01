import { useEffect, useState } from 'react';

interface RiskGaugeProps {
  score: number;
  level: 'Low' | 'Medium' | 'High';
  size?: number;
}

/**
 * Converts polar coordinates to Cartesian (SVG).
 * angleRad: angle in radians, measured clockwise from 12-o'clock (top).
 */
function polarToCartesian(cx: number, cy: number, r: number, angleDeg: number) {
  const rad = ((angleDeg - 90) * Math.PI) / 180;
  return {
    x: cx + r * Math.cos(rad),
    y: cy + r * Math.sin(rad),
  };
}

/**
 * Builds an SVG arc path string.
 * startDeg / endDeg: angles in degrees, measured clockwise from 12-o'clock.
 */
function arcPath(cx: number, cy: number, r: number, startDeg: number, endDeg: number) {
  const s = polarToCartesian(cx, cy, r, startDeg);
  const e = polarToCartesian(cx, cy, r, endDeg);
  const large = endDeg - startDeg > 180 ? 1 : 0;
  return `M ${s.x} ${s.y} A ${r} ${r} 0 ${large} 1 ${e.x} ${e.y}`;
}

export function RiskGauge({ score, level, size = 180 }: RiskGaugeProps) {
  const [animatedScore, setAnimatedScore] = useState(0);

  const strokeWidth = size < 160 ? 12 : 14;
  const padding = strokeWidth / 2 + 2;
  const radius = size / 2 - padding;
  const cx = size / 2;
  const cy = size / 2;

  // Arc goes from 135° to 405° (clockwise) — 270° span, gap at bottom
  const ARC_START = 135;
  const ARC_END = 405; // = 135 + 270
  const ARC_SPAN = 270;

  const fillColor =
    level === 'Low' ? '#22c55e' : level === 'Medium' ? '#eab308' : '#ef4444';
  const glowColor =
    level === 'Low'
      ? 'rgba(34,197,94,0.35)'
      : level === 'Medium'
        ? 'rgba(234,179,8,0.35)'
        : 'rgba(239,68,68,0.35)';
  const gradStart =
    level === 'Low' ? '#4ade80' : level === 'Medium' ? '#facc15' : '#f87171';

  useEffect(() => {
    let start = 0;
    const duration = 1200;
    const step = 16;
    const increment = score / (duration / step);
    const timer = setInterval(() => {
      start += increment;
      if (start >= score) {
        start = score;
        clearInterval(timer);
      }
      setAnimatedScore(Math.round(start));
    }, step);
    return () => clearInterval(timer);
  }, [score]);

  // Compute the fill end angle based on animated score
  const fillEndDeg = ARC_START + (animatedScore / 100) * ARC_SPAN;

  // Label positions at the two ends of the arc
  const label0 = polarToCartesian(cx, cy, radius + strokeWidth / 2 + 10, ARC_START);
  const label100 = polarToCartesian(cx, cy, radius + strokeWidth / 2 + 10, ARC_END);

  const filterId = `gaugeGlow-${size}`;
  const gradId = `gaugeGrad-${size}-${level}`;

  return (
    <div className="flex flex-col items-center select-none">
      <div className="relative" style={{ width: size, height: size }}>

        {/* Ambient glow */}
        <div
          className="absolute inset-0 rounded-full pointer-events-none transition-all duration-700"
          style={{ boxShadow: animatedScore > 0 ? `0 0 36px ${glowColor}` : 'none' }}
        />

        <svg width={size} height={size} overflow="visible">
          <defs>
            <filter id={filterId} x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="2.5" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
            <linearGradient id={gradId} gradientUnits="userSpaceOnUse"
              x1={polarToCartesian(cx, cy, radius, ARC_START).x}
              y1={polarToCartesian(cx, cy, radius, ARC_START).y}
              x2={polarToCartesian(cx, cy, radius, ARC_END).x}
              y2={polarToCartesian(cx, cy, radius, ARC_END).y}
            >
              <stop offset="0%" stopColor={gradStart} />
              <stop offset="100%" stopColor={fillColor} />
            </linearGradient>
          </defs>

          {/* Track arc (background) */}
          <path
            d={arcPath(cx, cy, radius, ARC_START, ARC_END)}
            fill="none"
            stroke="#1a2029"
            strokeWidth={strokeWidth}
            strokeLinecap="round"
          />

          {/* Filled arc */}
          {animatedScore > 0 && (
            <path
              d={arcPath(cx, cy, radius, ARC_START, fillEndDeg)}
              fill="none"
              stroke={`url(#${gradId})`}
              strokeWidth={strokeWidth}
              strokeLinecap="round"
              filter={`url(#${filterId})`}
            />
          )}

          {/* End-dot glow when score > 0 */}
          {animatedScore > 0 && (() => {
            const dot = polarToCartesian(cx, cy, radius, fillEndDeg);
            return (
              <circle
                cx={dot.x}
                cy={dot.y}
                r={strokeWidth / 2.5}
                fill={fillColor}
                filter={`url(#${filterId})`}
              />
            );
          })()}

          {/* Tick labels: 0 and 100 at arc ends */}
          <text
            x={label0.x}
            y={label0.y + 4}
            textAnchor="middle"
            fontSize={size < 160 ? 9 : 10}
            fill="#4b5563"
            fontFamily="Inter, sans-serif"
          >
            0
          </text>
          <text
            x={label100.x}
            y={label100.y + 4}
            textAnchor="middle"
            fontSize={size < 160 ? 9 : 10}
            fill="#4b5563"
            fontFamily="Inter, sans-serif"
          >
            100
          </text>
        </svg>

        {/* Center text — always upright, no rotation needed */}
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <span
            className="font-bold tabular-nums transition-colors duration-700 leading-none"
            style={{
              color: fillColor,
              fontSize: size < 160 ? '1.75rem' : '2.25rem',
            }}
          >
            {animatedScore}
          </span>
          <span className="text-xs text-gray-500 mt-0.5 font-medium">/ 100</span>
          <span
            className="font-semibold mt-1 tracking-wide uppercase"
            style={{
              color: fillColor,
              fontSize: size < 160 ? '0.6rem' : '0.7rem',
            }}
          >
            {level} Risk
          </span>
        </div>
      </div>
    </div>
  );
}

import { useEffect, useState } from 'react';

interface RiskGaugeProps {
  score: number;
  level: 'Low' | 'Medium' | 'High';
  size?: number;
}

export function RiskGauge({ score, level, size = 180 }: RiskGaugeProps) {
  const [animatedScore, setAnimatedScore] = useState(0);
  const [animatedDash, setAnimatedDash] = useState(0);

  const strokeWidth = 14;
  const radius = (size - strokeWidth) / 2;
  // Arc spans 270 degrees (from 135° to 405°), leaving a 90° gap at the bottom
  const arcAngle = 270;
  const circumference = 2 * Math.PI * radius;
  const arcLength = (arcAngle / 360) * circumference;
  const gapLength = circumference - arcLength;

  const trackColor = '#1a2029';
  const fillColor =
    level === 'Low' ? '#22c55e' : level === 'Medium' ? '#eab308' : '#ef4444';
  const glowColor =
    level === 'Low'
      ? 'rgba(34,197,94,0.4)'
      : level === 'Medium'
        ? 'rgba(234,179,8,0.4)'
        : 'rgba(239,68,68,0.4)';

  // Rotation so the arc starts at bottom-left (135deg)
  const rotation = 135;

  useEffect(() => {
    // Count-up animation for the number
    let start = 0;
    const duration = 1200;
    const step = 16; // ~60fps
    const increment = score / (duration / step);
    const timer = setInterval(() => {
      start += increment;
      if (start >= score) {
        start = score;
        clearInterval(timer);
      }
      setAnimatedScore(Math.round(start));
      setAnimatedDash((start / 100) * arcLength);
    }, step);
    return () => clearInterval(timer);
  }, [score, arcLength]);

  const filledDash = animatedDash;
  const remainingDash = arcLength - filledDash + gapLength;

  return (
    <div className="flex flex-col items-center">
      <div className="relative" style={{ width: size, height: size }}>
        {/* Glow effect behind the gauge */}
        <div
          className="absolute inset-0 rounded-full pointer-events-none transition-all duration-700"
          style={{
            boxShadow: `0 0 ${animatedScore > 0 ? '40px' : '0px'} ${glowColor}`,
          }}
        />

        <svg
          width={size}
          height={size}
          style={{ transform: `rotate(${rotation}deg)` }}
        >
          <defs>
            <filter id="gaugeGlow">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
            <linearGradient id="gaugeGrad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop
                offset="0%"
                stopColor={
                  level === 'Low'
                    ? '#4ade80'
                    : level === 'Medium'
                      ? '#facc15'
                      : '#f87171'
                }
              />
              <stop offset="100%" stopColor={fillColor} />
            </linearGradient>
          </defs>

          {/* Track (background arc) */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={trackColor}
            strokeWidth={strokeWidth}
            strokeDasharray={`${arcLength} ${gapLength}`}
            strokeLinecap="round"
          />

          {/* Filled arc */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="url(#gaugeGrad)"
            strokeWidth={strokeWidth}
            strokeDasharray={`${filledDash} ${remainingDash}`}
            strokeLinecap="round"
            filter="url(#gaugeGlow)"
            style={{ transition: 'stroke-dasharray 0.05s linear' }}
          />
        </svg>

        {/* Center content */}
        <div
          className="absolute inset-0 flex flex-col items-center justify-center"
          style={{ transform: `rotate(-${rotation}deg)` }}
        >
          <span
            className="text-4xl font-bold tabular-nums transition-colors duration-700"
            style={{ color: fillColor }}
          >
            {animatedScore}
          </span>
          <span className="text-xs text-gray-500 mt-0.5 font-medium">/ 100</span>
          <span
            className="text-xs font-semibold mt-1 tracking-wide uppercase"
            style={{ color: fillColor }}
          >
            {level} Risk
          </span>
        </div>
      </div>

      {/* Tick labels */}
      <div className="flex justify-between w-full mt-1 px-3">
        <span className="text-xs text-gray-600">0</span>
        <span className="text-xs text-gray-600">50</span>
        <span className="text-xs text-gray-600">100</span>
      </div>
    </div>
  );
}

import React from 'react';
import Svg, { Line, Path, Rect } from 'react-native-svg';

// Custom icons drawn in the same 24x24, stroke-based style as lucide-react-native.

// Bathroom scale: square platform with a dial window and needle.
export function BathroomScaleIcon({ size = 24, color = '#000', strokeWidth = 2 }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
      <Rect x={3} y={3} width={18} height={18} rx={4} />
      <Path d="M7.5 10.5a4.5 4.5 0 0 1 9 0Z" />
      <Line x1={12} y1={10.5} x2={13.6} y2={7.6} />
    </Svg>
  );
}

// Calendar with a blood drop on the page.
export function PeriodCalendarIcon({ size = 24, color = '#000', dropColor = '#f87171', strokeWidth = 2 }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
      <Rect x={3} y={4} width={18} height={17} rx={2} />
      <Line x1={8} y1={2} x2={8} y2={6} />
      <Line x1={16} y1={2} x2={16} y2={6} />
      <Line x1={3} y1={9} x2={21} y2={9} />
      <Path d="M12 11C12 11 9 14.4 9 16.3a3 3 0 0 0 6 0C15 14.4 12 11 12 11Z" fill={dropColor} stroke={dropColor} strokeWidth={1} />
    </Svg>
  );
}

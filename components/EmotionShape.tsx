import React, { useEffect, useState } from 'react';
import Svg, { Path, Ellipse, Circle, G } from 'react-native-svg';

type ShapeKind = 'blob' | 'star' | 'cross' | 'heart' | 'flower' | 'burst';
type ShapeColor = 'pink' | 'yellow' | 'blue' | 'green';

const paths: Record<ShapeKind, string> = {
  blob:   'M48 6c18 0 38 9 42 28s-7 38-24 47-44 9-54-8S2 36 16 20 30 6 48 6Z',
  star:   'M50 4l11 26 28 3-21 19 6 28-24-14-24 14 6-28L11 33l28-3z',
  cross:  'M38 6h24v32h32v24H62v32H38V62H6V38h32z',
  heart:  'M50 86C18 64 8 44 8 28 8 14 18 6 30 6c8 0 16 5 20 13 4-8 12-13 20-13 12 0 22 8 22 22 0 16-10 36-42 58Z',
  flower: 'M50 8c8-6 22-2 22 12 14-2 22 12 14 22 8 8 2 24-12 22-2 14-22 14-24 0-14 2-22-14-12-22-6-10 2-24 14-22 2-14 18-18 22-12Z',
  burst:  'M50 4l8 22 22-12-12 22 22 8-22 8 12 22-22-12-8 22-8-22-22 12 12-22-22-8 22-8-12-22 22 12z',
};

const fills: Record<ShapeColor, string> = {
  pink:   '#FAB2D3',
  yellow: '#FAD957',
  blue:   '#A5CCF4',
  green:  '#96C979',
};

export function EmotionShape({
  kind = 'blob',
  color = 'pink',
  size = 80,
  rotate = 0,
  eyes = true,
  style,
}: {
  kind?: ShapeKind;
  color?: ShapeColor;
  size?: number;
  rotate?: number;
  eyes?: boolean;
  style?: object;
}) {
  // ry=8 → ojos abiertos | ry=0.5 → parpadeo
  const [eyeRy, setEyeRy] = useState(8);

  useEffect(() => {
    if (!eyes) return;

    const blink = () => {
      setEyeRy(0.5);                              // cierra
      setTimeout(() => setEyeRy(8), 120);         // abre 120ms después
    };

    // Parpadea a los 4.5s, luego repite
    const interval = setInterval(blink, 4500);
    return () => clearInterval(interval);
  }, [eyes]);

  return (
    <Svg
      viewBox="0 0 100 100"
      width={size}
      height={size}
      style={[{ transform: [{ rotate: `${rotate}deg` }] }, style]}
    >
      <Path d={paths[kind]} fill={fills[color]} />
      {eyes && (
        <G>
          <Ellipse cx="40" cy="46" rx="6" ry={eyeRy} fill="#1a1a1a" />
          <Ellipse cx="60" cy="46" rx="6" ry={eyeRy} fill="#1a1a1a" />
          {/* Brillo solo visible cuando los ojos están abiertos */}
          {eyeRy > 1 && (
            <>
              <Circle cx="42" cy="43" r="2" fill="#fff" />
              <Circle cx="62" cy="43" r="2" fill="#fff" />
            </>
          )}
        </G>
      )}
    </Svg>
  );
}

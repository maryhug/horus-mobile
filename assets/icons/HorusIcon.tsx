import React from 'react';
import { SvgXml } from 'react-native-svg';
import { HORUS_ICONS, HorusIconName } from './paths';

export interface HorusIconProps {
  /** Semantic icon name from the Horus registry */
  name: HorusIconName;
  /** Square size in px. Use the size tokens: 16 / 20 / 24 / 28 / 32 / 48. */
  size?: number;
  /** Any color token. Defaults to currentColor → inherits text color. */
  color?: string;
}

/**
 * The ONLY way icons should enter the Horus app.
 * Never import from @expo/vector-icons again — every glyph lives in the registry.
 *
 *   <HorusIcon name="heart" size={24} color={colors.accent} />
 */
export function HorusIcon({ name, size = 24, color = '#2E2E2E' }: HorusIconProps) {
  const def = HORUS_ICONS[name];
  if (!def) {
    if (__DEV__) console.warn('[HorusIcon] unknown icon: ' + name);
    return null;
  }
  const attrs = def.filled
    ? 'fill="' + color + '" stroke="none"'
    : 'fill="none" stroke="' + color + '" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"';
  const xml =
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" ' + attrs + '>' +
    def.body.replace(/currentColor/g, color) +
    '</svg>';
  return <SvgXml xml={xml} width={size} height={size} />;
}

export default HorusIcon;

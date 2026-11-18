/**
 * Settled Up / Handshake Illustration
 * Used for "All settled!" success state
 */

import React from 'react';
import Svg, { Defs, LinearGradient, Stop, Path, Circle, G } from 'react-native-svg';

interface SettledUpProps {
  width?: number;
  height?: number;
}

export const SettledUp: React.FC<SettledUpProps> = ({ 
  width = 160, 
  height = 160 
}) => {
  return (
    <Svg width={width} height={height} viewBox="0 0 160 160" fill="none">
      <Defs>
        {/* Skin tone gradient */}
        <LinearGradient id="skin1" x1="0%" y1="0%" x2="100%" y2="100%">
          <Stop offset="0%" stopColor="#FFE0BD" stopOpacity="1" />
          <Stop offset="100%" stopColor="#FFCC9E" stopOpacity="1" />
        </LinearGradient>
        
        <LinearGradient id="skin2" x1="0%" y1="0%" x2="100%" y2="100%">
          <Stop offset="0%" stopColor="#F4C2A6" stopOpacity="1" />
          <Stop offset="100%" stopColor="#E6B099" stopOpacity="1" />
        </LinearGradient>
        
        {/* Gold coin gradient */}
        <LinearGradient id="coinGold" x1="0%" y1="0%" x2="100%" y2="100%">
          <Stop offset="0%" stopColor="#FFD700" stopOpacity="1" />
          <Stop offset="100%" stopColor="#FFC700" stopOpacity="1" />
        </LinearGradient>
      </Defs>
      
      <G transform="translate(20, 40)">
        {/* Left hand */}
        <Path
          d="M 10 60 L 15 45 L 20 40 L 30 40 L 40 45 L 50 55"
          fill="url(#skin1)"
          stroke="#D4A574"
          strokeWidth="2"
          strokeLinejoin="round"
        />
        <Path
          d="M 15 45 L 20 45 L 25 40 L 30 42"
          fill="url(#skin1)"
          stroke="#D4A574"
          strokeWidth="1.5"
        />
        
        {/* Right hand */}
        <Path
          d="M 110 60 L 105 45 L 100 40 L 90 40 L 80 45 L 70 55"
          fill="url(#skin2)"
          stroke="#C89A70"
          strokeWidth="2"
          strokeLinejoin="round"
        />
        <Path
          d="M 105 45 L 100 45 L 95 40 L 90 42"
          fill="url(#skin2)"
          stroke="#C89A70"
          strokeWidth="1.5"
        />
        
        {/* Handshake middle */}
        <Path
          d="M 50 55 L 55 50 L 65 50 L 70 55"
          fill="url(#skin1)"
          stroke="#D4A574"
          strokeWidth="2"
        />
        
        {/* Coin above handshake */}
        <G transform="translate(35, 10)">
          <Circle cx="25" cy="15" r="15" fill="url(#coinGold)" />
          <Circle cx="25" cy="15" r="12" fill="none" stroke="#FFB700" strokeWidth="1.5" />
          
          {/* Rupee symbol */}
          <Path
            d="M 20 10 L 20 12 L 18 12 L 18 13 L 20 13 Q 22 13, 23 15 Q 24 17, 23 19 L 18 19 L 18 20 L 20 20 L 24 24 L 26 24 L 22 20 Q 25 20, 26 17 Q 27 14, 25 12 L 28 12 L 28 11 L 20 11 L 20 10 Z"
            fill="#B8860B"
          />
        </G>
        
        {/* Sparkles */}
        <Circle cx="20" cy="25" r="2" fill="#FFD700" opacity="0.8" />
        <Circle cx="100" cy="30" r="2" fill="#FFD700" opacity="0.8" />
        <Path d="M 60 5 L 62 7 L 60 9 L 58 7 Z" fill="#FFE87C" />
        <Path d="M 45 70 L 47 72 L 45 74 L 43 72 Z" fill="#FFE87C" />
      </G>
    </Svg>
  );
};

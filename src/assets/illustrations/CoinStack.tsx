/**
 * 3D Coin Stack Illustration
 * Used on Home screen to show balance visually
 */

import React from 'react';
import Svg, { Defs, LinearGradient, Stop, Ellipse, Path, G } from 'react-native-svg';

interface CoinStackProps {
  width?: number;
  height?: number;
  color?: string;
}

export const CoinStack: React.FC<CoinStackProps> = ({ 
  width = 120, 
  height = 120,
  color = '#FFD700' 
}) => {
  return (
    <Svg width={width} height={height} viewBox="0 0 120 120" fill="none">
      <Defs>
        {/* Gold gradient for coins */}
        <LinearGradient id="coinGold" x1="0%" y1="0%" x2="100%" y2="100%">
          <Stop offset="0%" stopColor="#FFD700" stopOpacity="1" />
          <Stop offset="50%" stopColor="#FFC700" stopOpacity="1" />
          <Stop offset="100%" stopColor="#FFB700" stopOpacity="1" />
        </LinearGradient>
        
        {/* Shine gradient */}
        <LinearGradient id="coinShine" x1="0%" y1="0%" x2="100%" y2="0%">
          <Stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.3" />
          <Stop offset="50%" stopColor="#FFFFFF" stopOpacity="0.6" />
          <Stop offset="100%" stopColor="#FFFFFF" stopOpacity="0.3" />
        </LinearGradient>
        
        {/* Shadow gradient */}
        <LinearGradient id="coinShadow" x1="0%" y1="0%" x2="0%" y2="100%">
          <Stop offset="0%" stopColor="#000000" stopOpacity="0.2" />
          <Stop offset="100%" stopColor="#000000" stopOpacity="0.4" />
        </LinearGradient>
      </Defs>
      
      <G>
        {/* Shadow base */}
        <Ellipse cx="60" cy="105" rx="40" ry="8" fill="url(#coinShadow)" opacity="0.3" />
        
        {/* Bottom coin */}
        <Ellipse cx="60" cy="85" rx="35" ry="10" fill="url(#coinGold)" />
        <Ellipse cx="60" cy="85" rx="30" ry="8" fill="url(#coinShine)" />
        <Path 
          d="M 25 85 Q 25 95, 60 95 Q 95 95, 95 85" 
          fill="url(#coinShadow)" 
          opacity="0.3"
        />
        
        {/* Middle coin */}
        <Ellipse cx="60" cy="70" rx="35" ry="10" fill="url(#coinGold)" />
        <Ellipse cx="60" cy="70" rx="30" ry="8" fill="url(#coinShine)" />
        <Path 
          d="M 25 70 Q 25 80, 60 80 Q 95 80, 95 70" 
          fill="url(#coinShadow)" 
          opacity="0.3"
        />
        
        {/* Top coin with Rupee symbol */}
        <Ellipse cx="60" cy="55" rx="35" ry="10" fill="url(#coinGold)" />
        <Ellipse cx="60" cy="55" rx="30" ry="8" fill="url(#coinShine)" />
        
        {/* Rupee symbol ₹ */}
        <G transform="translate(48, 48)">
          <Path
            d="M 8 0 L 8 3 L 4 3 L 4 5 L 8 5 Q 12 5, 14 8 Q 16 11, 14 14 L 4 14 L 4 16 L 8 16 L 16 22 L 20 22 L 11 16 Q 16 16, 18 12 Q 20 8, 16 4 L 20 4 L 20 2 L 8 2 L 8 0 Z"
            fill="#B8860B"
            stroke="#8B6914"
            strokeWidth="0.5"
          />
        </G>
        
        {/* Sparkle effects */}
        <Path d="M 25 45 L 27 47 L 25 49 L 23 47 Z" fill="#FFE87C" opacity="0.8" />
        <Path d="M 90 60 L 92 62 L 90 64 L 88 62 Z" fill="#FFE87C" opacity="0.8" />
        <Path d="M 40 35 L 41 36 L 40 37 L 39 36 Z" fill="#FFFFFF" opacity="0.6" />
      </G>
    </Svg>
  );
};

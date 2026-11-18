/**
 * Empty Wallet / Piggy Bank Illustration
 * Used for "No groups yet" empty state
 */

import React from 'react';
import Svg, { Defs, LinearGradient, Stop, Path, Circle, Ellipse, G } from 'react-native-svg';

interface EmptyWalletProps {
  width?: number;
  height?: number;
}

export const EmptyWallet: React.FC<EmptyWalletProps> = ({ 
  width = 160, 
  height = 160 
}) => {
  return (
    <Svg width={width} height={height} viewBox="0 0 160 160" fill="none">
      <Defs>
        {/* Piggy pink gradient */}
        <LinearGradient id="piggyPink" x1="0%" y1="0%" x2="100%" y2="100%">
          <Stop offset="0%" stopColor="#FFB6C1" stopOpacity="1" />
          <Stop offset="100%" stopColor="#FF85A2" stopOpacity="1" />
        </LinearGradient>
        
        {/* Shine */}
        <LinearGradient id="piggyShine" x1="0%" y1="0%" x2="100%" y2="0%">
          <Stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.5" />
          <Stop offset="100%" stopColor="#FFFFFF" stopOpacity="0.1" />
        </LinearGradient>
      </Defs>
      
      <G transform="translate(30, 40)">
        {/* Shadow */}
        <Ellipse cx="50" cy="85" rx="45" ry="8" fill="#000000" opacity="0.15" />
        
        {/* Body */}
        <Ellipse cx="50" cy="50" rx="40" ry="35" fill="url(#piggyPink)" />
        <Ellipse cx="50" cy="45" rx="35" ry="25" fill="url(#piggyShine)" opacity="0.4" />
        
        {/* Legs */}
        <Ellipse cx="35" cy="75" rx="6" ry="10" fill="url(#piggyPink)" />
        <Ellipse cx="65" cy="75" rx="6" ry="10" fill="url(#piggyPink)" />
        
        {/* Coin slot */}
        <Path
          d="M 35 25 L 65 25 L 63 30 L 37 30 Z"
          fill="#D5698F"
        />
        
        {/* Snout */}
        <Ellipse cx="50" cy="55" rx="12" ry="8" fill="#FFD0DC" />
        <Circle cx="46" cy="55" r="2" fill="#D5698F" />
        <Circle cx="54" cy="55" r="2" fill="#D5698F" />
        
        {/* Eye */}
        <Circle cx="55" cy="42" r="3" fill="#2C2C2C" />
        <Circle cx="56" cy="41" r="1" fill="#FFFFFF" />
        
        {/* Ear */}
        <Ellipse cx="75" cy="35" rx="8" ry="12" fill="url(#piggyPink)" />
        
        {/* Tail */}
        <Path
          d="M 85 50 Q 90 45, 95 50 Q 100 55, 95 60"
          stroke="url(#piggyPink)"
          strokeWidth="4"
          fill="none"
          strokeLinecap="round"
        />
        
        {/* Question mark above */}
        <G transform="translate(40, -10)">
          <Path
            d="M 10 0 Q 15 0, 17 5 Q 19 10, 15 13 L 13 15 L 13 20 M 13 25 L 13 27"
            stroke="#B0B0B0"
            strokeWidth="3"
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </G>
      </G>
    </Svg>
  );
};

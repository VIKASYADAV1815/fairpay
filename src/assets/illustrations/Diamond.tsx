/**
 * 3D Diamond Illustration
 * Used on Pro/Premium screen
 */

import React, { useEffect } from 'react';
import Svg, { Defs, LinearGradient, Stop, Path, G, Polygon } from 'react-native-svg';
import Animated, {
  useSharedValue,
  useAnimatedProps,
  withRepeat,
  withTiming,
  Easing,
} from 'react-native-reanimated';

interface DiamondProps {
  width?: number;
  height?: number;
  animate?: boolean;
  color?: string;
}

const AnimatedG = Animated.createAnimatedComponent(G);

export const Diamond: React.FC<DiamondProps> = ({ 
  width = 200, 
  height = 200,
  animate = false,
  color = '#00A3FF'
}) => {
  const rotation = useSharedValue(0);

  useEffect(() => {
    if (animate) {
      rotation.value = withRepeat(
        withTiming(360, {
          duration: 8000,
          easing: Easing.linear,
        }),
        -1,
        false
      );
    }
  }, [animate]);

  const animatedProps = useAnimatedProps(() => ({
    transform: [{ rotate: `${rotation.value}deg` }],
  }));

  return (
    <Svg width={width} height={height} viewBox="0 0 200 200" fill="none">
      <Defs>
        {/* Main diamond gradient */}
        <LinearGradient id="diamondMain" x1="0%" y1="0%" x2="100%" y2="100%">
          <Stop offset="0%" stopColor="#00D4FF" stopOpacity="1" />
          <Stop offset="50%" stopColor="#00A3FF" stopOpacity="1" />
          <Stop offset="100%" stopColor="#0088CC" stopOpacity="1" />
        </LinearGradient>
        
        {/* Light facets */}
        <LinearGradient id="diamondLight" x1="0%" y1="0%" x2="100%" y2="0%">
          <Stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.4" />
          <Stop offset="100%" stopColor="#FFFFFF" stopOpacity="0.8" />
        </LinearGradient>
        
        {/* Dark facets */}
        <LinearGradient id="diamondDark" x1="0%" y1="100%" x2="100%" y2="0%">
          <Stop offset="0%" stopColor="#0066AA" stopOpacity="1" />
          <Stop offset="100%" stopColor="#0088CC" stopOpacity="1" />
        </LinearGradient>
        
        {/* Glow */}
        <LinearGradient id="diamondGlow" x1="50%" y1="0%" x2="50%" y2="100%">
          <Stop offset="0%" stopColor="#00D4FF" stopOpacity="0.6" />
          <Stop offset="100%" stopColor="#00A3FF" stopOpacity="0" />
        </LinearGradient>
      </Defs>
      
      <AnimatedG {...(animate ? animatedProps : {})}>
        {/* Glow effect */}
        <Path
          d="M 100 20 L 180 100 L 100 180 L 20 100 Z"
          fill="url(#diamondGlow)"
          opacity="0.3"
        />
        
        {/* Top facets (lighter) */}
        <Polygon
          points="100,40 140,100 100,80"
          fill="url(#diamondLight)"
        />
        <Polygon
          points="100,40 60,100 100,80"
          fill="url(#diamondDark)"
        />
        <Polygon
          points="100,40 140,60 140,100"
          fill="url(#diamondMain)"
        />
        <Polygon
          points="100,40 60,60 60,100"
          fill="url(#diamondDark)"
        />
        
        {/* Middle section */}
        <Polygon
          points="60,100 100,80 140,100"
          fill="url(#diamondMain)"
        />
        
        {/* Bottom facets (darker) */}
        <Polygon
          points="100,80 60,100 100,160"
          fill="url(#diamondDark)"
        />
        <Polygon
          points="100,80 140,100 100,160"
          fill="url(#diamondMain)"
        />
        
        {/* Shine line */}
        <Path
          d="M 85 45 L 115 75"
          stroke="#FFFFFF"
          strokeWidth="2"
          strokeLinecap="round"
          opacity="0.8"
        />
        
        {/* Sparkles */}
        <G opacity="0.9">
          <Path d="M 40 60 L 42 62 L 40 64 L 38 62 Z" fill="#FFFFFF" />
          <Path d="M 160 80 L 162 82 L 160 84 L 158 82 Z" fill="#FFFFFF" />
          <Path d="M 120 30 L 122 32 L 120 34 L 118 32 Z" fill="#FFFFFF" />
          <Path d="M 80 150 L 82 152 L 80 154 L 78 152 Z" fill="#FFFFFF" />
        </G>
      </AnimatedG>
    </Svg>
  );
};

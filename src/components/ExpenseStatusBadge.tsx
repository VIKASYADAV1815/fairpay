import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useColors } from '@/store/theme';
import { type } from '@/theme/tokens';

type PaymentStatus = 'all-paid' | 'partial' | 'pending';

type Props = {
  paidCount: number;
  totalCount: number;
  size?: 'small' | 'medium';
};

export function ExpenseStatusBadge({ paidCount, totalCount, size = 'small' }: Props) {
  const c = useColors();
  
  const status: PaymentStatus = 
    paidCount === totalCount ? 'all-paid' :
    paidCount > 0 ? 'partial' : 'pending';

  const config = {
    'all-paid': {
      icon: 'checkmark-circle' as const,
      color: '#10B981', // Green
      bgColor: 'rgba(16, 185, 129, 0.1)',
      label: 'All paid',
    },
    partial: {
      icon: 'radio-button-on' as const, // Changed from ellipse-half
      color: '#F59E0B', // Amber
      bgColor: 'rgba(245, 158, 11, 0.1)',
      label: `${paidCount}/${totalCount} paid`,
    },
    pending: {
      icon: 'ellipse-outline' as const,
      color: '#6B7280', // Gray
      bgColor: 'rgba(107, 114, 128, 0.1)',
      label: 'Pending',
    },
  };

  const { icon, color, bgColor, label } = config[status];
  const iconSize = size === 'small' ? 14 : 18;
  const textStyle = size === 'small' ? styles.labelSmall : styles.labelMedium;

  return (
    <View style={[styles.container, { backgroundColor: bgColor }]}>
      <Ionicons name={icon} size={iconSize} color={color} />
      <Text style={[textStyle, { color }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  labelSmall: {
    ...type.caption2,
    fontWeight: '700',
  },
  labelMedium: {
    ...type.caption1,
    fontWeight: '700',
  },
});

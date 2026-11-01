import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useColors } from '@/store/theme';
import { SoftCard } from '@/components/SoftCard';
import { space, type } from '@/theme/tokens';

type EmptyStateType = 
  | 'no-expenses'
  | 'no-groups'
  | 'no-members'
  | 'no-filtered-expenses'
  | 'no-history';

type Props = {
  type: EmptyStateType;
  onAction?: () => void;
  actionLabel?: string;
};

export function EmptyState({ type, onAction, actionLabel }: Props) {
  const c = useColors();

  const config = {
    'no-expenses': {
      icon: 'receipt-outline' as const,
      title: 'No expenses yet',
      subtitle: 'Log your first shared expense to start tracking',
      examples: [
        { icon: '🍕', title: 'Pizza dinner', amount: '₹800', people: '4 friends' },
        { icon: '🚗', title: 'Uber ride', amount: '₹350', people: '3 people' },
        { icon: '🏨', title: 'Hotel stay', amount: '₹4,500', people: '2 people' },
      ],
      action: actionLabel || 'Add First Expense',
    },
    'no-groups': {
      icon: 'people-outline' as const,
      title: 'No groups yet',
      subtitle: 'Create a group to track shared expenses with friends',
      examples: [
        { icon: '✈️', title: 'Weekend Trip', amount: '₹12,000', people: '5 friends' },
        { icon: '🏠', title: 'Flatmates', amount: '₹8,000/mo', people: '3 people' },
        { icon: '🎉', title: 'Party Fund', amount: '₹3,500', people: '8 people' },
      ],
      action: actionLabel || 'Create First Group',
    },
    'no-members': {
      icon: 'person-add-outline' as const,
      title: 'Add people to split',
      subtitle: 'You need at least 2 people to split expenses',
      examples: [
        { icon: '👤', title: 'Add from contacts', amount: '', people: '' },
        { icon: '📱', title: 'Share invite link', amount: '', people: '' },
        { icon: '🔗', title: 'Generate QR code', amount: '', people: '' },
      ],
      action: actionLabel || 'Add People',
    },
    'no-filtered-expenses': {
      icon: 'search-outline' as const,
      title: 'No expenses match',
      subtitle: 'Try adjusting your filters or search term',
      examples: [],
      action: actionLabel || 'Clear Filters',
    },
    'no-history': {
      icon: 'time-outline' as const,
      title: 'No payment history',
      subtitle: 'Your settled and paid expenses will appear here',
      examples: [],
      action: actionLabel || 'Go to Groups',
    },
  };

  const { icon, title, subtitle, examples, action } = config[type];

  return (
    <View style={styles.container}>
      {/* Icon */}
      <View style={[styles.iconCircle, { backgroundColor: c.fill }]}>
        <Ionicons name={icon} size={40} color={c.textSecondary} />
      </View>

      {/* Title & Subtitle */}
      <Text style={[styles.title, { color: c.text }]}>{title}</Text>
      <Text style={[styles.subtitle, { color: c.textSecondary }]}>{subtitle}</Text>

      {/* Example Cards */}
      {examples.length > 0 && (
        <View style={styles.examples}>
          {examples.map((example, index) => (
            <SoftCard key={index} style={styles.exampleCard}>
              <View style={styles.exampleLeft}>
                <Text style={styles.exampleIcon}>{example.icon}</Text>
                <View style={styles.exampleText}>
                  <Text style={[styles.exampleTitle, { color: c.textTertiary }]}>
                    {example.title}
                  </Text>
                  {example.people && (
                    <Text style={[styles.exampleMeta, { color: c.textTertiary }]}>
                      {example.people}
                    </Text>
                  )}
                </View>
              </View>
              {example.amount && (
                <Text style={[styles.exampleAmount, { color: c.textTertiary }]}>
                  {example.amount}
                </Text>
              )}
            </SoftCard>
          ))}
        </View>
      )}

      {/* Action Button */}
      {onAction && (
        <Pressable
          onPress={onAction}
          style={[styles.actionBtn, { backgroundColor: c.accent }]}
        >
          <Text style={[styles.actionText, { color: c.accentInk }]}>{action}</Text>
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    paddingVertical: space.xxxl,
    paddingHorizontal: space.xl,
  },
  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: space.lg,
  },
  title: {
    ...type.title3,
    textAlign: 'center',
    marginBottom: space.xs,
  },
  subtitle: {
    ...type.footnote,
    textAlign: 'center',
    marginBottom: space.xl,
    maxWidth: 280,
  },
  examples: {
    width: '100%',
    gap: space.sm,
    marginBottom: space.xl,
  },
  exampleCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    opacity: 0.5,
  },
  exampleLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    flex: 1,
  },
  exampleIcon: {
    fontSize: 24,
  },
  exampleText: {
    flex: 1,
  },
  exampleTitle: {
    ...type.subheadline,
  },
  exampleMeta: {
    ...type.caption1,
    marginTop: 2,
  },
  exampleAmount: {
    ...type.headline,
  },
  actionBtn: {
    paddingHorizontal: space.xl,
    paddingVertical: space.md,
    borderRadius: 12,
    minWidth: 200,
    alignItems: 'center',
  },
  actionText: {
    ...type.subheadline,
    fontWeight: '700',
  },
});

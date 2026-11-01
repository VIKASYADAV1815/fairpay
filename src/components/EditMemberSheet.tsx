import { useState } from 'react';
import { View, Text, TextInput, Alert, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { BottomSheetModal, BottomSheetView, BottomSheetBackdrop } from '@gorhom/bottom-sheet';
import { Ionicons } from '@expo/vector-icons';
import { useColors } from '@/store/theme';
import { useTripStore, memberPayMethod } from '@/store/trips';
import type { Member, Trip } from '@/store/trips';
import { PrimaryButton } from './PrimaryButton';

type Props = {
  sheetRef: React.RefObject<BottomSheetModal | null>;
  trip: Trip;
  member: Member;
};

export function EditMemberSheet({ sheetRef, trip, member }: Props) {
  const c = useColors();
  const updateMember = useTripStore((s) => s.updateMember);
  const removeMember = useTripStore((s) => s.removeMember);

  const [name, setName] = useState(member.name);
  const payMethod = memberPayMethod(member);
  const [handle, setHandle] = useState(payMethod?.handle || '');

  // Validation: Check if member has unpaid expenses
  const memberExpenses = trip.expenses.filter((e) =>
    e.splits.some((s) => s.memberId === member.id && !s.isPaid)
  );
  const hasUnpaidExpenses = memberExpenses.length > 0;
  const canRemove = trip.members.length > 2 && !hasUnpaidExpenses;

  const handleSave = () => {
    const trimmed = name.trim();
    if (!trimmed) {
      Alert.alert('Missing Name', 'Please enter a name');
      return;
    }

    const handleTrimmed = handle.trim();
    updateMember(trip.id, member.id, {
      name: trimmed,
      paymentMethods: handleTrimmed
        ? [{ rail: 'upi', handle: handleTrimmed }]
        : [],
    });
    sheetRef.current?.dismiss();
  };

  const handleRemove = () => {
    if (!canRemove) {
      if (trip.members.length <= 2) {
        Alert.alert(
          'Cannot Remove',
          'You need at least 2 members in a group',
          [{ text: 'OK' }]
        );
      } else if (hasUnpaidExpenses) {
        Alert.alert(
          'Cannot Remove',
          `${member.name} has ${memberExpenses.length} unpaid expense${memberExpenses.length > 1 ? 's' : ''}. Settle them first.`,
          [{ text: 'OK' }]
        );
      }
      return;
    }

    Alert.alert(
      'Remove Member',
      `Remove ${member.name} from ${trip.name}? This cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: () => {
            removeMember(trip.id, member.id);
            sheetRef.current?.dismiss();
          },
        },
      ]
    );
  };

  return (
    <BottomSheetModal
      ref={sheetRef}
      snapPoints={['70%']}
      backdropComponent={(props: any) => (
        <BottomSheetBackdrop {...props} disappearsOnIndex={-1} appearsOnIndex={0} />
      )}
      backgroundStyle={{ backgroundColor: c.card }}
      handleIndicatorStyle={{ backgroundColor: c.textSecondary }}
    >
      <BottomSheetView style={{ flex: 1 }}>
        <ScrollView style={[styles.container, { backgroundColor: c.card }]}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={[styles.title, { color: c.text }]}>Edit Member</Text>
          </View>

          {/* Name */}
          <View style={styles.section}>
            <Text style={[styles.label, { color: c.textSecondary }]}>Name</Text>
            <TextInput
              style={[styles.input, { color: c.text, backgroundColor: c.bg, borderColor: c.separator }]}
              value={name}
              onChangeText={setName}
              placeholder="Member name"
              placeholderTextColor={c.textTertiary}
              autoCapitalize="words"
            />
          </View>

          {/* UPI Handle */}
          <View style={styles.section}>
            <Text style={[styles.label, { color: c.textSecondary }]}>UPI ID (Optional)</Text>
            <TextInput
              style={[styles.input, { color: c.text, backgroundColor: c.bg, borderColor: c.separator }]}
              value={handle}
              onChangeText={setHandle}
              placeholder="name@upi"
              placeholderTextColor={c.textTertiary}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>

          {/* Expense History */}
          <View style={styles.section}>
            <Text style={[styles.label, { color: c.textSecondary }]}>
              Expense History
            </Text>
            <View style={[styles.statsBox, { backgroundColor: c.bg }]}>
              <View style={styles.statRow}>
                <Ionicons name="receipt-outline" size={18} color={c.textSecondary} />
                <Text style={[styles.statText, { color: c.text }]}>
                  {trip.expenses.filter((e) => e.paidById === member.id).length} expenses paid
                </Text>
              </View>
              <View style={styles.statRow}>
                <Ionicons
                  name={hasUnpaidExpenses ? 'alert-circle-outline' : 'checkmark-circle-outline'}
                  size={18}
                  color={hasUnpaidExpenses ? '#F59E0B' : c.green}
                />
                <Text style={[styles.statText, { color: c.text }]}>
                  {memberExpenses.length} unpaid expense{memberExpenses.length !== 1 ? 's' : ''}
                </Text>
              </View>
            </View>
          </View>

          {/* Actions */}
          <View style={styles.actions}>
            <PrimaryButton label="Save Changes" onPress={handleSave} />

            <TouchableOpacity
              style={[
                styles.removeButton,
                { borderColor: canRemove ? c.danger : c.separator },
                !canRemove && { opacity: 0.4 },
              ]}
              onPress={handleRemove}
              disabled={!canRemove}
            >
              <Ionicons name="trash-outline" size={20} color={canRemove ? c.danger : c.textTertiary} />
              <Text style={[styles.removeText, { color: canRemove ? c.danger : c.textTertiary }]}>
                Remove from Group
              </Text>
            </TouchableOpacity>

            {!canRemove && hasUnpaidExpenses && (
              <Text style={[styles.hint, { color: c.textTertiary }]}>
                Settle unpaid expenses before removing
              </Text>
            )}
            {!canRemove && trip.members.length <= 2 && (
              <Text style={[styles.hint, { color: c.textTertiary }]}>
                Need at least 2 members
              </Text>
            )}
          </View>
        </ScrollView>
      </BottomSheetView>
    </BottomSheetModal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 20,
  },
  header: {
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(128,128,128,0.15)',
    marginBottom: 20,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
  },
  section: {
    marginBottom: 24,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
  },
  statsBox: {
    borderRadius: 12,
    padding: 16,
    gap: 12,
  },
  statRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  statText: {
    fontSize: 15,
  },
  actions: {
    gap: 12,
    paddingBottom: 40,
  },
  removeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderWidth: 2,
    borderRadius: 12,
    paddingVertical: 14,
  },
  removeText: {
    fontSize: 16,
    fontWeight: '600',
  },
  hint: {
    fontSize: 13,
    textAlign: 'center',
    marginTop: -4,
  },
});

import { View, Text, StyleSheet, ScrollView, Pressable, Alert, TextInput, Modal } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { MotiView } from 'moti';
import { ScreenHeader } from '@/components/ScreenHeader';
import { SoftCard } from '@/components/SoftCard';
import { PrimaryButton } from '@/components/PrimaryButton';
import { EmptyArt } from '@/components/EmptyArt';
import { AddCrewSheet } from '@/components/AddCrewSheet';
import { FadeIn } from '@/components/FadeIn';
import { useTripStore, type Member } from '@/store/trips';
import { useColors, useThemeStore } from '@/store/theme';
import { computeBalances } from '@/lib/settle';
import { formatMoney } from '@/lib/currency';
import { formatPayLabel } from '@/lib/payments';
import { memberPayMethod } from '@/store/trips';
import { space, type } from '@/theme/tokens';
import { enter } from '@/theme/motion';

export default function PeopleScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const c = useColors();
  const darkMode = useThemeStore((s) => s.darkMode);
  const trip = useTripStore((s) => s.trips.find((t) => t.id === id));
  const addMember = useTripStore((s) => s.addMember);
  const updateMember = useTripStore((s) => s.updateMember);
  const removeMember = useTripStore((s) => s.removeMember);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Member | null>(null);
  const [editName, setEditName] = useState('');
  const [editUpi, setEditUpi] = useState('');

  if (!trip) {
    return (
      <View style={[styles.screen, { backgroundColor: c.bg, paddingTop: insets.top + space.xl }]}>
        <Text style={[styles.missing, { color: c.text }]}>Group not found</Text>
      </View>
    );
  }

  const balances = computeBalances(trip.members, trip.expenses);

  const openEdit = (memberId: string) => {
    const m = trip.members.find((x) => x.id === memberId);
    if (!m) return;
    setEditing(m);
    setEditName(m.name);
    setEditUpi(m.upiId || '');
  };

  const saveEdit = () => {
    if (!editing || !editName.trim()) return;
    updateMember(trip.id, editing.id, {
      name: editName,
      paymentMethods: editUpi.trim()
        ? [{ rail: 'other', handle: editUpi.trim() }]
        : [],
    });
    setEditing(null);
  };

  const confirmRemove = (memberId: string, name: string) => {
    Alert.alert('Remove person?', name, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: () => removeMember(trip.id, memberId),
      },
    ]);
  };

  return (
    <View style={[styles.screen, { backgroundColor: c.bg, paddingTop: insets.top }]}>
      <ScreenHeader
        title="People"
        right={
          <Pressable onPress={() => setOpen(true)} hitSlop={8}>
            <Ionicons name="person-add-outline" size={22} color={c.text} />
          </Pressable>
        }
      />

      <ScrollView
        contentContainerStyle={{ paddingBottom: insets.bottom + 100 }}
        showsVerticalScrollIndicator={false}
      >
        <FadeIn>
          <Text style={[styles.lead, { color: c.text }]}>{trip.name}</Text>
          <Text style={[styles.sub, { color: c.textSecondary }]}>
            Tap to edit · long-press to remove
          </Text>
        </FadeIn>

        {trip.members.length === 0 ? (
          <SoftCard tone={darkMode ? 'fill' : 'accent'} style={{ alignItems: 'center' }}>
            <EmptyArt kind="people" width={140} height={100} />
            <Text style={[styles.emptyTitle, { color: darkMode ? c.text : c.accentInk }]}>
              No one yet
            </Text>
            <Text
              style={[
                styles.emptyBody,
                { color: darkMode ? c.textSecondary : c.accentInk, textAlign: 'center' },
              ]}
            >
              Add friends so expenses can split fairly.
            </Text>
          </SoftCard>
        ) : (
          balances.map((b, i) => (
            <MotiView
              key={b.memberId}
              from={{ opacity: 0, translateY: 8 }}
              animate={{ opacity: 1, translateY: 0 }}
              transition={enter(50 + i * 40)}
            >
              <Pressable
                onPress={() => openEdit(b.memberId)}
                onLongPress={() => confirmRemove(b.memberId, b.name)}
                delayLongPress={400}
              >
                <SoftCard style={styles.row}>
                  <View style={[styles.avatar, { backgroundColor: c.accent }]}>
                    <Text style={[styles.avatarText, { color: c.accentInk }]}>
                      {b.name.slice(0, 1).toUpperCase()}
                    </Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.name, { color: c.text }]}>{b.name}</Text>
                    <Text style={[styles.meta, { color: c.textSecondary }]}>
                      {formatPayLabel(
                        b.payMethod ??
                          memberPayMethod(
                            trip.members.find((m) => m.id === b.memberId) ?? {
                              id: '',
                              name: '',
                            },
                          ),
                      )}
                    </Text>
                  </View>
                  <Text
                    style={[
                      styles.net,
                      { color: b.net >= 0 ? (darkMode ? c.accent : c.accentInk) : c.danger },
                    ]}
                  >
                    {b.net >= 0 ? '+' : '−'}
                    {formatMoney(Math.abs(b.net), trip.currency).replace(/^[^\d−-]+/, '')}
                  </Text>
                </SoftCard>
              </Pressable>
            </MotiView>
          ))
        )}
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: insets.bottom + space.lg }]}>
        <PrimaryButton label="Add person" variant="accent" onPress={() => setOpen(true)} />
        <PrimaryButton
          label="Go to settle"
          onPress={() => {
            if (trip.members.length < 2) {
              Alert.alert('Need 2+ people', 'Add at least one more person before settling.');
              return;
            }
            router.push({ pathname: '/settle/[id]', params: { id: trip.id } });
          }}
          style={{ marginTop: space.sm }}
        />
      </View>

      <AddCrewSheet
        visible={open}
        members={trip.members}
        onClose={() => setOpen(false)}
        onAdd={(name, upiId) => addMember(trip.id, name, upiId)}
        doneLabel="Done"
        minMembers={2}
      />

      <Modal
        visible={!!editing}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setEditing(null)}
      >
        <View style={[styles.editScreen, { backgroundColor: c.bgGrouped }]}>
          <Text style={[styles.editTitle, { color: c.text }]}>Edit person</Text>
          <SoftCard tone="white" style={styles.field}>
            <TextInput
              value={editName}
              onChangeText={setEditName}
              placeholder="Name"
              placeholderTextColor={c.textTertiary}
              style={[styles.input, { color: c.text }]}
              selectionColor={c.accent}
            />
          </SoftCard>
          <SoftCard tone="white" style={styles.field}>
            <TextInput
              value={editUpi}
              onChangeText={setEditUpi}
              placeholder="Pay handle (UPI / PayPal / …)"
              placeholderTextColor={c.textTertiary}
              style={[styles.input, { color: c.text }]}
              autoCapitalize="none"
              selectionColor={c.accent}
            />
          </SoftCard>
          <PrimaryButton label="Save" variant="accent" onPress={saveEdit} />
          {editing ? (
            <Pressable
              style={styles.removeLink}
              onPress={() => {
                const idToRemove = editing.id;
                const n = editing.name;
                setEditing(null);
                confirmRemove(idToRemove, n);
              }}
            >
              <Text style={{ color: c.danger, ...type.footnote, fontWeight: '700' }}>
                Remove from group
              </Text>
            </Pressable>
          ) : null}
          <Pressable onPress={() => setEditing(null)} style={styles.removeLink}>
            <Text style={{ color: c.textSecondary, ...type.footnote }}>Cancel</Text>
          </Pressable>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, paddingHorizontal: space.xl },
  lead: { ...type.title2 },
  sub: { ...type.footnote, marginTop: 4, marginBottom: space.xl },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    marginBottom: space.sm,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { ...type.subheadline },
  name: { ...type.subheadline },
  meta: { ...type.caption1, marginTop: 2 },
  net: { ...type.headline },
  emptyTitle: { ...type.title3 },
  emptyBody: { ...type.footnote, marginTop: 4, opacity: 0.8 },
  footer: { paddingTop: space.md },
  missing: { ...type.title2 },
  editScreen: { flex: 1, padding: space.xl, paddingTop: space.xxxl },
  editTitle: { ...type.title2, marginBottom: space.xl },
  field: { marginBottom: space.lg, paddingHorizontal: space.lg, paddingVertical: 4 },
  input: { ...type.title3, paddingVertical: space.lg },
  removeLink: { alignItems: 'center', marginTop: space.lg },
});

import { View, Text, StyleSheet, ScrollView, Pressable, Alert } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useState, useRef } from 'react';
import { MotiView } from 'moti';
import { BottomSheetModal } from '@gorhom/bottom-sheet';
import { ScreenHeader } from '@/components/ScreenHeader';
import { SoftCard } from '@/components/SoftCard';
import { PrimaryButton } from '@/components/PrimaryButton';
import { EmptyArt } from '@/components/EmptyArt';
import { AddCrewSheet } from '@/components/AddCrewSheet';
import { EditMemberSheet } from '@/components/EditMemberSheet';
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
  const [addSheetOpen, setAddSheetOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<Member | null>(null);
  const editSheetRef = useRef<BottomSheetModal>(null);

  if (!trip) {
    return (
      <View style={[styles.screen, { backgroundColor: c.bg, paddingTop: insets.top + space.xl }]}>
        <Text style={[styles.missing, { color: c.text }]}>Group not found</Text>
      </View>
    );
  }

  const balances = computeBalances(trip.members, trip.expenses);

  const openEdit = (member: Member) => {
    setEditingMember(member);
    editSheetRef.current?.present();
  };

  return (
    <View style={[styles.screen, { backgroundColor: c.bg, paddingTop: insets.top }]}>
      <ScreenHeader
        title="People"
        right={
          <Pressable onPress={() => setAddSheetOpen(true)} hitSlop={8}>
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
            Tap a person to edit or remove
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
          balances.map((b, i) => {
            const member = trip.members.find((m) => m.id === b.memberId);
            if (!member) return null;
            
            return (
              <MotiView
                key={b.memberId}
                from={{ opacity: 0, translateY: 8 }}
                animate={{ opacity: 1, translateY: 0 }}
                transition={enter(50 + i * 40)}
              >
                <Pressable onPress={() => openEdit(member)}>
                  <SoftCard style={styles.row}>
                    <View style={[styles.avatar, { backgroundColor: c.accent }]}>
                      <Text style={[styles.avatarText, { color: c.accentInk }]}>
                        {b.name.slice(0, 1).toUpperCase()}
                      </Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.name, { color: c.text }]}>{b.name}</Text>
                      <Text style={[styles.meta, { color: c.textSecondary }]}>
                        {formatPayLabel(b.payMethod ?? memberPayMethod(member))}
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
            );
          })
        )}
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: insets.bottom + space.lg }]}>
        <PrimaryButton label="Add person" variant="accent" onPress={() => setAddSheetOpen(true)} />
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
        visible={addSheetOpen}
        members={trip.members}
        onClose={() => setAddSheetOpen(false)}
        onAdd={(name, upiId) => addMember(trip.id, name, upiId)}
        doneLabel="Done"
        minMembers={2}
      />

      {editingMember && (
        <EditMemberSheet
          sheetRef={editSheetRef}
          trip={trip}
          member={editingMember}
        />
      )}
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
});

import { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  Alert,
  Pressable,
  Modal,
  Image,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { ScreenHeader } from '@/components/ScreenHeader';
import { SoftCard } from '@/components/SoftCard';
import { PrimaryButton } from '@/components/PrimaryButton';
import { FadeIn } from '@/components/FadeIn';
import { FairpayMark } from '@/components/FairpayLogo';
import { PaymentBrandLogo } from '@/components/PaymentBrandLogo';
import { useAuthStore } from '@/store/auth';
import { useTripStore } from '@/store/trips';
import { useColors, useThemeStore } from '@/store/theme';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { CURRENCIES, type CurrencyCode } from '@/lib/currency';
import { PAY_RAILS, type PayRail, type PaymentMethod } from '@/lib/payments';
import { COUNTRY_CODES, type CountryCode } from '@/lib/countryCodes';
import { radius, space, type } from '@/theme/tokens';

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const c = useColors();
  const darkMode = useThemeStore((s) => s.darkMode);
  const {
    name: authName,
    phone: authPhone,
    avatar: authAvatar,
    user,
    email,
    preferredCurrency,
    paymentMethods: savedMethods,
    updateProfile,
  } = useAuthStore();
  const updateMember = useTripStore((s) => s.updateMember);
  const trips = useTripStore((s) => s.trips);

  // Parse phone number into country code + local digits
  const getInitialPhoneParts = () => {
    if (!authPhone) return { country: COUNTRY_CODES[0], number: '' };
    const matched = COUNTRY_CODES.find((country) => authPhone.startsWith(country.dialCode));
    if (matched) {
      return {
        country: matched,
        number: authPhone.replace(matched.dialCode, '').replace(/[\s-]/g, ''),
      };
    }
    return { country: COUNTRY_CODES[0], number: authPhone.replace(/[\s-]/g, '') };
  };

  const initial = getInitialPhoneParts();
  const [name, setName] = useState(authName || '');
  const [avatar, setAvatar] = useState(authAvatar || user?.avatar || '');
  const [selectedCountry, setSelectedCountry] = useState<CountryCode>(initial.country);
  const [phoneNumber, setPhoneNumber] = useState(initial.number);
  const [countryPickerVisible, setCountryPickerVisible] = useState(false);
  const [currency, setCurrency] = useState<CurrencyCode>(preferredCurrency);
  const [rail, setRail] = useState<PayRail>(savedMethods[0]?.rail ?? 'upi');
  const [handle, setHandle] = useState(savedMethods[0]?.handle ?? '');

  const pickFromCamera = async () => {
    const { granted } = await ImagePicker.requestCameraPermissionsAsync();
    if (!granted) {
      Alert.alert('Camera Permission', 'Please allow camera access to take a profile picture.');
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (!result.canceled && result.assets[0]?.uri) {
      setAvatar(result.assets[0].uri);
    }
  };

  const pickFromLibrary = async () => {
    const { granted } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!granted) {
      Alert.alert('Photos Permission', 'Please allow photo library access to choose a profile picture.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (!result.canceled && result.assets[0]?.uri) {
      setAvatar(result.assets[0].uri);
    }
  };

  const handleChangePhoto = () => {
    const options: { text: string; style?: 'default' | 'cancel' | 'destructive'; onPress?: () => void }[] = [
      { text: 'Take Photo', onPress: pickFromCamera },
      { text: 'Choose from Library', onPress: pickFromLibrary },
    ];
    if (avatar) {
      options.push({ text: 'Remove Photo', style: 'destructive', onPress: () => setAvatar('') });
    }
    options.push({ text: 'Cancel', style: 'cancel' });

    Alert.alert('Profile Photo', 'Update your photo across your statements & groups', options);
  };

  const save = async () => {
    const fullPhone = phoneNumber.trim() ? `${selectedCountry.dialCode} ${phoneNumber.trim()}` : '';
    const methods: PaymentMethod[] = handle.trim()
      ? [{ rail, handle: handle.trim() }]
      : [];

    updateProfile({
      name: name.trim(),
      phone: fullPhone,
      avatar,
      preferredCurrency: currency,
      paymentMethods: methods,
    });

    if (isSupabaseConfigured() && user?.id) {
      try {
        await supabase
          .from('users')
          .update({
            avatar_url: avatar || null,
            name: name.trim(),
            phone_number: fullPhone || null,
            payment_methods: methods,
            updated_at: new Date().toISOString(),
          })
          .eq('id', user.id);

        await supabase.auth.updateUser({
          data: { avatar_url: avatar || null, picture: avatar || null, name: name.trim() },
        });
      } catch (err) {
        console.warn('Profile sync to Supabase error:', err);
      }
    }

    const prev = authName?.trim().toLowerCase();
    if (prev) {
      trips.forEach((t) => {
        t.members.forEach((m) => {
          if (m.name.trim().toLowerCase() === prev || (user?.id && m.id === user.id)) {
            updateMember(t.id, m.id, { name: name.trim(), avatar, paymentMethods: methods });
          }
        });
      });
    }
    Alert.alert('Saved', 'Profile and photo updated.');
  };

  return (
    <View style={[styles.screen, { backgroundColor: c.bg, paddingTop: insets.top }]}>
      <ScreenHeader title="Profile" />
      <ScrollView
        contentContainerStyle={{ paddingBottom: insets.bottom + space.xxxl }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <FadeIn>
          <View style={styles.avatarBlock}>
            <Pressable
              onPress={handleChangePhoto}
              style={({ pressed }) => [
                styles.avatarTouchArea,
                { opacity: pressed ? 0.88 : 1 },
              ]}
              accessibilityLabel="Change profile photo"
              accessibilityRole="button"
            >
              <View style={[styles.avatarWrap, { borderColor: c.separator, backgroundColor: c.card }]}>
                {avatar ? (
                  <Image source={{ uri: avatar }} style={styles.avatarImg} />
                ) : (
                  <FairpayMark size={76} />
                )}
              </View>
              <View style={[styles.cameraBadge, { backgroundColor: c.accent, borderColor: c.bg }]}>
                <Ionicons name="camera" size={13} color={c.accentInk} />
              </View>
            </Pressable>

            <Pressable onPress={handleChangePhoto} hitSlop={8} style={styles.changeBtn}>
              <Text style={[styles.changeText, { color: c.accent }]}>Change photo</Text>
            </Pressable>

            <Text style={[styles.name, { color: c.text }]}>{name || 'Your name'}</Text>
            <Text style={[styles.hint, { color: c.textSecondary }]}>
              {email || 'Shown to people in your groups'}
            </Text>
          </View>
        </FadeIn>

        {/* Display Name */}
        <Text style={[styles.label, { color: c.textSecondary }]}>Display name</Text>
        <SoftCard tone="fill" style={styles.field}>
          <TextInput
            value={name}
            onChangeText={setName}
            style={[styles.input, { color: c.text }]}
            placeholder="Your name"
            placeholderTextColor={c.textTertiary}
            selectionColor={c.accent}
          />
        </SoftCard>

        {/* Phone with Country Code Selector */}
        <Text style={[styles.label, { color: c.textSecondary }]}>Phone number</Text>
        <View style={styles.phoneRow}>
          <Pressable
            onPress={() => setCountryPickerVisible(true)}
            style={[
              styles.countrySelector,
              { backgroundColor: c.card, borderColor: c.separator },
            ]}
          >
            <Text style={styles.countryFlag}>{selectedCountry.flag}</Text>
            <Text style={[styles.countryDial, { color: c.text }]}>
              {selectedCountry.dialCode}
            </Text>
            <Ionicons name="chevron-down" size={14} color={c.textSecondary} />
          </Pressable>

          <SoftCard tone="fill" style={[styles.field, styles.phoneInputCard]}>
            <TextInput
              value={phoneNumber}
              onChangeText={setPhoneNumber}
              style={[styles.input, { color: c.text }]}
              placeholder="9876543210"
              placeholderTextColor={c.textTertiary}
              keyboardType="phone-pad"
              selectionColor={c.accent}
            />
          </SoftCard>
        </View>

        {/* Preferred Currency */}
        <Text style={[styles.label, { color: c.textSecondary, marginTop: space.sm }]}>Preferred currency</Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chipRow}
        >
          {CURRENCIES.map((cur) => {
            const on = currency === cur.code;
            return (
              <Pressable
                key={cur.code}
                onPress={() => setCurrency(cur.code)}
                style={[
                  styles.chip,
                  { backgroundColor: on ? c.accent : c.fillSecondary },
                ]}
              >
                <Text style={{ color: on ? c.accentInk : c.text, fontWeight: '700' }}>
                  {cur.symbol} {cur.code}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>

        {/* Payment Rails with Brand Logos */}
        <View style={styles.paymentSectionHeader}>
          <Text style={[styles.label, { color: c.textSecondary, marginTop: space.xl, marginBottom: 2 }]}>
            How you get paid
          </Text>
          <Text style={[styles.hintLeft, { color: c.textTertiary }]}>
            Select your preferred app so group members can settle to you in 1-tap.
          </Text>
        </View>

        {/* Payment options carousel with SVG logos */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={[styles.chipRow, { paddingVertical: space.xs }]}
        >
          {PAY_RAILS.map((r) => {
            const on = rail === r.rail;
            return (
              <Pressable
                key={r.rail}
                onPress={() => setRail(r.rail)}
                style={[
                  styles.paymentRailCard,
                  {
                    backgroundColor: on ? (darkMode ? '#1E293B' : '#F0FDF4') : c.card,
                    borderColor: on ? c.accent : c.separator,
                  },
                ]}
              >
                <PaymentBrandLogo brand={r.brand} size={28} />
                <Text
                  style={[
                    styles.paymentRailLabel,
                    { color: on ? c.text : c.textSecondary, fontWeight: on ? '700' : '500' },
                  ]}
                >
                  {r.label}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>

        {/* Handle input */}
        <SoftCard tone="fill" style={[styles.field, { marginTop: space.sm }]}>
          <TextInput
            value={handle}
            onChangeText={setHandle}
            style={[styles.input, { color: c.text }]}
            placeholder={PAY_RAILS.find((r) => r.rail === rail)?.placeholder}
            placeholderTextColor={c.textTertiary}
            autoCapitalize="none"
            selectionColor={c.accent}
          />
        </SoftCard>
        <Text style={[styles.hintLeft, { color: c.textSecondary }]}>
          {PAY_RAILS.find((r) => r.rail === rail)?.hint}
        </Text>

        <View style={{ marginTop: space.xxl }}>
          <PrimaryButton label="Save profile" variant="accent" onPress={save} />
          <Text style={[styles.footnote, { color: c.textTertiary }]}>
            Syncs your name and payment handle across your active groups
          </Text>
        </View>
      </ScrollView>

      {/* Country Code Picker Modal */}
      <Modal
        visible={countryPickerVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setCountryPickerVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalSheet, { backgroundColor: c.card }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: c.text }]}>Select Country Code</Text>
              <Pressable onPress={() => setCountryPickerVisible(false)} hitSlop={10}>
                <Ionicons name="close" size={24} color={c.textSecondary} />
              </Pressable>
            </View>

            <ScrollView style={{ maxHeight: 380 }}>
              {COUNTRY_CODES.map((item) => (
                <Pressable
                  key={`${item.code}-${item.dialCode}`}
                  style={[
                    styles.countryItem,
                    { borderBottomColor: c.separator },
                    selectedCountry.dialCode === item.dialCode && {
                      backgroundColor: c.fillSecondary,
                    },
                  ]}
                  onPress={() => {
                    setSelectedCountry(item);
                    setCountryPickerVisible(false);
                  }}
                >
                  <Text style={styles.countryItemFlag}>{item.flag}</Text>
                  <Text style={[styles.countryItemName, { color: c.text }]}>{item.name}</Text>
                  <Text style={[styles.countryItemDial, { color: c.textSecondary }]}>
                    {item.dialCode}
                  </Text>
                </Pressable>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, paddingHorizontal: space.xl },
  avatarBlock: { alignItems: 'center', marginBottom: space.xxxl },
  avatarTouchArea: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarWrap: {
    width: 84,
    height: 84,
    borderRadius: 42,
    borderWidth: 1.5,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarImg: {
    width: 84,
    height: 84,
    borderRadius: 42,
  },
  cameraBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  changeBtn: {
    marginTop: 8,
    paddingVertical: 2,
    paddingHorizontal: 8,
  },
  changeText: {
    ...type.caption1,
    fontWeight: '600',
  },
  name: { ...type.title2, marginTop: space.sm },
  hint: { ...type.caption1, marginTop: 4 },
  hintLeft: { ...type.caption1, marginBottom: space.sm, marginLeft: 4 },
  label: {
    ...type.footnote,
    marginBottom: space.sm,
    marginLeft: 4,
  },
  field: { marginBottom: space.lg, paddingVertical: 4, paddingHorizontal: space.lg },
  input: { ...type.title3, paddingVertical: space.lg },
  phoneRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.sm,
    marginBottom: space.sm,
  },
  countrySelector: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    height: 56,
    borderRadius: radius.md,
    borderWidth: 1,
    marginBottom: space.lg,
  },
  countryFlag: { fontSize: 20 },
  countryDial: { ...type.subheadline, fontWeight: '700' },
  phoneInputCard: {
    flex: 1,
  },
  chipRow: { gap: space.sm, paddingBottom: space.md },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: radius.pill,
  },
  paymentSectionHeader: {
    marginBottom: 4,
  },
  paymentRailCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.sm,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 14,
    borderWidth: 1.5,
  },
  paymentRailLabel: {
    ...type.footnote,
    fontWeight: '600',
  },
  footnote: {
    ...type.caption1,
    textAlign: 'center',
    marginTop: space.md,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: space.xl,
    paddingBottom: 40,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: space.lg,
  },
  modalTitle: { ...type.headline, fontSize: 18 },
  countryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderRadius: 10,
  },
  countryItemFlag: { fontSize: 22, marginRight: 12 },
  countryItemName: { flex: 1, ...type.body, fontWeight: '500' },
  countryItemDial: { ...type.subheadline, fontWeight: '600' },
});

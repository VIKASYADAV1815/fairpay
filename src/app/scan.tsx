import { useCallback, useRef, useState } from 'react';
import { View, Text, StyleSheet, Pressable, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CameraView, useCameraPermissions, type BarcodeScanningResult } from 'expo-camera';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { PrimaryButton } from '@/components/PrimaryButton';
import { useTripStore } from '@/store/trips';
import { useAuthStore } from '@/store/auth';
import { useColors } from '@/store/theme';
import { parseInvitePayload } from '@/lib/invite';
import { space, type } from '@/theme/tokens';

export default function ScanScreen() {
  const insets = useSafeAreaInsets();
  const c = useColors();
  const [permission, requestPermission] = useCameraPermissions();
  const joinByInviteCode = useTripStore((s) => s.joinByInviteCode);
  const name = useAuthStore((s) => s.name);
  const [scanned, setScanned] = useState(false);
  const lock = useRef(false);

  const handleJoin = useCallback(
    (raw: string) => {
      const code = parseInvitePayload(raw);
      if (!code) {
        Alert.alert('Not a Fairpay invite', 'Scan a Fairpay group QR or code.');
        lock.current = false;
        setScanned(false);
        return;
      }
      const trip = joinByInviteCode(code, name || undefined);
      if (!trip) {
        Alert.alert('Couldn’t join', 'Try the invite code manually.');
        lock.current = false;
        setScanned(false);
        return;
      }
      Alert.alert('Joined', `You’re in “${trip.name}”`, [
        {
          text: 'Open group',
          onPress: () =>
            router.replace({ pathname: '/trip/[id]', params: { id: trip.id } }),
        },
      ]);
    },
    [joinByInviteCode, name],
  );

  const onBarcodeScanned = (result: BarcodeScanningResult) => {
    if (lock.current || scanned) return;
    lock.current = true;
    setScanned(true);
    handleJoin(result.data);
  };

  if (!permission) {
    return <View style={[styles.screen, { backgroundColor: c.bg }]} />;
  }

  if (!permission.granted) {
    return (
      <View
        style={[
          styles.screen,
          {
            backgroundColor: c.bg,
            paddingTop: insets.top + space.xxl,
            paddingBottom: insets.bottom + space.xxl,
            paddingHorizontal: space.xl,
          },
        ]}
      >
        <Text style={[styles.title, { color: c.text }]}>Camera access</Text>
        <Text style={[styles.body, { color: c.textSecondary }]}>
          Fairpay needs the camera to scan group invite QR codes.
        </Text>
        <PrimaryButton label="Allow camera" variant="accent" onPress={requestPermission} />
        <Pressable onPress={() => router.back()} style={styles.back}>
          <Text style={[styles.backText, { color: c.textSecondary }]}>Not now</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={[styles.screen, { backgroundColor: '#000' }]}>
      <CameraView
        style={StyleSheet.absoluteFill}
        facing="back"
        barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
        onBarcodeScanned={scanned ? undefined : onBarcodeScanned}
      />

      <View style={[styles.topBar, { paddingTop: insets.top + space.sm }]}>
        <Pressable
          onPress={() => router.back()}
          hitSlop={12}
          style={[styles.close, { backgroundColor: 'rgba(0,0,0,0.45)' }]}
        >
          <Ionicons name="close" size={22} color="#fff" />
        </Pressable>
        <Text style={styles.topTitle}>Scan invite QR</Text>
        <View style={{ width: 36 }} />
      </View>

      <View style={styles.frameWrap}>
        <View style={[styles.frame, { borderColor: c.accent }]} />
        <Text style={styles.hint}>Align the QR inside the square</Text>
      </View>

      {scanned ? (
        <View style={[styles.footer, { paddingBottom: insets.bottom + space.lg }]}>
          <PrimaryButton
            label="Scan again"
            variant="accent"
            onPress={() => {
              lock.current = false;
              setScanned(false);
            }}
          />
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  title: { ...type.title1, marginBottom: space.md },
  body: { ...type.body, marginBottom: space.xxxl },
  back: { alignItems: 'center', marginTop: space.lg },
  backText: { ...type.footnote, fontWeight: '600' },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: space.lg,
  },
  close: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  topTitle: {
    ...type.headline,
    color: '#fff',
  },
  frameWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  frame: {
    width: 240,
    height: 240,
    borderRadius: 24,
    borderWidth: 3,
    backgroundColor: 'transparent',
  },
  hint: {
    ...type.footnote,
    color: 'rgba(255,255,255,0.85)',
    marginTop: space.lg,
    fontWeight: '600',
  },
  footer: {
    paddingHorizontal: space.xl,
  },
});

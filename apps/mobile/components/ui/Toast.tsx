import { useEffect } from 'react';
import { StyleSheet } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import Animated, { FadeInUp, FadeOutUp } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { create } from 'zustand';
import { colors, radius, shadows, spacing } from '@/constants/theme';
import { Text } from './Text';

type Tone = 'success' | 'error' | 'info';

interface ToastState {
  message: string | null;
  tone: Tone;
  id: number;
  show: (message: string, tone?: Tone) => void;
  hide: () => void;
}

export const useToast = create<ToastState>((set) => ({
  message: null,
  tone: 'info',
  id: 0,
  show: (message, tone = 'info') => set((s) => ({ message, tone, id: s.id + 1 })),
  hide: () => set({ message: null }),
}));

export const toast = {
  success: (m: string) => useToast.getState().show(m, 'success'),
  error: (m: string) => useToast.getState().show(m, 'error'),
  info: (m: string) => useToast.getState().show(m, 'info'),
};

const icons = { success: 'checkmark-circle', error: 'alert-circle', info: 'information-circle' } as const;
const tints = { success: colors.beige, error: '#F2A79D', info: colors.beige } as const;

/** A small, non-blocking confirmation that slides in from the top. */
export function ToastHost() {
  const { message, tone, id, hide } = useToast();
  const insets = useSafeAreaInsets();

  useEffect(() => {
    if (!message) return;
    const t = setTimeout(hide, 2400);
    return () => clearTimeout(t);
  }, [id, message, hide]);

  if (!message) return null;
  return (
    <Animated.View
      key={id}
      entering={FadeInUp.springify().damping(18)}
      exiting={FadeOutUp.duration(180)}
      style={[styles.toast, { top: insets.top + spacing.sm }]}
      accessibilityLiveRegion="polite"
      accessibilityRole="alert"
      pointerEvents="none"
    >
      <Ionicons name={icons[tone]} size={18} color={tints[tone]} />
      <Text variant="bodySm" color={colors.textOnDark} style={styles.text} numberOfLines={2}>
        {message}
      </Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  toast: {
    position: 'absolute',
    alignSelf: 'center',
    maxWidth: '90%',
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: radius.pill,
    backgroundColor: colors.espresso,
    zIndex: 1000,
    ...shadows.lg,
  },
  text: { flexShrink: 1, fontFamily: 'Manrope_600SemiBold' },
});

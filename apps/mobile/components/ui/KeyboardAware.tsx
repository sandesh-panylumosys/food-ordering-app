import { forwardRef, type ReactNode } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, type ScrollViewProps, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

/**
 * ScrollView for forms. On iOS, UIKit adds the keyboard inset itself
 * (`automaticallyAdjustKeyboardInsets`), which stays correct inside modal sheets —
 * unlike KeyboardAvoidingView, whose parent-relative maths over-pads there.
 */
export const FormScrollView = forwardRef<ScrollView, ScrollViewProps>(function FormScrollView(props, ref) {
  return (
    <ScrollView
      ref={ref}
      keyboardShouldPersistTaps="handled"
      keyboardDismissMode={Platform.OS === 'ios' ? 'interactive' : 'on-drag'}
      automaticallyAdjustKeyboardInsets
      showsVerticalScrollIndicator={false}
      {...props}
    />
  );
});

/**
 * Lifts a full-screen form's sticky footer (e.g. a BottomBar CTA) above the iOS
 * keyboard. Place it directly inside <Screen edges={['top']}> — the offset makes up
 * for the top safe area that KeyboardAvoidingView's parent-relative frame misses.
 * Android resizes the window itself, so no behaviour is applied there.
 */
export function KeyboardAvoider({ children }: { children: ReactNode }) {
  const insets = useSafeAreaInsets();
  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={insets.top}
    >
      {children}
    </KeyboardAvoidingView>
  );
}

/** Scrolls a form to its end once the keyboard has animated in, revealing the CTA below the last field. */
export function revealEnd(ref: React.RefObject<ScrollView | null>) {
  setTimeout(() => ref.current?.scrollToEnd({ animated: true }), 300);
}

const styles = StyleSheet.create({ flex: { flex: 1 } });

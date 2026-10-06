import { Image } from 'expo-image';
import { Modal, StyleSheet, useWindowDimensions, View } from 'react-native';
import { Gesture, GestureDetector, GestureHandlerRootView } from 'react-native-gesture-handler';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { IconButton } from '@/components/ui';
import { optimizeImage } from '@/lib/image';

interface ImageViewerProps {
  uri: string | null;
  visible: boolean;
  onClose: () => void;
  alt: string;
}

/** Full-screen photo with pinch, pan and double-tap zoom. */
export function ImageViewer({ uri, visible, onClose, alt }: ImageViewerProps) {
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const scale = useSharedValue(1);
  const savedScale = useSharedValue(1);
  const tx = useSharedValue(0);
  const ty = useSharedValue(0);
  const savedTx = useSharedValue(0);
  const savedTy = useSharedValue(0);

  const reset = () => {
    'worklet';
    scale.set(withTiming(1));
    savedScale.set(1);
    tx.set(withTiming(0));
    ty.set(withTiming(0));
    savedTx.set(0);
    savedTy.set(0);
  };

  const pinch = Gesture.Pinch()
    .onUpdate((e) => {
      scale.set(Math.min(Math.max(savedScale.get() * e.scale, 1), 4));
    })
    .onEnd(() => {
      if (scale.get() <= 1.02) reset();
      else savedScale.set(scale.get());
    });

  const pan = Gesture.Pan()
    .averageTouches(true)
    .onUpdate((e) => {
      if (scale.get() <= 1) return;
      tx.set(savedTx.get() + e.translationX);
      ty.set(savedTy.get() + e.translationY);
    })
    .onEnd(() => {
      savedTx.set(tx.get());
      savedTy.set(ty.get());
    });

  const doubleTap = Gesture.Tap()
    .numberOfTaps(2)
    .onEnd(() => {
      if (scale.get() > 1) reset();
      else {
        scale.set(withTiming(2.2));
        savedScale.set(2.2);
      }
    });

  const animated = useAnimatedStyle(() => ({
    transform: [{ translateX: tx.get() }, { translateY: ty.get() }, { scale: scale.get() }],
  }));

  const close = () => {
    reset();
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={close} statusBarTranslucent>
      <GestureHandlerRootView style={styles.root}>
        <GestureDetector gesture={Gesture.Simultaneous(pinch, pan, doubleTap)}>
          <Animated.View style={[styles.center, animated]}>
            <Image
              source={optimizeImage(uri, width)}
              style={{ width, height: height * 0.7 }}
              contentFit="contain"
              accessibilityLabel={alt}
            />
          </Animated.View>
        </GestureDetector>
        <View style={[styles.close, { top: insets.top + 12 }]}>
          <IconButton icon="close" variant="glass" accessibilityLabel="Close photo" onPress={close} />
        </View>
      </GestureHandlerRootView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: 'rgba(15,12,10,0.96)' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  close: { position: 'absolute', right: 20 },
});

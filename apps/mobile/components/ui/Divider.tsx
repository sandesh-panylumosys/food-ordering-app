import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { colors } from '@/constants/theme';

export const Divider = ({ style }: { style?: StyleProp<ViewStyle> }) => <View style={[styles.line, style]} />;

const styles = StyleSheet.create({
  line: { height: StyleSheet.hairlineWidth, backgroundColor: colors.borderStrong, alignSelf: 'stretch' },
});

import { Text as RNText, type TextProps as RNTextProps } from 'react-native';
import { colors, typography, type TypographyVariant } from '@/constants/theme';

export interface TextProps extends RNTextProps {
  variant?: TypographyVariant;
  color?: string;
  align?: 'left' | 'center' | 'right';
}

export function Text({ variant = 'body', color = colors.text, align, style, ...rest }: TextProps) {
  return (
    <RNText
      maxFontSizeMultiplier={1.4}
      style={[typography[variant], { color }, align && { textAlign: align }, style]}
      {...rest}
    />
  );
}

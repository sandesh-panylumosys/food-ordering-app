/* eslint-disable @typescript-eslint/no-require-imports */
import { fonts } from './theme';

/** Only the weights we use are bundled. */
export const fontAssets = {
  [fonts.serif]: require('@expo-google-fonts/cormorant-garamond/600SemiBold/CormorantGaramond_600SemiBold.ttf'),
  [fonts.serifBold]: require('@expo-google-fonts/cormorant-garamond/700Bold/CormorantGaramond_700Bold.ttf'),
  [fonts.serifItalic]: require('@expo-google-fonts/cormorant-garamond/500Medium_Italic/CormorantGaramond_500Medium_Italic.ttf'),
  [fonts.sansRegular]: require('@expo-google-fonts/manrope/400Regular/Manrope_400Regular.ttf'),
  [fonts.sans]: require('@expo-google-fonts/manrope/500Medium/Manrope_500Medium.ttf'),
  [fonts.sansSemiBold]: require('@expo-google-fonts/manrope/600SemiBold/Manrope_600SemiBold.ttf'),
  [fonts.sansBold]: require('@expo-google-fonts/manrope/700Bold/Manrope_700Bold.ttf'),
  [fonts.sansExtraBold]: require('@expo-google-fonts/manrope/800ExtraBold/Manrope_800ExtraBold.ttf'),
};

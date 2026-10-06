import { formatPrice } from '@food/config';
import type { CustomizationGroup as Group } from '@food/shared-types';
import Ionicons from '@expo/vector-icons/Ionicons';
import { StyleSheet, View } from 'react-native';
import { Badge, PressableScale, Text } from '@/components/ui';
import { colors, radius, spacing } from '@/constants/theme';
import { haptics } from '@/lib/haptics';

interface Props {
  group: Group;
  selected: string[];
  onChange: (optionIds: string[]) => void;
}

export function CustomizationGroup({ group, selected, onChange }: Props) {
  const single = group.type === 'single';
  const limit = single ? 1 : (group.maxSelect ?? group.options.length);

  const toggle = (id: string) => {
    haptics.selection();
    if (single) {
      // Optional single-choice groups can be deselected.
      onChange(selected.includes(id) && !group.required ? [] : [id]);
      return;
    }
    if (selected.includes(id)) onChange(selected.filter((s) => s !== id));
    else if (selected.length < limit) onChange([...selected, id]);
  };

  return (
    <View style={styles.group} accessibilityRole={single ? 'radiogroup' : undefined}>
      <View style={styles.header}>
        <View style={styles.flex}>
          <Text variant="title">{group.name}</Text>
          <Text variant="caption" color={colors.textMuted}>
            {single ? 'Choose one' : `Choose up to ${limit}`}
          </Text>
        </View>
        <Badge label={group.required ? 'Required' : 'Optional'} tone={group.required ? 'accent' : 'neutral'} />
      </View>
      <View style={styles.options}>
        {group.options.map((option) => {
          const isOn = selected.includes(option.id);
          const disabled = !isOn && !single && selected.length >= limit;
          return (
            <PressableScale
              key={option.id}
              onPress={() => toggle(option.id)}
              disabled={disabled}
              scaleTo={0.985}
              accessibilityRole={single ? 'radio' : 'checkbox'}
              accessibilityState={{ checked: isOn, disabled }}
              accessibilityLabel={`${option.name}${option.price ? `, plus ${formatPrice(option.price)}` : ''}`}
              style={[styles.option, isOn && styles.optionOn, disabled && styles.optionDisabled]}
            >
              <Ionicons
                name={single ? (isOn ? 'radio-button-on' : 'radio-button-off') : isOn ? 'checkbox' : 'square-outline'}
                size={22}
                color={isOn ? colors.espresso : colors.textSubtle}
              />
              <Text variant="body" style={styles.flex}>
                {option.name}
              </Text>
              <Text variant="caption" color={option.price ? colors.text : colors.textSubtle}>
                {option.price ? `+ ${formatPrice(option.price)}` : 'Included'}
              </Text>
            </PressableScale>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  group: { gap: spacing.md },
  header: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  flex: { flex: 1 },
  options: { gap: spacing.sm },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    minHeight: 52,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.md,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  optionOn: { borderColor: colors.espresso, backgroundColor: colors.warmWhite },
  optionDisabled: { opacity: 0.45 },
});

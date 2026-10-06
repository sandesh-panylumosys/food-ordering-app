import { router } from 'expo-router';
import { Alert, FlatList, StyleSheet, View } from 'react-native';
import { AddressCard } from '@/components/checkout/AddressCard';
import { BottomBar, Button, EmptyState, ErrorState, Screen, ScreenHeader, SignInPrompt, Skeleton, toast } from '@/components/ui';
import { gutter, radius, spacing } from '@/constants/theme';
import { useAddresses, useDeleteAddress, useSaveAddress } from '@/features/addresses/hooks';
import { friendlyMessage } from '@/lib/errors';
import { useAuthStore } from '@/store/auth.store';

export default function AddressesScreen() {
  const status = useAuthStore((s) => s.status);
  const { data, isPending, error, refetch } = useAddresses();
  const remove = useDeleteAddress();
  const save = useSaveAddress();

  if (status === 'guest') {
    return (
      <Screen>
        <ScreenHeader title="Saved Addresses" />
        <SignInPrompt message="Sign in to save delivery addresses." returnTo="/addresses" />
      </Screen>
    );
  }

  const openActions = (id: string, isDefault: boolean) =>
    Alert.alert('Address', undefined, [
      { text: 'Edit', onPress: () => router.push({ pathname: '/addresses/form', params: { id } }) },
      ...(!isDefault
        ? [{ text: 'Set as default', onPress: () => save.mutate({ id, input: { isDefault: true } }, { onError: (e) => toast.error(friendlyMessage(e)) }) }]
        : []),
      {
        text: 'Delete',
        style: 'destructive' as const,
        onPress: () => remove.mutate(id, { onSuccess: () => toast.info('Address removed'), onError: (e) => toast.error(friendlyMessage(e)) }),
      },
      { text: 'Cancel', style: 'cancel' as const },
    ]);

  return (
    <Screen>
      <ScreenHeader title="Saved Addresses" />
      {isPending ? (
        <View style={styles.list}>
          <Skeleton height={96} rounded={radius.lg} />
          <Skeleton height={96} rounded={radius.lg} />
        </View>
      ) : error ? (
        <ErrorState error={error} onRetry={() => void refetch()} />
      ) : (
        <FlatList
          data={data}
          keyExtractor={(a) => a.id}
          contentContainerStyle={[styles.list, !data?.length && styles.grow]}
          renderItem={({ item }) => <AddressCard address={item} actionLabel="Edit" onPress={() => openActions(item.id, item.isDefault)} />}
          ListEmptyComponent={
            <EmptyState icon="location-outline" title="No saved addresses" message="Add an address so we know where to bring your food." />
          }
        />
      )}
      <BottomBar>
        <Button label="Add new address" icon="add" size="lg" fullWidth onPress={() => router.push('/addresses/form')} />
      </BottomBar>
    </Screen>
  );
}

const styles = StyleSheet.create({
  list: { paddingHorizontal: gutter, paddingTop: spacing.sm, paddingBottom: spacing.xxl, gap: spacing.md },
  grow: { flexGrow: 1 },
});

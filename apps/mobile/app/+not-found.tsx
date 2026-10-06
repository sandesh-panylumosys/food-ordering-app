import { router } from 'expo-router';
import { EmptyState, Screen } from '@/components/ui';

export default function NotFound() {
  return (
    <Screen>
      <EmptyState icon="compass-outline" title="Page not found" message="This page doesn’t exist anymore." actionLabel="Go home" onAction={() => router.replace('/')} />
    </Screen>
  );
}

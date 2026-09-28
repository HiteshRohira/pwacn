import { useOfflineReadiness } from '@pwacn/react';
import { lazy, Suspense } from 'react';
import { InstagramDemo } from './InstagramDemo';

const SettingsApp = lazy(() =>
  import('../../settings-demo/SettingsApp').then((module) => ({
    default: module.SettingsApp,
  })),
);

export function App() {
  const offline = useOfflineReadiness();
  if (window.location.pathname.startsWith('/instagram')) return <InstagramDemo />;
  return (
    <Suspense fallback={null}>
      <SettingsApp offlineStatus={offline} />
    </Suspense>
  );
}

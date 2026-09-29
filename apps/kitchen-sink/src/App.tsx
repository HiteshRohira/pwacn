import { useOfflineReadiness } from '@pwacn/react';
import { lazy, Suspense } from 'react';
import { InstagramDemo } from './InstagramDemo';
import { GuidedSession } from './GuidedSession';

const SettingsApp = lazy(() =>
  import('../../settings-demo/SettingsApp').then((module) => ({
    default: module.SettingsApp,
  })),
);

export function App() {
  const offline = useOfflineReadiness();
  if (window.location.pathname.startsWith('/instagram'))
    return (
      <>
        <InstagramDemo />
        <GuidedSession />
      </>
    );
  return (
    <Suspense fallback={null}>
      <SettingsApp offlineStatus={offline} />
    </Suspense>
  );
}

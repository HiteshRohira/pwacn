import { useOfflineReadiness } from '@pwacn/react';
import { SettingsApp } from '../../settings-demo/SettingsApp';

export function App() {
  const offline = useOfflineReadiness();
  return <SettingsApp offlineStatus={offline} />;
}

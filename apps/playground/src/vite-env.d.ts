/// <reference types="vite/client" />

interface Window {
  __PWACN_FEEL__?: {
    primitive: string;
    scenario: string;
    samples: readonly import('@pwacn/react').FeelTelemetrySample[];
    summary: import('@pwacn/react').FeelTelemetrySummary;
  };
}

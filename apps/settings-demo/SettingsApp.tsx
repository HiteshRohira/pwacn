import { haptics } from '@pwacn/core';
import {
  ActionSheet,
  BottomSheet,
  MobileStack,
  MobileSwitch,
  Pressable,
  SegmentedControl,
  SheetClose,
  SheetScrollArea,
  ToastProvider,
  useFeelTelemetry,
  useToast,
  useMobileStack,
} from '@pwacn/react';
import { useEffect, useMemo, useState, type ReactNode } from 'react';
import './settings.css';

type IconName =
  | 'airplane'
  | 'wifi'
  | 'bluetooth'
  | 'cellular'
  | 'hotspot'
  | 'battery'
  | 'general'
  | 'accessibility'
  | 'action'
  | 'camera'
  | 'control'
  | 'display'
  | 'home'
  | 'search'
  | 'standby'
  | 'wallpaper'
  | 'siri'
  | 'faceid'
  | 'sos'
  | 'exposure'
  | 'privacy'
  | 'wallet'
  | 'game'
  | 'icloud'
  | 'family'
  | 'notifications'
  | 'sounds'
  | 'focus'
  | 'screen'
  | 'apps'
  | 'developer'
  | 'info'
  | 'update'
  | 'storage'
  | 'language'
  | 'transfer'
  | 'legal'
  | 'reset'
  | 'check'
  | 'lock'
  | 'key'
  | 'shield'
  | 'location';

const colors: Record<IconName, string> = {
  airplane: '#ff9f0a',
  wifi: '#007aff',
  bluetooth: '#007aff',
  cellular: '#34c759',
  hotspot: '#34c759',
  battery: '#34c759',
  general: '#8e8e93',
  accessibility: '#007aff',
  action: '#2c2c2e',
  camera: '#8e8e93',
  control: '#8e8e93',
  display: '#007aff',
  home: '#007aff',
  search: '#8e8e93',
  standby: '#2c2c2e',
  wallpaper: '#30b0c7',
  siri: '#111827',
  faceid: '#31ade6',
  sos: '#ff3b30',
  exposure: '#ff3b30',
  privacy: '#007aff',
  wallet: '#111',
  game: '#ff3b30',
  icloud: '#3478f6',
  family: '#34c759',
  notifications: '#ff3b30',
  sounds: '#ff375f',
  focus: '#5856d6',
  screen: '#5856d6',
  apps: '#007aff',
  developer: '#8e8e93',
  info: '#8e8e93',
  update: '#8e8e93',
  storage: '#8e8e93',
  language: '#8e8e93',
  transfer: '#8e8e93',
  legal: '#8e8e93',
  reset: '#8e8e93',
  check: '#34c759',
  lock: '#007aff',
  key: '#8e8e93',
  shield: '#007aff',
  location: '#007aff',
};

function Glyph({ name }: { name: IconName }) {
  const paths: Record<IconName, ReactNode> = {
    airplane: (
      <path d="m3 13 8-2 6.5-7c.8-.8 2.1-1 2.7-.4.6.6.4 1.9-.4 2.7L13 13l-2 8-2-1 .5-5.5L5 16l-2-3Z" />
    ),
    wifi: (
      <>
        <path d="M3 9a14 14 0 0 1 18 0M6.5 12.5a9 9 0 0 1 11 0M10 16a4 4 0 0 1 4 0" />
        <circle cx="12" cy="19" r="1" fill="currentColor" />
      </>
    ),
    bluetooth: <path d="m9 4 7 6-7 6V4Zm0 12 7 6V10L5 19m0-14 11 11" />,
    cellular: (
      <path
        d="M4 20v-4h3v4H4Zm4.5 0v-7h3v7h-3Zm4.5 0V9h3v11h-3Zm4.5 0V4h3v16h-3Z"
        fill="currentColor"
        stroke="none"
      />
    ),
    battery: (
      <>
        <rect x="4" y="7" width="15" height="10" rx="2" />
        <path d="M21 10v4M7 10v4h5v-4H7Z" />
      </>
    ),
    hotspot: (
      <>
        <circle cx="12" cy="12" r="2" />
        <path d="M7.8 7.8a6 6 0 0 0 0 8.4m8.4 0a6 6 0 0 0 0-8.4" />
      </>
    ),
    general: (
      <>
        <circle cx="12" cy="12" r="3" />
        <path d="M12 3v3m0 12v3M3 12h3m12 0h3M5.6 5.6l2.1 2.1m8.6 8.6 2.1 2.1m0-12.8-2.1 2.1m-8.6 8.6-2.1 2.1" />
      </>
    ),
    accessibility: (
      <>
        <circle cx="12" cy="5" r="2" />
        <path d="M5 9h14m-7 0v5m0 0-4 7m4-7 4 7" />
      </>
    ),
    action: (
      <>
        <circle cx="12" cy="12" r="4" />
        <path d="M12 3v3m0 12v3M3 12h3m12 0h3" />
      </>
    ),
    camera: (
      <>
        <path d="M4 8h4l2-2h4l2 2h4v11H4V8Z" />
        <circle cx="12" cy="13" r="3" />
      </>
    ),
    control: (
      <>
        <path d="M7 6h10M7 12h10M7 18h10" />
        <circle cx="10" cy="6" r="2" fill="currentColor" />
        <circle cx="15" cy="12" r="2" fill="currentColor" />
        <circle cx="9" cy="18" r="2" fill="currentColor" />
      </>
    ),
    display: (
      <>
        <circle cx="12" cy="12" r="4" />
        <path d="M12 2v3m0 14v3M2 12h3m14 0h3M5 5l2 2m10 10 2 2m0-14-2 2M7 17l-2 2" />
      </>
    ),
    home: <path d="m4 11 8-7 8 7v9h-6v-6h-4v6H4v-9Z" />,
    search: (
      <>
        <circle cx="10.5" cy="10.5" r="6" />
        <path d="m15 15 5 5" />
      </>
    ),
    faceid: (
      <path d="M4 8V5a1 1 0 0 1 1-1h3m8 0h3a1 1 0 0 1 1 1v3M4 16v3a1 1 0 0 0 1 1h3m8 0h3a1 1 0 0 0 1-1v-3M9 10v2m6-2v2m-6 4c2 1.3 4 1.3 6 0" />
    ),
    standby: (
      <>
        <rect x="3" y="5" width="18" height="14" rx="2" />
        <circle cx="12" cy="12" r="4" />
        <path d="M12 9.5V12l2 1" />
      </>
    ),
    wallpaper: (
      <>
        <rect x="4" y="3" width="13" height="17" rx="2" />
        <path d="M8 7h12v14a1 1 0 0 1-1 1H8V7Zm-4 9 4-4 3 3 2-2 4 4" />
      </>
    ),
    siri: (
      <path d="M12 2c.8 5.4 2.6 7.2 8 8-5.4.8-7.2 2.6-8 8-.8-5.4-2.6-7.2-8-8 5.4-.8 7.2-2.6 8-8Zm6 13c.3 2 .9 2.7 3 3-2.1.3-2.7 1-3 3-.3-2-.9-2.7-3-3 2.1-.3 2.7-1 3-3Z" />
    ),
    sos: (
      <>
        <path d="M12 3v18M3 12h18M5.6 5.6l12.8 12.8m0-12.8L5.6 18.4" />
        <circle cx="12" cy="12" r="4" />
      </>
    ),
    exposure: (
      <>
        <circle cx="12" cy="12" r="3" />
        <path d="M12 2v5m0 10v5M2 12h5m10 0h5M5 5l3.5 3.5m7 7L19 19m0-14-3.5 3.5m-7 7L5 19" />
      </>
    ),
    privacy: (
      <>
        <path d="M12 3 5 6v5c0 5 3 8 7 10 4-2 7-5 7-10V6l-7-3Z" />
        <path d="m9 12 2 2 4-5" />
      </>
    ),
    family: (
      <>
        <circle cx="9" cy="9" r="3" />
        <circle cx="16" cy="10" r="2" />
        <path d="M3 20a6 6 0 0 1 12 0m0-5a5 5 0 0 1 6 5" />
      </>
    ),
    wallet: (
      <>
        <rect x="3" y="5" width="18" height="14" rx="3" />
        <path d="M3 9h18M15 13h4" />
      </>
    ),
    game: (
      <>
        <path d="M7 8h10c3 0 5 2.5 5 5.5S20.5 20 18 20c-2 0-3-3-6-3s-4 3-6 3c-2.5 0-4-3.5-4-6.5S4 8 7 8Z" />
        <path d="M7 12v4m-2-2h4m7-1h.1m3 2h.1" />
      </>
    ),
    icloud: <path d="M7 18h11a4 4 0 0 0 .4-8A6.5 6.5 0 0 0 6 9a4.5 4.5 0 0 0 1 9Z" />,
    notifications: (
      <>
        <path d="M6 16h12l-2-3V9a4 4 0 0 0-8 0v4l-2 3Z" />
        <path d="M10 19h4" />
      </>
    ),
    sounds: (
      <>
        <path d="M5 14h4l5 4V6L9 10H5v4Z" />
        <path d="M17 9a4 4 0 0 1 0 6" />
      </>
    ),
    focus: <path d="M18.5 15.5A8 8 0 0 1 8.5 5.5 8 8 0 1 0 18.5 15.5Z" />,
    screen: (
      <>
        <path d="M7 4h10l2 17H5L7 4Z" />
        <path d="M9 8h6M8.5 12h7" />
      </>
    ),
    apps: (
      <>
        <rect x="4" y="4" width="6" height="6" rx="1" />
        <rect x="14" y="4" width="6" height="6" rx="1" />
        <rect x="4" y="14" width="6" height="6" rx="1" />
        <rect x="14" y="14" width="6" height="6" rx="1" />
      </>
    ),
    info: (
      <>
        <circle cx="12" cy="12" r="9" />
        <path d="M12 11v6m0-10v.1" />
      </>
    ),
    update: (
      <>
        <path d="M20 7v5h-5M4 17v-5h5" />
        <path d="M18.5 9A7 7 0 0 0 6 7l-2 5m16 0-2 5a7 7 0 0 1-12.5-2" />
      </>
    ),
    storage: (
      <>
        <rect x="3" y="4" width="18" height="16" rx="2" />
        <path d="M3 9h18M8 4v5m8-5v5M7 14h3m4 0h3" />
      </>
    ),
    language: (
      <>
        <path d="m4 19 5-14 5 14M6 14h6M14 7h7m-3.5 0c0 6-3.5 9-3.5 9m3.5-6c1 2 2.2 3.4 4 4.5" />
      </>
    ),
    transfer: (
      <>
        <path d="M4 8h14l-3-3m3 11H4l3 3" />
      </>
    ),
    legal: (
      <>
        <path d="M12 3v18M7 6h10M5 9l-3 6h6L5 9Zm14 0-3 6h6l-3-6ZM7 21h10" />
      </>
    ),
    reset: <path d="M4 4v6h6M5 9a8 8 0 1 1-1 6" />,
    check: <path d="m5 12 4 4L19 6" />,
    lock: (
      <>
        <rect x="5" y="10" width="14" height="11" rx="2" />
        <path d="M8 10V7a4 4 0 0 1 8 0v3" />
      </>
    ),
    key: (
      <>
        <circle cx="8" cy="15" r="4" />
        <path d="m11 12 8-8 2 2-2 2 1.5 1.5-2 2L17 10l-3 3" />
      </>
    ),
    shield: (
      <>
        <path d="M12 3 5 6v5c0 5 3 8 7 10 4-2 7-5 7-10V6l-7-3Z" />
        <path d="M9 12h6M12 9v6" />
      </>
    ),
    developer: (
      <>
        <path d="m8 7-5 5 5 5m8-10 5 5-5 5M14 4l-4 16" />
      </>
    ),
    location: (
      <>
        <path d="M20 10c0 5-8 11-8 11S4 15 4 10a8 8 0 1 1 16 0Z" />
        <circle cx="12" cy="10" r="2" />
      </>
    ),
  };
  return (
    <span
      className={`settings-icon icon-${name}`}
      style={{ background: colors[name] }}
      aria-hidden="true"
    >
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        {paths[name]}
      </svg>
    </span>
  );
}

function StatusBar() {
  const [time, setTime] = useState('9:41');
  useEffect(() => {
    const update = () =>
      setTime(
        new Intl.DateTimeFormat('en-US', {
          hour: 'numeric',
          minute: '2-digit',
          hour12: false,
        }).format(new Date()),
      );
    update();
    const timer = window.setInterval(update, 30_000);
    return () => window.clearInterval(timer);
  }, []);
  return (
    <div className="status-bar" aria-hidden="true">
      <strong>{time}</strong>
      <span className="status-island" />
      <span className="status-signals">
        <i className="signal-bars" />
        <i className="wifi-mark" />
        <i className="battery-mark">
          <b />
        </i>
      </span>
    </div>
  );
}

type RowProps = {
  icon?: IconName;
  label: string;
  value?: string;
  note?: string;
  badge?: string;
  toggle?: { checked: boolean; onChange: (checked: boolean) => void };
  onPress?: () => void;
  destructive?: boolean;
};

function SettingsRow({
  icon,
  label,
  value,
  note,
  badge,
  toggle,
  onPress,
  destructive,
}: RowProps) {
  const content = (
    <>
      <span className="row-leading">
        {icon ? <Glyph name={icon} /> : null}
        <span className={destructive ? 'destructive' : ''}>
          {label}
          {note ? <small>{note}</small> : null}
        </span>
      </span>
      <span className="row-trailing">
        {badge ? <b className="badge">{badge}</b> : null}
        {value ? <span>{value}</span> : null}
        {toggle ? (
          <MobileSwitch
            label={label}
            checked={toggle.checked}
            onCheckedChange={toggle.onChange}
          />
        ) : onPress ? (
          <span className="chevron">›</span>
        ) : null}
      </span>
    </>
  );
  return onPress ? (
    <Pressable className="settings-row" feedback="opacity" onPress={onPress}>
      {content}
    </Pressable>
  ) : (
    <div className="settings-row">{content}</div>
  );
}

function Group({
  children,
  footer,
  title,
}: {
  children: ReactNode;
  footer?: ReactNode;
  title?: string;
}) {
  return (
    <section className="settings-group">
      {title ? <h3>{title}</h3> : null}
      <div className="group-card">{children}</div>
      {footer ? <p className="group-footer">{footer}</p> : null}
    </section>
  );
}

function ScreenHeader({
  title,
  root = false,
  onMore,
}: {
  title: string;
  root?: boolean;
  onMore?: () => void;
}) {
  const nav = useMobileStack();
  return (
    <>
      <StatusBar />
      <header className={`screen-header ${root ? 'root-header' : ''}`}>
        {!root ? (
          <Pressable className="back-button" feedback="opacity" onPress={nav.pop}>
            <span>‹</span>Settings
          </Pressable>
        ) : (
          <span />
        )}
        {!root ? <strong>{title}</strong> : null}
        {onMore ? (
          <Pressable className="more-button" aria-label="More" onPress={onMore}>
            •••
          </Pressable>
        ) : (
          <span />
        )}
      </header>
    </>
  );
}

function DetailScreen({ title, children }: { title: string; children?: ReactNode }) {
  return (
    <div className="ios-screen">
      <ScreenHeader title={title} />
      <main className="detail-scroll">
        <h1>{title}</h1>
        {children ?? <FunctionalSettings title={title} />}
      </main>
      <HomeIndicator />
    </div>
  );
}

type DetailRow =
  | { label: string; kind: 'toggle'; initial?: boolean; note?: string }
  | { label: string; kind: 'value'; value: string; note?: string };

const detailContent: Record<
  string,
  { footer?: string; sections: { title?: string; rows: DetailRow[] }[] }
> = {
  'Mobile Service': {
    footer: 'Carrier settings and mobile data usage are simulated in this benchmark.',
    sections: [
      {
        rows: [
          { label: 'Mobile Data', kind: 'toggle', initial: true },
          { label: 'Personal Hotspot', kind: 'value', value: 'Off' },
        ],
      },
      {
        title: 'SIMS',
        rows: [
          { label: 'Primary', kind: 'value', value: 'On' },
          { label: 'Add eSIM', kind: 'value', value: '' },
        ],
      },
      {
        title: 'MOBILE DATA',
        rows: [
          { label: 'Mobile Data Options', kind: 'value', value: 'Roaming Off' },
          { label: 'Network Selection', kind: 'value', value: 'Automatic' },
        ],
      },
    ],
  },
  'Personal Hotspot': {
    sections: [
      {
        rows: [
          { label: 'Allow Others to Join', kind: 'toggle' },
          { label: 'Wi-Fi Password', kind: 'value', value: '••••••••' },
          { label: 'Maximise Compatibility', kind: 'toggle' },
        ],
      },
    ],
  },
  Accessibility: {
    sections: [
      {
        title: 'VISION',
        rows: [
          { label: 'VoiceOver', kind: 'value', value: 'Off' },
          { label: 'Zoom', kind: 'value', value: 'Off' },
          { label: 'Display & Text Size', kind: 'value', value: '' },
          { label: 'Motion', kind: 'value', value: '' },
        ],
      },
      {
        title: 'PHYSICAL AND MOTOR',
        rows: [
          { label: 'Touch', kind: 'value', value: '' },
          { label: 'Face ID & Attention', kind: 'value', value: '' },
        ],
      },
    ],
  },
  'Action Button': {
    footer: 'Press and hold the Action button to perform the selected action.',
    sections: [
      {
        rows: [
          { label: 'Silent Mode', kind: 'toggle', initial: true },
          { label: 'Show in Status Bar', kind: 'toggle', initial: true },
        ],
      },
    ],
  },
  Camera: {
    sections: [
      {
        title: 'CAMERA CAPTURE',
        rows: [
          { label: 'Formats', kind: 'value', value: 'High Efficiency' },
          { label: 'Record Video', kind: 'value', value: '4K at 30 fps' },
          { label: 'Record Slo-mo', kind: 'value', value: '1080p at 120 fps' },
        ],
      },
      {
        rows: [
          { label: 'Grid', kind: 'toggle' },
          { label: 'Level', kind: 'toggle', initial: true },
          { label: 'Scan QR Codes', kind: 'toggle', initial: true },
        ],
      },
    ],
  },
  'Control Centre': {
    sections: [
      {
        rows: [
          { label: 'Access Within Apps', kind: 'toggle', initial: true },
          { label: 'Reset Control Centre', kind: 'value', value: '' },
        ],
      },
    ],
  },
  'Home Screen & App Library': {
    sections: [
      {
        title: 'NEWLY DOWNLOADED APPS',
        rows: [
          { label: 'Add to Home Screen', kind: 'toggle', initial: true },
          { label: 'App Library Only', kind: 'toggle' },
        ],
      },
      {
        title: 'NOTIFICATION BADGES',
        rows: [{ label: 'Show in App Library', kind: 'toggle', initial: true }],
      },
    ],
  },
  Search: {
    sections: [
      {
        rows: [
          { label: 'Show Recent Searches', kind: 'toggle', initial: true },
          { label: 'Show Related Content', kind: 'toggle', initial: true },
        ],
      },
      {
        title: 'BEFORE SEARCHING',
        rows: [
          { label: 'Show Suggestions', kind: 'toggle', initial: true },
          { label: 'Show Recents', kind: 'toggle', initial: true },
        ],
      },
    ],
  },
  StandBy: {
    sections: [
      {
        rows: [
          { label: 'StandBy', kind: 'toggle', initial: true },
          { label: 'Display', kind: 'value', value: '' },
          { label: 'Night Mode', kind: 'toggle', initial: true },
          { label: 'Show Notifications', kind: 'toggle', initial: true },
        ],
      },
    ],
  },
  Wallpaper: {
    sections: [
      {
        rows: [
          { label: 'Add New Wallpaper', kind: 'value', value: '' },
          { label: 'Dark Appearance Dims Wallpaper', kind: 'toggle' },
        ],
      },
    ],
  },
  Notifications: {
    sections: [
      {
        rows: [
          { label: 'Scheduled Summary', kind: 'value', value: 'Off' },
          { label: 'Show Previews', kind: 'value', value: 'Always' },
          { label: 'Screen Sharing', kind: 'value', value: '' },
        ],
      },
      {
        title: 'NOTIFICATION STYLE',
        rows: [
          { label: 'App Store', kind: 'value', value: 'Banners, Sounds, Badges' },
          { label: 'Calendar', kind: 'value', value: 'Banners, Sounds' },
          { label: 'Messages', kind: 'value', value: 'Banners, Sounds, Badges' },
        ],
      },
    ],
  },
  'Sounds & Haptics': {
    sections: [
      {
        rows: [
          { label: 'Ringtone', kind: 'value', value: 'Reflection' },
          { label: 'Text Tone', kind: 'value', value: 'Note' },
          { label: 'New Voicemail', kind: 'value', value: 'Tri-tone' },
        ],
      },
      {
        title: 'SYSTEM SOUNDS & HAPTICS',
        rows: [
          { label: 'Keyboard Feedback', kind: 'value', value: 'Sound' },
          { label: 'Lock Sound', kind: 'toggle', initial: true },
          { label: 'System Haptics', kind: 'toggle', initial: true },
        ],
      },
    ],
  },
  Focus: {
    sections: [
      {
        rows: [
          { label: 'Do Not Disturb', kind: 'value', value: 'Off' },
          { label: 'Personal', kind: 'value', value: 'Off' },
          { label: 'Sleep', kind: 'value', value: 'Off' },
          { label: 'Work', kind: 'value', value: 'Off' },
        ],
      },
      {
        rows: [
          { label: 'Share Across Devices', kind: 'toggle', initial: true },
          { label: 'Focus Status', kind: 'value', value: '' },
        ],
      },
    ],
  },
  'Screen Time': {
    sections: [
      {
        rows: [
          { label: 'App & Website Activity', kind: 'toggle', initial: true },
          { label: 'Downtime', kind: 'value', value: 'Off' },
          { label: 'App Limits', kind: 'value', value: 'Off' },
          { label: 'Always Allowed', kind: 'value', value: '' },
        ],
      },
      { rows: [{ label: 'Share Across Devices', kind: 'toggle', initial: true }] },
    ],
  },
  Siri: {
    sections: [
      {
        title: 'TALK TO SIRI',
        rows: [
          { label: 'Talk to Siri', kind: 'value', value: '“Siri” or “Hey Siri”' },
          { label: 'Press Side Button for Siri', kind: 'toggle', initial: true },
          { label: 'Allow Siri When Locked', kind: 'toggle', initial: true },
        ],
      },
      {
        rows: [
          { label: 'Language', kind: 'value', value: 'English (India)' },
          { label: 'Siri Voice', kind: 'value', value: 'Voice 2' },
        ],
      },
    ],
  },
  'Face ID & Passcode': {
    sections: [
      {
        title: 'USE FACE ID FOR',
        rows: [
          { label: 'iPhone Unlock', kind: 'toggle', initial: true },
          { label: 'iTunes & App Store', kind: 'toggle', initial: true },
          { label: 'Wallet & Apple Pay', kind: 'toggle', initial: true },
          { label: 'Password AutoFill', kind: 'toggle', initial: true },
        ],
      },
      {
        rows: [
          { label: 'Require Attention for Face ID', kind: 'toggle', initial: true },
          { label: 'Attention Aware Features', kind: 'toggle', initial: true },
        ],
      },
    ],
  },
  'Emergency SOS': {
    sections: [
      {
        rows: [
          { label: 'Call with Hold and Release', kind: 'toggle', initial: true },
          { label: 'Call with 5 Button Presses', kind: 'toggle' },
          { label: 'Call Quietly', kind: 'toggle' },
        ],
      },
      { rows: [{ label: 'Emergency Contacts', kind: 'value', value: '1' }] },
    ],
  },
  'Exposure Notifications': {
    sections: [
      {
        rows: [
          { label: 'Exposure Notifications', kind: 'toggle' },
          { label: 'Availability Alerts', kind: 'toggle', initial: true },
        ],
      },
    ],
  },
  'Privacy & Security': {
    sections: [
      {
        rows: [
          { label: 'Location Services', kind: 'value', value: 'On' },
          { label: 'Tracking', kind: 'value', value: '' },
          { label: 'Contacts', kind: 'value', value: '' },
          { label: 'Photos', kind: 'value', value: '' },
          { label: 'Bluetooth', kind: 'value', value: '' },
        ],
      },
      {
        title: 'SECURITY',
        rows: [
          { label: 'Safety Check', kind: 'value', value: '' },
          { label: 'Lockdown Mode', kind: 'value', value: 'Off' },
        ],
      },
    ],
  },
  'Game Center': {
    sections: [
      {
        rows: [
          { label: 'Game Center', kind: 'toggle', initial: true },
          { label: 'Nickname', kind: 'value', value: 'Hitesh' },
          { label: 'Profile Privacy', kind: 'value', value: 'Friends Only' },
        ],
      },
    ],
  },
  iCloud: {
    sections: [
      {
        rows: [
          { label: 'Storage', kind: 'value', value: '4.2 GB of 5 GB' },
          { label: 'Saved to iCloud', kind: 'value', value: '12 Apps' },
          { label: 'iCloud Backup', kind: 'value', value: 'On' },
          { label: 'Private Relay', kind: 'value', value: 'Off' },
        ],
      },
    ],
  },
  'Wallet & Apple Pay': {
    sections: [
      {
        rows: [
          { label: 'Add Card', kind: 'value', value: '' },
          { label: 'Double-Click Side Button', kind: 'toggle', initial: true },
          { label: 'Express Travel Card', kind: 'value', value: 'None' },
        ],
      },
    ],
  },
  Apps: {
    sections: [
      {
        rows: [
          { label: 'Default Apps', kind: 'value', value: '' },
          { label: 'App Store', kind: 'value', value: '' },
          { label: 'Calendar', kind: 'value', value: '' },
          { label: 'Camera', kind: 'value', value: '' },
          { label: 'Messages', kind: 'value', value: '' },
        ],
      },
    ],
  },
  About: {
    sections: [
      {
        rows: [
          { label: 'Name', kind: 'value', value: 'Hitesh’s iPhone' },
          { label: 'iOS Version', kind: 'value', value: '18.6.2' },
          { label: 'Model Name', kind: 'value', value: 'iPhone 15 Pro' },
          { label: 'Model Number', kind: 'value', value: 'MTV03HN/A' },
          { label: 'Serial Number', kind: 'value', value: 'D2K•••••••' },
        ],
      },
      {
        rows: [
          { label: 'Songs', kind: 'value', value: '326' },
          { label: 'Videos', kind: 'value', value: '18' },
          { label: 'Photos', kind: 'value', value: '2,418' },
          { label: 'Applications', kind: 'value', value: '94' },
          { label: 'Capacity', kind: 'value', value: '256 GB' },
          { label: 'Available', kind: 'value', value: '118.7 GB' },
        ],
      },
    ],
  },
  'Software Update': {
    footer: 'iOS automatically installs security responses and system files.',
    sections: [
      {
        rows: [
          { label: 'iOS 18.6.2', kind: 'value', value: 'Up to Date' },
          { label: 'Automatic Updates', kind: 'value', value: 'On' },
          { label: 'Beta Updates', kind: 'value', value: 'Off' },
        ],
      },
    ],
  },
  'iPhone Storage': {
    sections: [
      {
        rows: [
          { label: 'Used', kind: 'value', value: '137.3 GB of 256 GB' },
          { label: 'Offload Unused Apps', kind: 'toggle' },
        ],
      },
      {
        title: 'RECOMMENDATIONS',
        rows: [
          { label: 'Review Downloaded Videos', kind: 'value', value: '2.4 GB' },
          { label: 'Messages', kind: 'value', value: '8.1 GB' },
          { label: 'Photos', kind: 'value', value: '32.6 GB' },
        ],
      },
    ],
  },
  'AppleCare & Warranty': {
    sections: [
      {
        rows: [
          { label: 'This Device', kind: 'value', value: 'Limited Warranty' },
          { label: 'Coverage Details', kind: 'value', value: '' },
        ],
      },
    ],
  },
  AirDrop: {
    footer: 'AirDrop lets you share instantly with nearby Apple devices.',
    sections: [
      {
        rows: [
          { label: 'Receiving Off', kind: 'toggle' },
          { label: 'Contacts Only', kind: 'toggle', initial: true },
          { label: 'Everyone for 10 Minutes', kind: 'toggle' },
        ],
      },
      { rows: [{ label: 'Bringing Devices Together', kind: 'toggle', initial: true }] },
    ],
  },
  'AirPlay & Continuity': {
    sections: [
      {
        rows: [
          { label: 'Automatically AirPlay', kind: 'value', value: 'Ask' },
          { label: 'Transfer to HomePod', kind: 'toggle', initial: true },
          { label: 'Handoff', kind: 'toggle', initial: true },
          { label: 'Continuity Camera', kind: 'toggle', initial: true },
        ],
      },
    ],
  },
  'Picture in Picture': {
    sections: [
      { rows: [{ label: 'Start PiP Automatically', kind: 'toggle', initial: true }] },
    ],
  },
  'Language & Region': {
    sections: [
      {
        rows: [
          { label: 'Preferred Languages', kind: 'value', value: 'English' },
          { label: 'Region', kind: 'value', value: 'India' },
          { label: 'Calendar', kind: 'value', value: 'Gregorian' },
          { label: 'Temperature System', kind: 'value', value: '°C' },
          { label: 'Measurement System', kind: 'value', value: 'Metric' },
        ],
      },
    ],
  },
  Dictionary: {
    sections: [
      {
        rows: [
          { label: 'Apple Dictionary', kind: 'toggle', initial: true },
          { label: 'English', kind: 'toggle', initial: true },
          { label: 'Hindi–English', kind: 'toggle' },
        ],
      },
    ],
  },
  Fonts: {
    footer: 'Fonts can be downloaded from the App Store and used in documents.',
    sections: [{ rows: [{ label: 'No Fonts Installed', kind: 'value', value: '' }] }],
  },
  'Transfer or Reset iPhone': {
    sections: [
      {
        rows: [
          { label: 'Prepare for New iPhone', kind: 'value', value: 'Get Started' },
          { label: 'Reset', kind: 'value', value: '' },
          { label: 'Erase All Content and Settings', kind: 'value', value: '' },
        ],
      },
    ],
  },
  'Legal & Regulatory': {
    sections: [
      {
        rows: [
          { label: 'Legal Notices', kind: 'value', value: '' },
          { label: 'RF Exposure', kind: 'value', value: '' },
          { label: 'Regulatory', kind: 'value', value: '' },
        ],
      },
    ],
  },
  Family: {
    sections: [
      {
        rows: [
          { label: 'Hitesh Kumar', kind: 'value', value: 'Organiser' },
          { label: 'Add Member', kind: 'value', value: '' },
          { label: 'Subscriptions', kind: 'value', value: '' },
          { label: 'Purchase Sharing', kind: 'value', value: 'On' },
          { label: 'Location Sharing', kind: 'value', value: 'On' },
        ],
      },
    ],
  },
  Developer: {
    sections: [
      {
        rows: [
          { label: 'Developer Mode', kind: 'toggle' },
          { label: 'Logging', kind: 'value', value: '' },
          { label: 'Networking', kind: 'value', value: '' },
          { label: 'Graphics', kind: 'value', value: '' },
        ],
      },
    ],
  },
};

function FunctionalSettings({ title }: { title: string }) {
  const definition = detailContent[title] ?? {
    footer: `Changes to ${title} are kept for this demo session.`,
    sections: [{ rows: [{ label: title, kind: 'toggle' as const, initial: true }] }],
  };
  const initial = Object.fromEntries(
    definition.sections
      .flatMap((section) => section.rows)
      .filter((row) => row.kind === 'toggle')
      .map((row) => [row.label, row.initial ?? false]),
  );
  const [toggles, setToggles] = useState<Record<string, boolean>>(initial);
  const toast = useToast();
  return (
    <>
      {definition.sections.map((section, index) => (
        <Group
          key={`${title}-${index}`}
          title={section.title}
          footer={
            index === definition.sections.length - 1 ? definition.footer : undefined
          }
        >
          {section.rows.map((row) =>
            row.kind === 'toggle' ? (
              <SettingsRow
                key={row.label}
                label={row.label}
                note={row.note}
                toggle={{
                  checked: toggles[row.label] ?? false,
                  onChange: (checked) =>
                    setToggles((current) => ({ ...current, [row.label]: checked })),
                }}
              />
            ) : (
              <SettingsRow
                key={row.label}
                label={row.label}
                note={row.note}
                value={row.value}
                onPress={() => toast({ message: row.label })}
              />
            ),
          )}
        </Group>
      ))}
    </>
  );
}

function WifiScreen() {
  const [wifi, setWifi] = useState(true);
  const [ask, setAsk] = useState(true);
  return (
    <DetailScreen title="Wi-Fi">
      <Group>
        <SettingsRow label="Wi-Fi" toggle={{ checked: wifi, onChange: setWifi }} />
      </Group>
      {wifi ? (
        <>
          <Group title="NETWORKS">
            <SettingsRow icon="check" label="Hitesh’s Wi-Fi" value="⌁  ⓘ" />
            <SettingsRow
              label="Studio 5G"
              value="⌁  🔒"
              onPress={() => haptics.selection()}
            />
            <SettingsRow
              label="The Internet"
              value="⌁  🔒"
              onPress={() => haptics.selection()}
            />
            <SettingsRow label="Other…" onPress={() => haptics.selection()} />
          </Group>
          <Group footer="Known networks will be joined automatically. If no known networks are available, you will be notified of available networks.">
            <SettingsRow
              label="Ask to Join Networks"
              toggle={{ checked: ask, onChange: setAsk }}
            />
            <SettingsRow
              label="Auto-Join Hotspot"
              value="Ask to Join"
              onPress={() => haptics.selection()}
            />
          </Group>
        </>
      ) : (
        <p className="center-note">
          AirDrop, AirPlay, and location accuracy require Wi-Fi.
        </p>
      )}
    </DetailScreen>
  );
}

function BluetoothScreen() {
  const [enabled, setEnabled] = useState(true);
  return (
    <DetailScreen title="Bluetooth">
      <Group>
        <SettingsRow
          label="Bluetooth"
          toggle={{ checked: enabled, onChange: setEnabled }}
        />
      </Group>
      {enabled ? (
        <Group title="MY DEVICES">
          <SettingsRow label="AirPods Pro" value="Connected  ⓘ" />
          <SettingsRow label="Apple Watch" value="Connected  ⓘ" />
          <SettingsRow label="Magic Keyboard" value="Not Connected  ⓘ" />
        </Group>
      ) : null}
      <p className="discoverable">Now discoverable as “Hitesh’s iPhone”.</p>
    </DetailScreen>
  );
}

function GeneralScreen() {
  const nav = useMobileStack();
  const open = (title: string) =>
    nav.push(<DetailScreen title={title} />, {
      key: title.toLowerCase().replaceAll(' ', '-'),
    });
  return (
    <DetailScreen title="General">
      <Group>
        <SettingsRow icon="info" label="About" onPress={() => open('About')} />
        <SettingsRow
          icon="update"
          label="Software Update"
          badge="1"
          onPress={() => open('Software Update')}
        />
      </Group>
      <Group>
        <SettingsRow
          icon="storage"
          label="iPhone Storage"
          onPress={() => open('iPhone Storage')}
        />
        <SettingsRow
          icon="icloud"
          label="AppleCare & Warranty"
          onPress={() => open('AppleCare & Warranty')}
        />
      </Group>
      <Group>
        <SettingsRow
          icon="general"
          label="AirDrop"
          value="Contacts Only"
          onPress={() => open('AirDrop')}
        />
        <SettingsRow
          icon="general"
          label="AirPlay & Continuity"
          onPress={() => open('AirPlay & Continuity')}
        />
        <SettingsRow
          icon="general"
          label="Picture in Picture"
          onPress={() => open('Picture in Picture')}
        />
      </Group>
      <Group>
        <SettingsRow
          icon="language"
          label="Language & Region"
          onPress={() => open('Language & Region')}
        />
        <SettingsRow
          icon="general"
          label="Dictionary"
          onPress={() => open('Dictionary')}
        />
        <SettingsRow icon="general" label="Fonts" onPress={() => open('Fonts')} />
      </Group>
      <Group>
        <SettingsRow
          icon="transfer"
          label="Transfer or Reset iPhone"
          onPress={() => open('Transfer or Reset iPhone')}
        />
        <SettingsRow
          icon="legal"
          label="Legal & Regulatory"
          onPress={() => open('Legal & Regulatory')}
        />
      </Group>
    </DetailScreen>
  );
}

function DisplayScreen() {
  const [appearance, setAppearance] = useState<'light' | 'dark'>('light');
  const [automatic, setAutomatic] = useState(false);
  const [trueTone, setTrueTone] = useState(true);
  const [raiseToWake, setRaiseToWake] = useState(true);
  useEffect(() => {
    document.documentElement.style.colorScheme = appearance;
    document.documentElement.dataset.pwacnTheme = appearance;
  }, [appearance]);
  return (
    <DetailScreen title="Display & Brightness">
      <Group title="APPEARANCE">
        <div className="appearance-previews">
          <Pressable feedback="none" onPress={() => setAppearance('light')}>
            <span className="appearance-card light">
              <i />
              <i />
              <i />
            </span>
            <b>{appearance === 'light' ? '✓ ' : ''}Light</b>
          </Pressable>
          <Pressable feedback="none" onPress={() => setAppearance('dark')}>
            <span className="appearance-card dark">
              <i />
              <i />
              <i />
            </span>
            <b>{appearance === 'dark' ? '✓ ' : ''}Dark</b>
          </Pressable>
        </div>
        <SettingsRow
          label="Automatic"
          toggle={{ checked: automatic, onChange: setAutomatic }}
        />
      </Group>
      <Group title="BRIGHTNESS">
        <input
          className="brightness"
          aria-label="Brightness"
          type="range"
          defaultValue="68"
        />
        <SettingsRow
          label="True Tone"
          toggle={{ checked: trueTone, onChange: setTrueTone }}
        />
      </Group>
      <Group>
        <SettingsRow
          label="Night Shift"
          value="Off"
          onPress={() => haptics.selection()}
        />
        <SettingsRow
          label="Auto-Lock"
          value="2 Minutes"
          onPress={() => haptics.selection()}
        />
        <SettingsRow
          label="Raise to Wake"
          toggle={{ checked: raiseToWake, onChange: setRaiseToWake }}
        />
      </Group>
    </DetailScreen>
  );
}

function BatteryScreen() {
  const [lowPower, setLowPower] = useState(false);
  const [percent, setPercent] = useState(true);
  const [period, setPeriod] = useState<'day' | 'week'>('day');
  return (
    <DetailScreen title="Battery">
      <Group>
        <SettingsRow
          label="Battery Percentage"
          toggle={{ checked: percent, onChange: setPercent }}
        />
        <SettingsRow
          label="Low Power Mode"
          toggle={{ checked: lowPower, onChange: setLowPower }}
        />
      </Group>
      <section className="battery-card">
        <h3>Last 24 Hours</h3>
        <SegmentedControl
          value={period}
          onValueChange={setPeriod}
          label="Battery period"
          items={[
            { value: 'day', label: 'Last 24 Hours' },
            { value: 'week', label: 'Last 10 Days' },
          ]}
        />
        <div className="battery-chart">
          {[
            70, 74, 68, 62, 55, 48, 81, 78, 74, 69, 65, 61, 58, 54, 49, 45, 38, 33, 72,
            68, 63, 58, 53, 48,
          ].map((height, i) => (
            <i key={i} style={{ height: `${height}%` }} />
          ))}
        </div>
        <div className="chart-axis">
          <span>12 AM</span>
          <span>6 AM</span>
          <span>12 PM</span>
          <span>6 PM</span>
        </div>
      </section>
    </DetailScreen>
  );
}

function DeveloperFeelScreen() {
  const [sheet, setSheet] = useState(false);
  const telemetry = useFeelTelemetry();
  const summary = telemetry.summary;
  return (
    <>
      <DetailScreen title="Developer">
        <section className="feel-demo-card">
          <span>PWACN FEEL LAB</span>
          <h2>Interaction Feel Lab</h2>
          <p>
            Test contact response, drag continuity, interruption, and route commitment
            with the same primitives used by the app.
          </p>
          <Pressable
            className="feel-demo-press-target"
            onPress={() => undefined}
            aria-label="Press feel target"
          >
            <span>PRESS + DRAG</span>
            <b>Hold, leave, return</b>
          </Pressable>
          <Pressable
            className="feel-demo-button"
            onPress={() => {
              telemetry.clear();
              setSheet(true);
            }}
          >
            Open sheet test <b>↑</b>
          </Pressable>
        </section>
        <Group
          title="CANONICAL TESTS"
          footer="For interactive back, swipe right from the screen body. The physical left edge stays reserved for the system browser gesture."
        >
          <SettingsRow label="Press" value="Hold · leave · return" />
          <SettingsRow label="Sheet" value="Drag · flick · interrupt" />
          <SettingsRow label="Back" value="Edge drag · reverse" />
        </Group>
        <Group
          title="LAST RUN"
          footer="These values describe the browser motion model. Judge final feel with your thumb on this device."
        >
          <SettingsRow label="State" value={telemetry.current?.state ?? 'Ready'} />
          <SettingsRow
            label="Tracking error"
            value={
              summary.meanTrackingErrorPx == null
                ? '—'
                : `${summary.meanTrackingErrorPx.toFixed(1)} px`
            }
          />
          <SettingsRow
            label="Velocity continuity"
            value={
              summary.velocityContinuity == null
                ? '—'
                : summary.velocityContinuity.toFixed(2)
            }
          />
          <SettingsRow
            label="Settle time"
            value={
              summary.settleTimeMs == null ? '—' : `${summary.settleTimeMs.toFixed(0)} ms`
            }
          />
        </Group>
      </DetailScreen>
      <BottomSheet
        open={sheet}
        onOpenChange={setSheet}
        title="Bottom Sheet feel test"
        snapPoints={[0.35, 0.62, 0.92]}
        initialSnap={0.62}
        className="settings-feel-sheet"
      >
        <SheetScrollArea className="settings-feel-scroll">
          <div className="settings-feel-readout" aria-live="polite">
            <span>LIVE / {telemetry.current?.state ?? 'READY'}</span>
            <strong>
              {Math.round(Math.abs(telemetry.current?.surfaceVelocityY ?? 0))}
              <small> px/s</small>
            </strong>
            <p>Surface velocity</p>
          </div>
          <h2>Move this surface.</h2>
          <p>
            The backdrop, surface, and release spring are driven by the same continuous
            motion value. A second touch should take control immediately.
          </p>
          {Array.from({ length: 9 }, (_, index) => (
            <div className="settings-feel-row" key={index}>
              <span>Scroll sample {index + 1}</span>
              <small>{index % 2 ? 'boundary' : 'content'}</small>
            </div>
          ))}
          <SheetClose className="settings-feel-close">Close feel test</SheetClose>
        </SheetScrollArea>
      </BottomSheet>
    </>
  );
}

function AppleAccountScreen() {
  const [sheet, setSheet] = useState(false);
  return (
    <>
      <DetailScreen title="Apple Account">
        <section className="account-hero">
          <span>HK</span>
          <h2>Hitesh Kumar</h2>
          <p>hitesh@example.com</p>
        </section>
        <Group>
          <SettingsRow
            icon="info"
            label="Personal Information"
            onPress={() => setSheet(true)}
          />
          <SettingsRow
            icon="lock"
            label="Sign-In & Security"
            onPress={() => setSheet(true)}
          />
          <SettingsRow
            icon="wallet"
            label="Payment & Shipping"
            onPress={() => setSheet(true)}
          />
        </Group>
        <Group>
          <SettingsRow
            icon="icloud"
            label="iCloud"
            value="4.2 GB"
            onPress={() => setSheet(true)}
          />
          <SettingsRow icon="family" label="Family" onPress={() => setSheet(true)} />
          <SettingsRow icon="location" label="Find My" onPress={() => setSheet(true)} />
        </Group>
        <Group>
          <SettingsRow label="Sign Out" destructive onPress={() => setSheet(true)} />
        </Group>
      </DetailScreen>
      <ActionSheet
        open={sheet}
        onOpenChange={setSheet}
        title="Account actions"
        items={[
          { label: 'View Account Details', onSelect: () => {} },
          { label: 'Manage on the Web', onSelect: () => {} },
          { label: 'Cancel', onSelect: () => {} },
        ]}
      />
    </>
  );
}

function HomeIndicator() {
  return <span className="home-indicator" aria-hidden="true" />;
}

function SettingsHome() {
  const nav = useMobileStack();
  const [query, setQuery] = useState('');
  const [airplane, setAirplane] = useState(false);
  const routes = useMemo<Record<string, ReactNode>>(
    () => ({
      'Wi-Fi': <WifiScreen />,
      Bluetooth: <BluetoothScreen />,
      General: <GeneralScreen />,
      'Display & Brightness': <DisplayScreen />,
      Battery: <BatteryScreen />,
      Developer: <DeveloperFeelScreen />,
      'Apple Account': <AppleAccountScreen />,
    }),
    [],
  );
  const open = (title: string) =>
    nav.push(routes[title] ?? <DetailScreen title={title} />, {
      key: title.toLowerCase().replaceAll(' ', '-'),
    });
  const groups: RowProps[][] = [
    [
      {
        icon: 'airplane',
        label: 'Airplane Mode',
        toggle: { checked: airplane, onChange: setAirplane },
      },
      {
        icon: 'wifi',
        label: 'Wi-Fi',
        value: airplane ? 'Off' : 'Hitesh’s Wi-Fi',
        onPress: () => open('Wi-Fi'),
      },
      {
        icon: 'bluetooth',
        label: 'Bluetooth',
        value: airplane ? 'Off' : 'On',
        onPress: () => open('Bluetooth'),
      },
      {
        icon: 'cellular',
        label: 'Mobile Service',
        onPress: () => open('Mobile Service'),
      },
      {
        icon: 'hotspot',
        label: 'Personal Hotspot',
        value: 'Off',
        onPress: () => open('Personal Hotspot'),
      },
      { icon: 'battery', label: 'Battery', onPress: () => open('Battery') },
    ],
    [
      { icon: 'general', label: 'General', badge: '1', onPress: () => open('General') },
      {
        icon: 'accessibility',
        label: 'Accessibility',
        onPress: () => open('Accessibility'),
      },
      { icon: 'action', label: 'Action Button', onPress: () => open('Action Button') },
      { icon: 'camera', label: 'Camera', onPress: () => open('Camera') },
      { icon: 'control', label: 'Control Centre', onPress: () => open('Control Centre') },
      {
        icon: 'display',
        label: 'Display & Brightness',
        onPress: () => open('Display & Brightness'),
      },
      {
        icon: 'home',
        label: 'Home Screen & App Library',
        onPress: () => open('Home Screen & App Library'),
      },
      { icon: 'search', label: 'Search', onPress: () => open('Search') },
      { icon: 'standby', label: 'StandBy', onPress: () => open('StandBy') },
      { icon: 'wallpaper', label: 'Wallpaper', onPress: () => open('Wallpaper') },
    ],
    [
      {
        icon: 'notifications',
        label: 'Notifications',
        onPress: () => open('Notifications'),
      },
      {
        icon: 'sounds',
        label: 'Sounds & Haptics',
        onPress: () => open('Sounds & Haptics'),
      },
      { icon: 'focus', label: 'Focus', onPress: () => open('Focus') },
      { icon: 'screen', label: 'Screen Time', onPress: () => open('Screen Time') },
    ],
    [
      { icon: 'siri', label: 'Siri', onPress: () => open('Siri') },
      {
        icon: 'faceid',
        label: 'Face ID & Passcode',
        onPress: () => open('Face ID & Passcode'),
      },
      { icon: 'sos', label: 'Emergency SOS', onPress: () => open('Emergency SOS') },
      {
        icon: 'exposure',
        label: 'Exposure Notifications',
        value: 'Off',
        onPress: () => open('Exposure Notifications'),
      },
      {
        icon: 'privacy',
        label: 'Privacy & Security',
        onPress: () => open('Privacy & Security'),
      },
    ],
    [
      { icon: 'game', label: 'Game Center', onPress: () => open('Game Center') },
      { icon: 'icloud', label: 'iCloud', onPress: () => open('iCloud') },
      {
        icon: 'wallet',
        label: 'Wallet & Apple Pay',
        onPress: () => open('Wallet & Apple Pay'),
      },
      { icon: 'apps', label: 'Apps', onPress: () => open('Apps') },
    ],
    [{ icon: 'developer', label: 'Developer', onPress: () => open('Developer') }],
  ];
  const filtered = query
    ? groups.flat().filter((row) => row.label.toLowerCase().includes(query.toLowerCase()))
    : null;
  return (
    <div className="ios-screen">
      <StatusBar />
      <main className="settings-scroll">
        <h1>Settings</h1>
        <label className="search-field">
          <svg viewBox="0 0 24 24">
            <circle cx="10.5" cy="10.5" r="6" />
            <path d="m15 15 5 5" />
          </svg>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search"
          />
          <span>⌕</span>
        </label>
        {filtered ? (
          <Group>
            {filtered.length ? (
              filtered.map((row) => <SettingsRow key={row.label} {...row} />)
            ) : (
              <div className="empty-results">No Settings Found</div>
            )}
          </Group>
        ) : (
          <>
            <Pressable
              className="account-card"
              feedback="opacity"
              onPress={() => open('Apple Account')}
            >
              <span className="account-avatar">HK</span>
              <span>
                <strong>Hitesh Kumar</strong>
                <small>Apple Account, iCloud and more</small>
              </span>
              <span className="chevron">›</span>
            </Pressable>
            <Group>
              <SettingsRow icon="family" label="Family" onPress={() => open('Family')} />
            </Group>
            {groups.map((rows, index) => (
              <Group key={index}>
                {rows.map((row) => (
                  <SettingsRow key={row.label} {...row} />
                ))}
              </Group>
            ))}
          </>
        )}
        <p className="ios-version">
          iOS
          <br />
          <span>Designed with pwacn</span>
        </p>
      </main>
      <HomeIndicator />
    </div>
  );
}

export function SettingsApp() {
  return (
    <ToastProvider>
      <div className="settings-stage">
        <div className="device-shell">
          <MobileStack initialScreen={<SettingsHome />} backGestureRegion="screen" />
        </div>
        <aside className="demo-caption">
          <strong>pwacn</strong>
          <span>Settings interaction benchmark</span>
          <small>Press rows · swipe right from the screen body · toggle controls</small>
        </aside>
      </div>
    </ToastProvider>
  );
}

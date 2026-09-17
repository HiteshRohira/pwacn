import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './styles.css';

const groups: { label: string; items: [string, string][] }[] = [
  {
    label: 'foundations',
    items: [
      [
        'Pressable',
        'Immediate contact feedback with cancellation and keyboard semantics.',
      ],
      ['MotionSurface', 'A low-level physical surface with semantic mass and depth.'],
      ['Draggable', 'Velocity-aware drag tracking, direction lock, and elastic bounds.'],
      ['SwipeTabs', 'Gesture-driven tab paging with interruptible spring settling.'],
      ['Viewport', 'Dynamic viewport, safe-area, and software keyboard measurements.'],
    ],
  },
  {
    label: 'controls',
    items: [
      ['MobileSwitch', 'An accessible switch with shared physical feedback.'],
      ['SegmentedControl', 'A keyboard-readable single-choice control.'],
      ['NavigationBar', 'Safe-area-aware compact and large-title navigation.'],
      ['ContextMenu', 'Long-press and secondary-click actions on an ActionSheet.'],
      ['Picker', 'A semantic mobile selection control.'],
      ['Toast', 'Polite live-region feedback with reduced-motion behavior.'],
      ['RefreshControl', 'Pull-to-refresh with scroll-boundary ownership.'],
      ['ReorderableList', 'Touch-friendly interruptible list reordering.'],
      ['Carousel', 'Accessible native scroll-snap paging.'],
    ],
  },
  {
    label: 'surfaces',
    items: [
      ['BottomSheet', 'Snap-height presentation, drag dismissal, focus, and safe areas.'],
      ['ActionSheet', 'A compact action list built on the sheet’s mechanics.'],
      ['FullScreenModal', 'Full-height modal presentation with spatial dismissal.'],
      ['Swipeable', 'Progressive action reveal with distance and velocity commit.'],
    ],
  },
  {
    label: 'navigation',
    items: [
      ['MobileStack', 'Explicit push, pop, replace, modal, and sheet geometry.'],
      ['SharedElement', 'Stable View Transition names with safe fallback behavior.'],
      ['stackReducer', 'Deterministic stack history and scroll-position storage.'],
    ],
  },
  {
    label: 'tooling',
    items: [
      ['CLI + registry', 'Own the source with init, add, diff, list, and doctor.'],
      ['ESLint plugin', 'Five rules that enforce coherent motion conventions.'],
      ['Haptics', 'Conservative web vibration with a custom adapter escape hatch.'],
      ['Sounds', 'Optional host-installed sound feedback with a silent web default.'],
    ],
  },
];

type Detail = {
  package: string;
  status: string;
  example: string;
  api: [string, string, string][];
  notes: string[];
};

const slugify = (name: string) =>
  name.toLowerCase().replaceAll(' ', '-').replaceAll('+', '');
const componentList = groups.flatMap((group) =>
  group.items.map(([name, description]) => ({
    name,
    description,
    group: group.label,
    slug: slugify(name),
  })),
);

const details: Record<string, Detail> = {
  pressable: {
    package: '@pwacn/react',
    status: 'stable prototype',
    example: `<Pressable mass="control" onPress={save}>\n  Save changes\n</Pressable>`,
    api: [
      ['as', 'ElementType', "'button'"],
      ['mass', 'MassClass', "'control'"],
      ['feedback', "'scale' | 'opacity' | 'none'", "'scale'"],
      ['onPress', '(event) => void', '—'],
      ['disabled', 'boolean', 'false'],
    ],
    notes: [
      'Responds immediately on pointer-down.',
      'Cancels when travel exceeds tolerance or leaves the hit area.',
      'Custom elements receive keyboard button semantics.',
    ],
  },
  motionsurface: {
    package: '@pwacn/react',
    status: 'experimental',
    example: `<MotionSurface mass="surface" depth="raised">\n  <Card />\n</MotionSurface>`,
    api: [
      ['mass', 'MassClass', "'surface'"],
      ['depth', 'Depth', "'base'"],
      ['transition', 'Motion transition', 'semantic snap'],
    ],
    notes: [
      'Composes semantic mass with a shared spring preset.',
      'Depth controls coordinated elevation rather than visual theme.',
      'Honors the operating system reduced-motion preference.',
    ],
  },
  draggable: {
    package: '@pwacn/react',
    status: 'experimental',
    example: `<Draggable\n  axis="x"\n  min={0}\n  max={280}\n  onDragEnd={(value, velocity) => settle(value, velocity)}\n/>`,
    api: [
      ['axis', "'x' | 'y'", "'x'"],
      ['min / max', 'number', 'unbounded'],
      ['elasticity', 'number', '0.12'],
      ['onDragEnd', '(value, velocity) => void', '—'],
    ],
    notes: [
      'Locks direction only after intent is clear.',
      'Tracks velocity without per-frame React state.',
      'Applies elastic resistance outside configured bounds.',
    ],
  },
  swipetabs: {
    package: '@pwacn/react',
    status: 'experimental',
    example: `<SwipeTabs
  value={feed}
  onValueChange={setFeed}
  ariaLabel="Feed selection"
  items={feeds}
/>`,
    api: [
      ['value', 'string', 'required'],
      ['onValueChange', '(value) => void', 'required'],
      ['items', 'SwipeTabItem[]', 'required'],
      ['ariaLabel', 'string', "'Content tabs'"],
    ],
    notes: [
      'Keeps adjacent panels on one continuous horizontal plane.',
      'Transfers control to the finger after direction lock and accepts interruption.',
      'Supports arrow, Home, and End keys with linked tab and panel semantics.',
    ],
  },
  viewport: {
    package: '@pwacn/react',
    status: 'stable prototype',
    example: `const viewport = useMobileViewport();\n\n// size, keyboard, offset, and safe-area insets`,
    api: [
      ['width / height', 'number', 'visual viewport'],
      ['keyboardHeight', 'number', '0'],
      ['keyboardOpen', 'boolean', 'false'],
      ['safeArea', '{ top, right, bottom, left }', 'CSS env()'],
      ['offsetTop', 'number', '0'],
    ],
    notes: [
      'Prefers VisualViewport and falls back to window dimensions.',
      'Publishes viewport and keyboard CSS variables.',
      'Uses CSS viewport units where JavaScript is unnecessary.',
    ],
  },
  bottomsheet: {
    package: '@pwacn/react',
    status: 'flagship prototype',
    example: `<BottomSheet\n  open={open}\n  onOpenChange={setOpen}\n  snapPoints={[0.55, 0.9]}\n  title="Comments"\n>\n  <SheetScrollArea>…</SheetScrollArea>\n</BottomSheet>`,
    api: [
      ['open', 'boolean', 'required'],
      ['onOpenChange', '(open) => void', 'required'],
      ['snapPoints', 'number[]', '[0.55, 0.9]'],
      ['dismissible', 'boolean', 'true'],
      ['title', 'string', "'Sheet'"],
    ],
    notes: [
      'Projects release velocity to the nearest stable snap point.',
      'Hands downward scroll to the sheet at the content boundary.',
      'Traps focus, inerts the background, and restores focus on close.',
    ],
  },
  actionsheet: {
    package: '@pwacn/react',
    status: 'experimental',
    example: `<ActionSheet\n  open={open}\n  onOpenChange={setOpen}\n  items={[{ label: 'Delete', destructive: true, onSelect: remove }]}\n/>`,
    api: [
      ['items', 'ActionSheetItem[]', 'required'],
      ['open', 'boolean', 'required'],
      ['onOpenChange', '(open) => void', 'required'],
    ],
    notes: [
      'Built directly on BottomSheet mechanics.',
      'Supports destructive and disabled action semantics.',
      'Closes after a successful selection.',
    ],
  },
  fullscreenmodal: {
    package: '@pwacn/react',
    status: 'experimental',
    example: `<FullScreenModal open={open} onOpenChange={setOpen} title="Compose">\n  <Compose />\n</FullScreenModal>`,
    api: [
      ['open', 'boolean', 'required'],
      ['onOpenChange', '(open) => void', 'required'],
      ['dismissible', 'boolean', 'true'],
    ],
    notes: [
      'Uses full viewport height and safe-area padding.',
      'Enters and exits with modal spatial semantics.',
      'Shares focus and reduced-motion behavior with BottomSheet.',
    ],
  },
  swipeable: {
    package: '@pwacn/react',
    status: 'stable prototype',
    example: `<Swipeable\n  direction="left"\n  action={<ArchiveAction />}\n  onCommit={archive}\n>\n  <MessageRow />\n</Swipeable>`,
    api: [
      ['direction', "'left' | 'right'", "'left'"],
      ['actionWidth', 'number', '96'],
      ['action', 'ReactNode', '—'],
      ['onCommit', '() => void', '—'],
    ],
    notes: [
      'Commits from progress or release velocity.',
      'Preserves native vertical scrolling through direction lock.',
      'Adds resistance after the action width is reached.',
    ],
  },
  mobilestack: {
    package: '@pwacn/react',
    status: 'experimental',
    example: `<MobileStack initialScreen={<Feed />} />\n\nconst stack = useMobileStack();\nstack.push(<Post />, { presentation: 'push' });`,
    api: [
      ['initialScreen', 'ReactNode', 'required'],
      ['push', '(node, options) => void', '—'],
      ['pop', '() => void', '—'],
      ['replace', '(node, options) => void', '—'],
      ['history', "'browser' | 'memory'", "'browser'"],
    ],
    notes: [
      'Direction comes from stack semantics, never pathname guessing.',
      'Distinguishes push and modal presentation geometry.',
      'Synchronizes browser history and restores per-screen scroll positions.',
      'Interactive back begins only inside the leading-edge capture region.',
    ],
  },
  sharedelement: {
    package: '@pwacn/react',
    status: 'progressive enhancement',
    example: `<SharedElement id={\`photo-\${photo.id}\`}>\n  <img src={photo.src} alt="" />\n</SharedElement>`,
    api: [
      ['id', 'string', 'required'],
      ['children', 'ReactNode', 'required'],
    ],
    notes: [
      'Creates a stable, sanitized view-transition-name.',
      'Remains a normal wrapper when View Transitions are unavailable.',
      'Best reserved for meaningful spatial continuity.',
    ],
  },
  stackreducer: {
    package: '@pwacn/core',
    status: 'stable utility',
    example: `const next = stackReducer(state, {\n  type: 'push',\n  entry: { key, pathname, presentation: 'push' }\n});`,
    api: [
      ['state', 'StackState', 'required'],
      ['action', 'StackAction', 'required'],
      ['presentation', "'push' | 'modal' | 'sheet'", "'push'"],
    ],
    notes: [
      'Pure and deterministically unit tested.',
      'Stores optional scroll position per entry.',
      'Never pops the root entry.',
    ],
  },
  'cli--registry': {
    package: 'pwacn',
    status: 'working prototype',
    example: `npx pwacn init\nnpx pwacn list\nnpx pwacn add pressable sheet\nnpx pwacn diff\nnpx pwacn doctor`,
    api: [
      ['init', 'command', 'creates pwacn.json'],
      ['add', 'command', 'copies dependencies'],
      ['diff', 'command', 'compares hashes'],
      ['list', 'command', 'shows registry and install state'],
      ['doctor', 'command', 'validates installed files'],
    ],
    notes: [
      'Generated source belongs to the consumer.',
      'Dependencies are resolved before components are copied.',
      'Diff reports local customization without overwriting it.',
    ],
  },
  'eslint-plugin': {
    package: '@pwacn/eslint-plugin',
    status: 'experimental',
    example: `rules: {\n  '@pwacn/no-arbitrary-spring': 'warn',\n  '@pwacn/prefer-pressable': 'warn'\n}`,
    api: [
      ['no-arbitrary-spring', 'rule', 'warn'],
      ['prefer-pressable', 'rule', 'warn'],
      ['require-reduced-motion', 'rule', 'warn'],
      ['prefer-mobile-surface', 'rule', 'warn'],
      ['no-arbitrary-transition-duration', 'rule', 'warn'],
    ],
    notes: [
      'Rules are intentionally advisory in v0.',
      'Focuses on application code rather than library internals.',
      'Encourages semantic motion without blocking escape hatches.',
    ],
  },
  haptics: {
    package: '@pwacn/core',
    status: 'progressive enhancement',
    example: `haptics.selection();\nhaptics.impact('light');\nhaptics.success();\n\nhaptics.install(nativeAdapter);`,
    api: [
      ['selection', '() => void', '—'],
      ['impact', "('light' | 'medium') => void", "'light'"],
      ['success / warning', '() => void', '—'],
      ['install', '(adapter) => void', 'web vibration'],
    ],
    notes: [
      'Uses short, conservative vibration patterns.',
      'Silently no-ops when vibration is unavailable.',
      'A custom adapter supports native wrappers such as Capacitor.',
    ],
  },
};

const code = `import { BottomSheet, Pressable } from '@pwacn/react';

<Pressable onPress={() => setOpen(true)}>
  Open comments
</Pressable>

<BottomSheet
  open={open}
  onOpenChange={setOpen}
  snapPoints={[0.55, 0.9]}
>
  <Comments />
</BottomSheet>`;

function Header() {
  return (
    <header>
      <a href="/" className="brand">
        <i>p</i> pwacn <sup>docs</sup>
      </a>
      <nav>
        <a href="/#components">Components</a>
        <a href="/#tooling">Tooling</a>
        <a href="/#start">Start</a>
      </nav>
      <a className="lab-link" href={import.meta.env.VITE_PLAYGROUND_URL ?? '#'}>
        Open playground ↗
      </a>
    </header>
  );
}

function Footer() {
  return (
    <footer>
      <span className="brand">
        <i>p</i> pwacn
      </span>
      <p>Native mechanics. Custom aesthetics.</p>
      <span>experimental / 2026</span>
    </footer>
  );
}

function ComponentPage({ slug }: { slug: string }) {
  const item = componentList.find((candidate) => candidate.slug === slug);
  if (!item) {
    return (
      <div className="site-shell">
        <Header />
        <main className="not-found">
          <span className="stamp">404 / unknown primitive</span>
          <h1>
            Nothing has
            <br />
            that geometry.
          </h1>
          <a href="/#components">← Return to component index</a>
        </main>
        <Footer />
      </div>
    );
  }
  const detail =
    details[slug] ??
    ({
      package: slug === 'sounds' ? '@pwacn/core' : '@pwacn/react',
      status: 'experimental',
      example: `import { ${item.name.replaceAll(' ', '')} } from '${slug === 'sounds' ? '@pwacn/core' : '@pwacn/react'}';`,
      api: [['See TypeScript declarations', 'typed API', '—']],
      notes: [
        item.description,
        'Uses pwacn motion, accessibility, and reduced-motion conventions.',
        'Exercised in the interaction playground before promotion to stable.',
      ],
    } satisfies Detail);
  const index = componentList.indexOf(item);
  const previous = componentList[index - 1];
  const next = componentList[index + 1];
  return (
    <div className="site-shell">
      <Header />
      <main className="component-page">
        <section className="component-hero">
          <div className="breadcrumbs">
            <a href="/#components">Components</a>
            <span>/</span>
            <span>{item.group}</span>
          </div>
          <div className="component-number">{String(index + 1).padStart(2, '0')}</div>
          <h1>{item.name}</h1>
          <p>{item.description}</p>
          <div className="component-meta">
            <span>
              <small>package</small>
              {detail.package}
            </span>
            <span>
              <small>status</small>
              {detail.status}
            </span>
          </div>
        </section>

        <section className="component-body">
          <aside>
            <a href="#usage">Usage</a>
            <a href="#api">API</a>
            <a href="#behavior">Behavior</a>
          </aside>
          <div>
            <section id="usage" className="doc-section">
              <span className="doc-label">01 / usage</span>
              <div className="doc-heading">
                <h2>Describe intent.</h2>
                <p>
                  Physics stays inside the primitive; application code stays readable.
                </p>
              </div>
              <div className="code-block">
                <div>
                  <span>{detail.package}</span>
                  <button onClick={() => navigator.clipboard?.writeText(detail.example)}>
                    copy
                  </button>
                </div>
                <pre>
                  <code>{detail.example}</code>
                </pre>
              </div>
            </section>
            <section id="api" className="doc-section">
              <span className="doc-label">02 / API</span>
              <div className="doc-heading">
                <h2>Public surface.</h2>
                <p>Semantic inputs first. Raw physics remain implementation details.</p>
              </div>
              <div className="api-table">
                <div className="api-row api-head">
                  <span>property</span>
                  <span>type</span>
                  <span>default</span>
                </div>
                {detail.api.map(([name, type, defaultValue]) => (
                  <div className="api-row" key={name}>
                    <code>{name}</code>
                    <span>{type}</span>
                    <span>{defaultValue}</span>
                  </div>
                ))}
              </div>
            </section>
            <section id="behavior" className="doc-section">
              <span className="doc-label">03 / behavior contract</span>
              <div className="doc-heading">
                <h2>What it guarantees.</h2>
              </div>
              <ol className="behavior-list">
                {detail.notes.map((note, noteIndex) => (
                  <li key={note}>
                    <span>0{noteIndex + 1}</span>
                    {note}
                  </li>
                ))}
              </ol>
            </section>
          </div>
        </section>

        <nav className="page-pagination" aria-label="Component pages">
          {previous ? (
            <a href={`/components/${previous.slug}`}>
              <small>← previous</small>
              <strong>{previous.name}</strong>
            </a>
          ) : (
            <span />
          )}
          {next ? (
            <a href={`/components/${next.slug}`}>
              <small>next →</small>
              <strong>{next.name}</strong>
            </a>
          ) : (
            <a href="/#components">
              <small>index →</small>
              <strong>All components</strong>
            </a>
          )}
        </nav>
      </main>
      <Footer />
    </div>
  );
}

function App() {
  const componentMatch = window.location.pathname.match(/^\/components\/([^/]+)\/?$/);
  if (componentMatch?.[1]) return <ComponentPage slug={componentMatch[1]} />;
  return (
    <div className="site-shell">
      <Header />
      <main id="top">
        <section className="hero">
          <span className="stamp">reference / v0.1 experimental</span>
          <h1>
            Mobile interactions that
            <br />
            <em>feel native.</em>
          </h1>
          <p>
            React primitives for mobile PWAs that respond on contact, carry velocity,
            preserve spatial context, and get out of your visual system’s way.
          </p>
          <div className="install">
            <code>pnpm add @pwacn/core @pwacn/react motion</code>
            <button
              onClick={() =>
                navigator.clipboard?.writeText('pnpm add @pwacn/core @pwacn/react motion')
              }
            >
              copy
            </button>
          </div>
        </section>

        <section className="manifesto">
          <div>
            <b>01</b>
            <strong>Touch</strong>
            <p>Every control answers on pointer-down.</p>
          </div>
          <div>
            <b>02</b>
            <strong>Motion</strong>
            <p>Semantic springs replace arbitrary timing.</p>
          </div>
          <div>
            <b>03</b>
            <strong>Space</strong>
            <p>Navigation carries explicit geometry.</p>
          </div>
          <div>
            <b>04</b>
            <strong>Access</strong>
            <p>Keyboard and reduced motion ship by default.</p>
          </div>
        </section>

        <section id="components" className="catalog">
          <aside>
            <span>inventory</span>
            <strong>14</strong>
            <small>public capabilities</small>
          </aside>
          <div className="catalog-main">
            <div className="section-title">
              <span>component index</span>
              <h2>Components</h2>
            </div>
            {groups.map((group, groupIndex) => (
              <div
                className="component-group"
                id={group.label === 'tooling' ? 'tooling' : undefined}
                key={group.label}
              >
                <h3>
                  <span>0{groupIndex + 1}</span>
                  {group.label}
                </h3>
                <div>
                  {group.items.map(([name, description], index) => (
                    <a
                      className="component-row"
                      href={`/components/${slugify(name)}`}
                      key={name}
                      aria-label={`Read ${name} documentation`}
                    >
                      <span>{String(index + 1).padStart(2, '0')}</span>
                      <h4>{name}</h4>
                      <p>{description}</p>
                      <i>→</i>
                    </a>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>

        <section id="start" className="start">
          <div>
            <span className="stamp">first contact</span>
            <h2>
              Start with primitives.
              <br />
              <em>Keep your design system.</em>
            </h2>
            <p>The system owns the values. Your product code describes intent.</p>
          </div>
          <pre>
            <code>{code}</code>
          </pre>
        </section>

        <section className="cli">
          <div>
            <span>open-code workflow</span>
            <h2>
              Open code.
              <br />
              <em>Owned by you.</em>
            </h2>
          </div>
          <ol>
            <li>
              <b>01</b>
              <code>npx pwacn init</code>
              <span>Configure the destination.</span>
            </li>
            <li>
              <b>02</b>
              <code>npx pwacn add sheet</code>
              <span>Resolve and copy dependencies.</span>
            </li>
            <li>
              <b>03</b>
              <code>npx pwacn diff</code>
              <span>Compare local source with registry.</span>
            </li>
          </ol>
        </section>
      </main>
      <Footer />
    </div>
  );
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

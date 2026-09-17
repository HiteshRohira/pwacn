import { gestures, haptics } from '@pwacn/core';
import {
  BottomSheet,
  Carousel,
  MobileSwitch,
  Pressable,
  RefreshControl,
  ReorderableList,
  SegmentedControl,
  SheetClose,
  SheetScrollArea,
  Swipeable,
  ToastProvider,
  useToast,
} from '@pwacn/react';
import { useState } from 'react';

type Mass = 'micro' | 'control' | 'surface';

function Lab() {
  const [sheet, setSheet] = useState(false);
  const [enabled, setEnabled] = useState(true);
  const [mass, setMass] = useState<Mass>('control');
  const [snap, setSnap] = useState(0.55);
  const [items, setItems] = useState(['Pressable', 'Sheet', 'Stack', 'Swipeable']);
  const [refreshes, setRefreshes] = useState(0);
  const toast = useToast();
  return (
    <main className="lab-shell">
      <header className="lab-header">
        <div>
          <span className="lab-kicker">PWACN / INTERACTION LAB</span>
          <h1>
            Physical controls,
            <br />
            measured in the hand.
          </h1>
        </div>
        <div className="lab-status">
          <i /> v0.1 instrumented
        </div>
      </header>
      <section className="lab-grid">
        <article className="lab-panel specimen-panel">
          <div className="panel-heading">
            <span>01</span>
            <h2>Press response</h2>
            <code>{mass}</code>
          </div>
          <div className="press-stage">
            <Pressable
              mass={mass}
              className="hero-control"
              onFeedback={() => enabled && haptics.impact('light')}
              onPress={() =>
                toast({ message: `${mass} press committed`, tone: 'success' })
              }
            >
              <span>PRESS + HOLD</span>
              <small>move outside to cancel</small>
            </Pressable>
          </div>
          <SegmentedControl
            className="lab-segments"
            label="Control mass"
            value={mass}
            onValueChange={setMass}
            items={[
              { value: 'micro', label: 'Micro' },
              { value: 'control', label: 'Control' },
              { value: 'surface', label: 'Surface' },
            ]}
          />
        </article>
        <article className="lab-panel telemetry-panel">
          <div className="panel-heading">
            <span>02</span>
            <h2>Gesture thresholds</h2>
            <code>LIVE TOKENS</code>
          </div>
          <dl className="metrics">
            <div>
              <dt>Edge capture</dt>
              <dd>{gestures.edgeBack.edgeWidth}px</dd>
            </div>
            <div>
              <dt>Swipe activation</dt>
              <dd>{gestures.swipe.activationDistance}px</dd>
            </div>
            <div>
              <dt>Commit progress</dt>
              <dd>{Math.round(gestures.swipe.commitDistance * 100)}%</dd>
            </div>
            <div>
              <dt>Sheet velocity</dt>
              <dd>{gestures.sheet.dismissVelocity}px/s</dd>
            </div>
          </dl>
          <label className="toggle-row">
            Haptic feedback{' '}
            <MobileSwitch
              label="Haptic feedback"
              checked={enabled}
              onCheckedChange={setEnabled}
            />
          </label>
        </article>
        <article className="lab-panel sheet-panel">
          <div className="panel-heading">
            <span>03</span>
            <h2>Spatial surfaces</h2>
            <code>{Math.round(snap * 100)}% SNAP</code>
          </div>
          <Pressable className="open-sheet" onPress={() => setSheet(true)}>
            Open multi-snap sheet <b>↑</b>
          </Pressable>
          <Swipeable
            action={<span className="delete-action">Delete</span>}
            onCommit={() => toast({ message: 'Swipe committed', tone: 'warning' })}
          >
            <div className="swipe-sample">
              <span>Swipe this row left</span>
              <small>distance + velocity</small>
            </div>
          </Swipeable>
        </article>
        <article className="lab-panel order-panel">
          <div className="panel-heading">
            <span>04</span>
            <h2>Interruptibility</h2>
            <code>DRAG TO ORDER</code>
          </div>
          <ReorderableList
            items={items}
            onReorder={setItems}
            renderItem={(item) => (
              <div className="order-row">
                <span>⠿</span>
                {item}
                <code>{items.indexOf(item) + 1}</code>
              </div>
            )}
          />
        </article>
        <article className="lab-panel carousel-panel">
          <div className="panel-heading">
            <span>05</span>
            <h2>Snap paging</h2>
            <code>SCROLL</code>
          </div>
          <Carousel label="Material samples">
            {['GLASS', 'PAPER', 'DEPTH'].map((item, index) => (
              <div className={`material material-${index}`} key={item}>
                <span>0{index + 1}</span>
                <strong>{item}</strong>
              </div>
            ))}
          </Carousel>
        </article>
        <article className="lab-panel refresh-panel">
          <div className="panel-heading">
            <span>06</span>
            <h2>Scroll handoff</h2>
            <code>{refreshes} REFRESH</code>
          </div>
          <RefreshControl onRefresh={async () => setRefreshes((value) => value + 1)}>
            <div className="refresh-content">
              <strong>Pull down from the top</strong>
              <span>
                Native scroll owns movement until its boundary transfers control.
              </span>
            </div>
          </RefreshControl>
        </article>
      </section>
      <BottomSheet
        open={sheet}
        onOpenChange={setSheet}
        title="Snap point laboratory"
        snapPoints={[0.35, 0.62, 0.92]}
        initialSnap={0.62}
        onSnapChange={setSnap}
        style={{ background: '#f1efe7', color: '#161812' }}
      >
        <SheetScrollArea className="lab-sheet-content">
          <p className="lab-kicker">GESTURE SURFACE / 03</p>
          <h2>Drag the handle between three stable resting points.</h2>
          <p>
            The scroll area keeps ownership while content can move. At the top boundary, a
            downward gesture hands control back to the sheet.
          </p>
          {Array.from({ length: 5 }, (_, index) => (
            <div className="sheet-test-row" key={index}>
              <span>Behavior check {index + 1}</span>
              <b>PASS</b>
            </div>
          ))}
          <SheetClose className="sheet-done">Done</SheetClose>
        </SheetScrollArea>
      </BottomSheet>
    </main>
  );
}

export function App() {
  return (
    <ToastProvider>
      <Lab />
    </ToastProvider>
  );
}

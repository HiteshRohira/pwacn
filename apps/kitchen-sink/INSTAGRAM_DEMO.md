# Instagram interaction demo

Open `/instagram` in the deployed kitchen sink. The route's PWA manifest sets its start URL to `/instagram`. All photos and short video clips are bundled locally for the offline build.

## What this exercises

- A normally scrolling photo feed with story rail, posts, double-tap likes, saved state, and a persistent tab bar.
- Full-height Reels with native vertical scroll snap. Only the visible Reel plays; opening comments or changing tabs pauses playback.
- Stories pushed through `MobileStack`, with timed progress, tap navigation, and back dismissal.
- A `BottomSheet` comment drawer that snaps, scrolls, and keeps its composer visible while the keyboard is open.

The content and comment changes are local demo state. Explore, creation, sharing, and activity are represented by small demo messages rather than backend flows.

## Framework findings

This demo needed three reusable pwacn additions:

1. `VerticalPager` for viewport-sized short-form media. Native scrolling and scroll snap handle finger movement; the primitive reports the active page so an app can manage playback.
2. `DoubleTapSurface` for a double-tap reaction without treating a scroll as a tap. `Pressable` remains the explicit accessible like control.
3. `BottomSheet.footer` for a composer pinned to the visible bottom edge through snap points, dragging, and keyboard resize. A regular flex footer fell below the viewport at partial snap points.

Potential next framework work to validate on real phones: a media playback coordinator for larger Reel feeds, gesture ownership between full-screen paging and nested scrolling, and a reusable timed-story controller with hold-to-pause and media preloading. This demo does not establish the physical-device feel of those interactions.

## Media

Photos are bundled from [Unsplash](https://unsplash.com/license). The `images.unsplash.com` photo IDs are `1533105079780-92b9be482077`, `1464822759023-fed622ff2c3b`, `1490750967868-88aa4486c946`, `1493246507139-91e8fad9978e`, `1500534623283-312aade485b7`, `1442512595331-e89e73853f31`, `1534528741775-53994a69daeb`, `1441974231531-c6227db76b6e`, `1500648767791-00dcc994a43e`, `1524504388940-b1c1722653e1`, and `1531123897727-8f129e1688ce`.

The three Reel clips are bundled from [Mixkit](https://mixkit.co/license/) preview assets: [beach 51500](https://mixkit.co/free-stock-video/discover/beach/?orientation=vertical), [forest 2187](https://mixkit.co/free-stock-video/discover/forest/?orientation=vertical), and [city 40746](https://mixkit.co/free-stock-video/discover/city/?orientation=vertical). Reel clips are muted in this interaction demo.

import { haptics } from '@pwacn/core';
import {
  BottomSheet,
  DoubleTapSurface,
  MobileScrollArea,
  MobileStack,
  Pressable,
  SheetScrollArea,
  ToastProvider,
  VerticalPager,
  useMobileStack,
  usePrefersReducedMotion,
  useToast,
} from '@pwacn/react';
import { useEffect, useRef, useState, type FormEvent, type ReactNode } from 'react';
import './instagram.css';

type IconName =
  | 'home'
  | 'reels'
  | 'user'
  | 'heart'
  | 'comment'
  | 'send'
  | 'bookmark'
  | 'more'
  | 'plus'
  | 'close'
  | 'back'
  | 'search'
  | 'pause'
  | 'play';

function Icon({
  name,
  size = 25,
  filled = false,
}: {
  name: IconName;
  size?: number;
  filled?: boolean;
}) {
  const common = {
    width: size,
    height: size,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 1.8,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    'aria-hidden': true as const,
  };
  const shapes: Record<IconName, ReactNode> = {
    home: (
      <>
        <path
          d="m3 10 9-7 9 7v10a1 1 0 0 1-1 1h-5v-7H9v7H4a1 1 0 0 1-1-1z"
          fill={filled ? 'currentColor' : 'none'}
        />
      </>
    ),
    reels: (
      <>
        <rect
          x="3"
          y="3"
          width="18"
          height="18"
          rx="4"
          fill={filled ? 'currentColor' : 'none'}
        />
        <path
          d="M3 9h18M8 3l4 6m3-6 4 6"
          stroke={filled ? 'var(--ig-icon-cutout, #fff)' : 'currentColor'}
        />
        <path
          d="m10 12 5 3-5 3z"
          fill={filled ? 'var(--ig-icon-cutout, #fff)' : 'currentColor'}
          stroke="none"
        />
      </>
    ),
    user: (
      <>
        <circle cx="12" cy="8" r="4" fill={filled ? 'currentColor' : 'none'} />
        <path d="M4.5 21c.5-4.5 3-7 7.5-7s7 2.5 7.5 7" />
      </>
    ),
    heart: (
      <path
        d="M20.8 5.6a5.4 5.4 0 0 0-7.6 0L12 6.8l-1.2-1.2a5.4 5.4 0 0 0-7.6 7.6L12 22l8.8-8.8a5.4 5.4 0 0 0 0-7.6Z"
        fill={filled ? 'currentColor' : 'none'}
      />
    ),
    comment: (
      <path d="M20.5 11.5a8.5 8.5 0 0 1-8.5 8.5c-1.4 0-2.7-.3-3.9-.9L3 21l1.7-5A8.5 8.5 0 1 1 20.5 11.5Z" />
    ),
    send: (
      <>
        <path d="m21 3-8.4 18-2.7-7.8L2 10.5 21 3Z" />
        <path d="m9.9 13.2 5.4-5.4" />
      </>
    ),
    bookmark: <path d="M5 3.5h14v18l-7-5-7 5z" fill={filled ? 'currentColor' : 'none'} />,
    more: (
      <>
        <circle cx="5" cy="12" r="1" fill="currentColor" />
        <circle cx="12" cy="12" r="1" fill="currentColor" />
        <circle cx="19" cy="12" r="1" fill="currentColor" />
      </>
    ),
    plus: <path d="M12 4v16M4 12h16" />,
    close: <path d="M5 5 19 19M19 5 5 19" />,
    back: <path d="m15 5-7 7 7 7" />,
    search: (
      <>
        <circle cx="10.5" cy="10.5" r="6.5" />
        <path d="m16 16 5 5" />
      </>
    ),
    pause: (
      <>
        <path d="M8 5v14M16 5v14" strokeWidth="3" />
      </>
    ),
    play: <path d="m8 5 11 7-11 7z" fill="currentColor" />,
  };
  return <svg {...common}>{shapes[name]}</svg>;
}

type Author = { name: string; avatar: string; location: string; story: string };
const authors: Author[] = [
  {
    name: 'olivia.june',
    avatar: '/instagram/avatar-olivia.jpg',
    location: 'Oía, Santorini',
    story: '/instagram/coast.jpg',
  },
  {
    name: 'noah.wanders',
    avatar: '/instagram/avatar-noah.jpg',
    location: 'Banff National Park',
    story: '/instagram/architecture.jpg',
  },
  {
    name: 'maya.inframe',
    avatar: '/instagram/avatar-maya.jpg',
    location: 'California',
    story: '/instagram/flowers.jpg',
  },
  {
    name: 'zara.afterhours',
    avatar: '/instagram/avatar-zara.jpg',
    location: 'New York City',
    story: '/instagram/cafe.jpg',
  },
];
type Post = {
  id: string;
  author: Author;
  image: string;
  caption: string;
  likes: number;
  comments: number;
  time: string;
};
const posts: Post[] = [
  {
    id: 'coast',
    author: authors[0]!,
    image: '/instagram/coast.jpg',
    caption: 'The kind of blue you want to keep forever. 🌊',
    likes: 2841,
    comments: 48,
    time: '2 hours ago',
  },
  {
    id: 'mountain',
    author: authors[1]!,
    image: '/instagram/architecture.jpg',
    caption: 'Worth waking up before the world for this.',
    likes: 1907,
    comments: 36,
    time: '5 hours ago',
  },
  {
    id: 'flowers',
    author: authors[2]!,
    image: '/instagram/flowers.jpg',
    caption: 'A little bit of sunshine for your afternoon ☀️',
    likes: 3428,
    comments: 71,
    time: '1 day ago',
  },
];
type Reel = {
  id: string;
  author: Author;
  video: string;
  poster: string;
  caption: string;
  likes: number;
  comments: number;
  audio: string;
};
const reels: Reel[] = [
  {
    id: 'reel-coast',
    author: authors[0]!,
    video: '/instagram/reel-coast.mp4',
    poster: '/instagram/coast.jpg',
    caption: 'Blue hour, but make it endless 🌊',
    likes: 18600,
    comments: 317,
    audio: 'Muted preview · Mixkit',
  },
  {
    id: 'reel-forest',
    author: authors[1]!,
    video: '/instagram/reel-forest.mp4',
    poster: '/instagram/forest.jpg',
    caption: 'A quieter kind of morning 🌲',
    likes: 9402,
    comments: 129,
    audio: 'Muted preview · Mixkit',
  },
  {
    id: 'reel-city',
    author: authors[3]!,
    video: '/instagram/reel-city.mp4',
    poster: '/instagram/cafe.jpg',
    caption: 'The city after everyone goes home ✨',
    likes: 24100,
    comments: 543,
    audio: 'Muted preview · Mixkit',
  },
];
const starterComments: Record<string, { name: string; text: string }[]> = {
  coast: [
    { name: 'maya.inframe', text: 'The colors are unreal 😍' },
    { name: 'noah.wanders', text: 'Adding this to my list immediately.' },
    { name: 'zara.afterhours', text: 'Can almost feel the sunshine from here.' },
  ],
  mountain: [
    { name: 'olivia.june', text: 'That reflection!' },
    { name: 'maya.inframe', text: 'The early start was so worth it.' },
  ],
  flowers: [{ name: 'zara.afterhours', text: 'I needed this today 💛' }],
  'reel-coast': [
    { name: 'maya.inframe', text: 'I could watch this all day.' },
    { name: 'noah.wanders', text: 'The water!!' },
  ],
  'reel-forest': [{ name: 'olivia.june', text: 'Morning magic.' }],
  'reel-city': [{ name: 'maya.inframe', text: 'This mood is everything.' }],
};

function Avatar({
  author,
  size = 'normal',
  ring = false,
}: {
  author: Author;
  size?: 'normal' | 'large';
  ring?: boolean;
}) {
  return (
    <span
      className={`ig-avatar ${size === 'large' ? 'ig-avatar--large' : ''} ${ring ? 'ig-avatar--ring' : ''}`}
    >
      <img src={author.avatar} alt="" />
    </span>
  );
}

function HeartBurst({ id }: { id: number }) {
  const reduced = usePrefersReducedMotion();
  return id ? (
    <span
      key={id}
      className={`ig-heart-burst ${reduced ? 'ig-heart-burst--reduced' : ''}`}
      aria-hidden="true"
    >
      <Icon name="heart" size={96} filled />
    </span>
  ) : null;
}

function StoryViewer({ startIndex }: { startIndex: number }) {
  const { pop } = useMobileStack();
  const toast = useToast();
  const [index, setIndex] = useState(startIndex);
  const [storyLiked, setStoryLiked] = useState(false);
  const [progress, setProgress] = useState(0);
  const [paused, setPaused] = useState(false);
  const indexRef = useRef(index);
  indexRef.current = index;
  const next = () => {
    if (indexRef.current >= authors.length - 1) pop();
    else {
      setIndex(indexRef.current + 1);
      setProgress(0);
    }
  };
  useEffect(() => {
    if (paused) return;
    const timer = window.setInterval(() => {
      setProgress((current) => {
        if (current >= 100) return current;
        return Math.min(100, current + 1);
      });
    }, 50);
    return () => window.clearInterval(timer);
  }, [paused, index]);
  useEffect(() => {
    if (progress < 100) return;
    if (index >= authors.length - 1) pop();
    else {
      setIndex(index + 1);
      setProgress(0);
    }
  }, [index, pop, progress]);
  const author = authors[index]!;
  return (
    <section className="ig-story-viewer" aria-label={`${author.name}'s story`}>
      <img
        className="ig-story-photo"
        src={author.story}
        alt={`${author.name}'s photo story`}
      />
      <div className="ig-story-shade" />
      <div className="ig-story-progress" aria-hidden="true">
        {authors.map((person, i) => (
          <span key={person.name}>
            <i
              style={{ width: i < index ? '100%' : i === index ? `${progress}%` : '0%' }}
            />
          </span>
        ))}
      </div>
      <div className="ig-story-top">
        <Avatar author={author} />
        <strong>{author.name}</strong>
        <span>4h</span>
        <Pressable
          className="ig-icon-button ig-story-close"
          feedback="opacity"
          aria-label="Close story"
          onPress={() => pop()}
        >
          <Icon name="close" />
        </Pressable>
      </div>
      <div className="ig-story-tap-zones">
        <Pressable
          feedback="none"
          aria-label="Previous story"
          onPressStart={() => setPaused(true)}
          onPressEnd={() => setPaused(false)}
          onPress={() => {
            if (index > 0) {
              setIndex(index - 1);
              setProgress(0);
            } else setProgress(0);
          }}
        />
        <Pressable
          feedback="none"
          aria-label="Next story"
          onPressStart={() => setPaused(true)}
          onPressEnd={() => setPaused(false)}
          onPress={next}
        />
      </div>
      <div className="ig-story-caption">
        <span>POSTCARD FROM {author.location.toUpperCase()}</span>
        <strong>Wish you were here.</strong>
      </div>
      <div className="ig-story-reply">
        <Pressable
          className="ig-story-reply-input"
          onPress={() => toast({ message: 'Story replies are coming to this demo' })}
        >
          Send a message
        </Pressable>
        <Pressable
          className={`ig-story-reply-action ${storyLiked ? 'is-liked' : ''}`}
          aria-label={storyLiked ? 'Unlike story' : 'Like story'}
          aria-pressed={storyLiked}
          onPress={() => {
            setStoryLiked((value) => !value);
            haptics.impact('light');
          }}
        >
          <Icon name="heart" size={24} filled={storyLiked} />
        </Pressable>
        <Pressable
          className="ig-story-reply-action"
          aria-label="Share story"
          onPress={() => toast({ message: 'Story sharing is coming to this demo' })}
        >
          <Icon name="send" size={23} />
        </Pressable>
      </div>
    </section>
  );
}

function VideoReel({
  reel,
  active,
  liked,
  saved,
  onLike,
  onSave,
  onComments,
  onShare,
}: {
  reel: Reel;
  active: boolean;
  liked: boolean;
  saved: boolean;
  onLike: (id: string) => void;
  onSave: (id: string) => void;
  onComments: (id: string) => void;
  onShare: () => void;
}) {
  const video = useRef<HTMLVideoElement>(null);
  const [playing, setPlaying] = useState(true);
  const [following, setFollowing] = useState(false);
  const [burst, setBurst] = useState(0);
  useEffect(() => {
    if (!video.current) return;
    if (active && playing && !document.hidden)
      void video.current.play().catch(() => undefined);
    else video.current.pause();
  }, [active, playing]);
  useEffect(() => {
    const onVisibility = () => {
      if (!video.current) return;
      if (document.hidden) video.current.pause();
      else if (active && playing) void video.current.play().catch(() => undefined);
    };
    document.addEventListener('visibilitychange', onVisibility);
    return () => document.removeEventListener('visibilitychange', onVisibility);
  }, [active, playing]);
  const doubleLike = () => {
    if (!liked) onLike(reel.id);
    haptics.impact('medium');
    setBurst((value) => value + 1);
  };
  return (
    <article className="ig-reel" aria-label={`Reel by ${reel.author.name}`}>
      <DoubleTapSurface
        className="ig-reel-media"
        ariaLabel={`Double tap to like reel by ${reel.author.name}`}
        onDoubleTap={doubleLike}
      >
        <video
          ref={video}
          src={reel.video}
          poster={reel.poster}
          playsInline
          loop
          muted
          preload={active ? 'auto' : 'metadata'}
        />
        <HeartBurst id={burst} />
      </DoubleTapSurface>
      <div className="ig-reel-vignette" />
      <div className="ig-reel-heading">
        Reels <span>For you</span>
      </div>
      <div className="ig-reel-side">
        <Pressable
          aria-label={liked ? 'Unlike reel' : 'Like reel'}
          aria-pressed={liked}
          onPress={() => onLike(reel.id)}
          className={`ig-reel-action ${liked ? 'is-liked' : ''}`}
        >
          <Icon name="heart" size={31} filled={liked} />
          <small>{(reel.likes + (liked ? 1 : 0)).toLocaleString()}</small>
        </Pressable>
        <Pressable
          aria-label="View reel comments"
          onPress={() => onComments(reel.id)}
          className="ig-reel-action"
        >
          <Icon name="comment" size={31} />
          <small>{reel.comments}</small>
        </Pressable>
        <Pressable aria-label="Share reel" onPress={onShare} className="ig-reel-action">
          <Icon name="send" size={29} />
        </Pressable>
        <Pressable
          aria-label={saved ? 'Remove saved reel' : 'Save reel'}
          aria-pressed={saved}
          onPress={() => onSave(reel.id)}
          className="ig-reel-action"
        >
          <Icon name="bookmark" size={28} filled={saved} />
        </Pressable>
        <Pressable
          aria-label={playing ? 'Pause reel' : 'Play reel'}
          onPress={() => setPlaying((value) => !value)}
          className="ig-reel-action ig-reel-play"
        >
          <Icon name={playing ? 'pause' : 'play'} size={21} />
        </Pressable>
      </div>
      <div className="ig-reel-info">
        <div className="ig-reel-author">
          <Avatar author={reel.author} />
          <strong>{reel.author.name}</strong>
          <Pressable
            className="ig-reel-follow"
            aria-label={
              following ? `Unfollow ${reel.author.name}` : `Follow ${reel.author.name}`
            }
            aria-pressed={following}
            onPress={() => {
              setFollowing((value) => !value);
              haptics.selection();
            }}
          >
            {following ? 'Following' : 'Follow'}
          </Pressable>
        </div>
        <p>{reel.caption}</p>
        <small>♫ {reel.audio}</small>
      </div>
    </article>
  );
}

function SocialApp() {
  const [tab, setTab] = useState<'home' | 'reels' | 'profile'>('home');
  const [activeReel, setActiveReel] = useState(0);
  const [likes, setLikes] = useState<Record<string, boolean>>({});
  const [saved, setSaved] = useState<Record<string, boolean>>({});
  const [commentLikes, setCommentLikes] = useState<Record<string, boolean>>({});
  const [bursts, setBursts] = useState<Record<string, number>>({});
  const [commentTarget, setCommentTarget] = useState<string | null>(null);
  const [comments, setComments] = useState(starterComments);
  const [draft, setDraft] = useState('');
  const { push } = useMobileStack();
  const toast = useToast();
  const like = (id: string) => {
    setLikes((current) => ({ ...current, [id]: !current[id] }));
    haptics.impact('light');
  };
  const doubleLike = (id: string) => {
    if (!likes[id]) like(id);
    setBursts((current) => ({ ...current, [id]: (current[id] ?? 0) + 1 }));
    haptics.impact('medium');
  };
  const save = (id: string) => {
    setSaved((current) => ({ ...current, [id]: !current[id] }));
    haptics.selection();
  };
  const share = () => toast({ message: 'Sharing is coming to this demo' });
  const openStory = (index: number) =>
    push(<StoryViewer startIndex={index} />, { key: `story-${index}-${Date.now()}` });
  const addComment = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const text = draft.trim();
    if (!commentTarget || !text) return;
    setComments((current) => ({
      ...current,
      [commentTarget]: [...(current[commentTarget] ?? []), { name: 'you', text }],
    }));
    setDraft('');
    haptics.impact('light');
  };
  const selectedPost = posts.find((post) => post.id === commentTarget);
  const selectedReel = reels.find((reel) => reel.id === commentTarget);
  const commentCount = (id: string) =>
    (posts.find((post) => post.id === id)?.comments ??
      reels.find((reel) => reel.id === id)?.comments ??
      0) + Math.max(0, (comments[id]?.length ?? 0) - (starterComments[id]?.length ?? 0));

  return (
    <div className={`ig-app ig-app--${tab}`}>
      <div className="ig-tab-content" hidden={tab !== 'home'}>
        <MobileScrollArea className="ig-feed-scroll">
          <header className="ig-feed-header">
            <strong>Instagram</strong>
            <div>
              <Pressable
                className="ig-icon-button"
                aria-label="New post"
                onPress={() => toast({ message: 'Create is coming to this demo' })}
              >
                <Icon name="plus" size={27} />
              </Pressable>
              <Pressable
                className="ig-icon-button"
                aria-label="Activity"
                onPress={() => toast({ message: 'You’re all caught up' })}
              >
                <Icon name="heart" size={27} />
              </Pressable>
            </div>
          </header>
          <section className="ig-stories" aria-label="Stories">
            <Pressable
              className="ig-story-item"
              aria-label="Your story"
              onPress={() => toast({ message: 'Story creation is coming to this demo' })}
            >
              <span className="ig-your-story">
                <img src="/instagram/avatar-zara.jpg" alt="" />
                <i>
                  <Icon name="plus" size={12} />
                </i>
              </span>
              <small>Your story</small>
            </Pressable>
            {authors.map((author, index) => (
              <Pressable
                key={author.name}
                className="ig-story-item"
                aria-label={`View ${author.name}'s story`}
                onPress={() => openStory(index)}
              >
                <Avatar author={author} size="large" ring />
                <small>{author.name}</small>
              </Pressable>
            ))}
          </section>
          <div className="ig-feed-divider" />
          {posts.map((post) => (
            <article
              className="ig-post"
              key={post.id}
              aria-label={`Post by ${post.author.name}`}
            >
              <div className="ig-post-top">
                <Avatar author={post.author} ring />
                <div>
                  <strong>{post.author.name}</strong>
                  <small>{post.author.location}</small>
                </div>
                <Pressable
                  className="ig-icon-button ig-post-more"
                  aria-label={`More options for ${post.author.name}'s post`}
                  onPress={() =>
                    toast({ message: 'Post options are coming to this demo' })
                  }
                >
                  <Icon name="more" size={24} />
                </Pressable>
              </div>
              <DoubleTapSurface
                className="ig-post-media"
                ariaLabel={`Double tap to like ${post.author.name}'s photo`}
                onDoubleTap={() => doubleLike(post.id)}
              >
                <img src={post.image} alt={post.caption} />
                <HeartBurst id={bursts[post.id] ?? 0} />
              </DoubleTapSurface>
              <div className="ig-post-actions">
                <Pressable
                  className={`ig-icon-button ${likes[post.id] ? 'is-liked' : ''}`}
                  aria-label={likes[post.id] ? 'Unlike post' : 'Like post'}
                  aria-pressed={!!likes[post.id]}
                  onPress={() => like(post.id)}
                >
                  <Icon name="heart" size={28} filled={!!likes[post.id]} />
                </Pressable>
                <Pressable
                  className="ig-icon-button"
                  aria-label={`View comments on ${post.author.name}'s post`}
                  onPress={() => setCommentTarget(post.id)}
                >
                  <Icon name="comment" size={27} />
                </Pressable>
                <Pressable
                  className="ig-icon-button"
                  aria-label="Share post"
                  onPress={share}
                >
                  <Icon name="send" size={27} />
                </Pressable>
                <Pressable
                  className="ig-icon-button ig-save"
                  aria-label={saved[post.id] ? 'Remove saved post' : 'Save post'}
                  aria-pressed={!!saved[post.id]}
                  onPress={() => save(post.id)}
                >
                  <Icon name="bookmark" size={26} filled={!!saved[post.id]} />
                </Pressable>
              </div>
              <div className="ig-post-copy">
                <strong>
                  {(post.likes + (likes[post.id] ? 1 : 0)).toLocaleString()} likes
                </strong>
                <p>
                  <b>{post.author.name}</b> {post.caption}
                </p>
                <Pressable
                  feedback="opacity"
                  className="ig-comment-link"
                  onPress={() => setCommentTarget(post.id)}
                >
                  View all {commentCount(post.id)} comments
                </Pressable>
                <small>{post.time.toUpperCase()}</small>
              </div>
            </article>
          ))}
          <div className="ig-feed-end">
            You’re all caught up <span>✦</span>
          </div>
        </MobileScrollArea>
      </div>

      <div className="ig-tab-content" hidden={tab !== 'reels'}>
        <VerticalPager
          className="ig-reels-pager"
          ariaLabel="Reels feed"
          activeIndex={activeReel}
          onActiveIndexChange={setActiveReel}
        >
          {reels.map((reel, index) => (
            <VideoReel
              key={reel.id}
              reel={reel}
              active={tab === 'reels' && commentTarget === null && index === activeReel}
              liked={!!likes[reel.id]}
              saved={!!saved[reel.id]}
              onLike={like}
              onSave={save}
              onComments={setCommentTarget}
              onShare={share}
            />
          ))}
        </VerticalPager>
      </div>

      <div className="ig-tab-content" hidden={tab !== 'profile'}>
        <MobileScrollArea className="ig-profile-scroll">
          <div className="ig-profile-top">
            <Avatar author={authors[3]!} size="large" />
            <div>
              <strong>8</strong>
              <small>posts</small>
            </div>
            <div>
              <strong>1,284</strong>
              <small>followers</small>
            </div>
            <div>
              <strong>412</strong>
              <small>following</small>
            </div>
          </div>
          <div className="ig-profile-bio">
            <strong>your.story</strong>
            <span>Saving little moments, one frame at a time ✨</span>
            <small>Built with pwacn · demo profile</small>
          </div>
          <div className="ig-profile-buttons">
            <Pressable
              onPress={() => toast({ message: 'Profile editing is coming to this demo' })}
            >
              Edit profile
            </Pressable>
            <Pressable onPress={share}>Share profile</Pressable>
          </div>
          <div className="ig-profile-label">
            <Icon name="reels" size={17} /> Your gallery
          </div>
          <div className="ig-profile-grid">
            {[
              'coast',
              'architecture',
              'flowers',
              'forest',
              'cafe',
              'sea',
              'mountain',
              'portrait',
              'coast',
            ].map((image, index) => (
              <Pressable
                key={`${image}-${index}`}
                aria-label={`Gallery item ${index + 1}`}
                onPress={() => setTab(index < 3 ? 'home' : 'reels')}
              >
                <img src={`/instagram/${image}.jpg`} alt="" />
              </Pressable>
            ))}
          </div>
        </MobileScrollArea>
      </div>

      <nav className="ig-bottom-nav" aria-label="Main navigation">
        <Pressable
          aria-label="Home"
          aria-pressed={tab === 'home'}
          onPress={() => setTab('home')}
        >
          <Icon name="home" size={27} filled={tab === 'home'} />
        </Pressable>
        <Pressable
          aria-label="Explore"
          onPress={() => toast({ message: 'Explore is coming to this demo' })}
        >
          <Icon name="search" size={27} />
        </Pressable>
        <Pressable
          aria-label="Reels"
          aria-pressed={tab === 'reels'}
          onPress={() => setTab('reels')}
        >
          <Icon name="reels" size={27} filled={tab === 'reels'} />
        </Pressable>
        <Pressable
          aria-label="Activity"
          onPress={() => toast({ message: 'You’re all caught up' })}
        >
          <Icon name="heart" size={27} />
        </Pressable>
        <Pressable
          aria-label="Profile"
          aria-pressed={tab === 'profile'}
          onPress={() => setTab('profile')}
        >
          <img className="ig-nav-avatar" src="/instagram/avatar-zara.jpg" alt="" />
        </Pressable>
      </nav>

      <BottomSheet
        open={commentTarget !== null}
        onOpenChange={(open) => {
          if (!open) setCommentTarget(null);
        }}
        title="Comments"
        snapPoints={[0.92, 0.72]}
        initialSnap={0.72}
        className="ig-comments-sheet"
        footer={
          <form className="ig-comment-compose" onSubmit={addComment}>
            <img src="/instagram/avatar-zara.jpg" alt="" />
            <input
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              placeholder="Add a comment…"
              aria-label="Add a comment"
            />
            <button type="submit" disabled={!draft.trim()}>
              Post
            </button>
          </form>
        }
      >
        <div className="ig-comments-title">
          Comments <span>{commentTarget ? commentCount(commentTarget) : ''}</span>
          <Pressable
            className="ig-comments-close"
            aria-label="Close comments"
            onPress={() => setCommentTarget(null)}
          >
            <Icon name="close" size={18} />
          </Pressable>
        </div>
        <SheetScrollArea className="ig-comments-list">
          <div className="ig-comments-original">
            <Avatar
              author={selectedPost?.author ?? selectedReel?.author ?? authors[0]!}
            />
            <p>
              <strong>{selectedPost?.author.name ?? selectedReel?.author.name}</strong>{' '}
              {selectedPost?.caption ?? selectedReel?.caption}
            </p>
          </div>
          <div className="ig-comments-separator" />
          {(commentTarget ? (comments[commentTarget] ?? []) : []).map(
            (comment, index) => (
              <div className="ig-comment" key={`${comment.name}-${index}`}>
                <span className="ig-comment-avatar">
                  {comment.name === 'you' ? 'Y' : comment.name.charAt(0).toUpperCase()}
                </span>
                <p>
                  <strong>{comment.name}</strong> {comment.text}
                  <small>{index + 1}h · Reply</small>
                </p>
                <Pressable
                  className={`ig-comment-like ${commentLikes[`${commentTarget}-${index}`] ? 'is-liked' : ''}`}
                  aria-label={`${commentLikes[`${commentTarget}-${index}`] ? 'Unlike' : 'Like'} comment by ${comment.name}`}
                  aria-pressed={!!commentLikes[`${commentTarget}-${index}`]}
                  onPress={() =>
                    setCommentLikes((current) => ({
                      ...current,
                      [`${commentTarget}-${index}`]:
                        !current[`${commentTarget}-${index}`],
                    }))
                  }
                >
                  <Icon
                    name="heart"
                    size={16}
                    filled={!!commentLikes[`${commentTarget}-${index}`]}
                  />
                </Pressable>
              </div>
            ),
          )}
        </SheetScrollArea>
      </BottomSheet>
    </div>
  );
}

export function InstagramDemo() {
  useEffect(() => {
    document.title = 'Instagram demo — built with pwacn';
  }, []);
  return (
    <ToastProvider>
      <div className="ig-stage">
        <MobileStack initialScreen={<SocialApp />} backGestureRegion="screen" />
      </div>
    </ToastProvider>
  );
}

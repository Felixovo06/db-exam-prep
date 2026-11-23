import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { CheckCircle2, XCircle, Shuffle, EyeOff, Check, ChevronDown, ChevronUp, Flame, BookMarked } from 'lucide-react';
import rawFeed from '../data/feed.json';
import { MarkdownView } from './MarkdownView';
import {
  CHAPTERS,
  QTYPE_LABELS,
  type ChapterId,
  type MasteryStatus,
  type Paper,
  type ProgressMap,
  type Question,
  type UserProgressItem,
} from '../types';

interface FeedCard {
  id: string;
  ch: ChapterId;
  title: string;
  tag: string;
  src: 'heu' | 'site';
  kw: string;
  body: string;
}

const CARDS = rawFeed as FeedCard[];
const KNOWN_KEY = 'db_feed_known_v1';
const FEED_PAPER_COUNT = 5;

type FeedItem = { t: 'k'; card: FeedCard } | { t: 'q'; q: Question };
type KindFilter = 'all' | 'k' | 'q';

/* 带种子的随机数，保证同一次“洗牌”内顺序稳定 */
function rng(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
function shuffled<T>(arr: T[], rand: () => number): T[] {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

const chShort = (id: ChapterId) => CHAPTERS.find((c) => c.id === id)?.shortName ?? id;

const CH_COLOR: Record<ChapterId, string> = {
  ch1: 'bg-sky-50 text-sky-700 border-sky-200',
  ch2: 'bg-violet-50 text-violet-700 border-violet-200',
  ch3: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  ch4: 'bg-rose-50 text-rose-700 border-rose-200',
  ch5: 'bg-amber-50 text-amber-700 border-amber-200',
  ch6: 'bg-cyan-50 text-cyan-700 border-cyan-200',
  ch7: 'bg-fuchsia-50 text-fuchsia-700 border-fuchsia-200',
};

interface Props {
  questions: Question[];
  papers: Paper[];
  progress: ProgressMap;
  onUpdateProgress: (qid: string, update: Partial<UserProgressItem>) => void;
}

export function KnowledgeFeed({ questions, papers, progress, onUpdateProgress }: Props) {
  const feedPapers = useMemo(() => papers.slice(0, FEED_PAPER_COUNT), [papers]);
  const feedPaperIds = useMemo(() => new Set(feedPapers.map((p) => p.id)), [feedPapers]);
  const paperMap = useMemo(() => new Map(papers.map((p) => [p.id, p])), [papers]);
  const recentQs = useMemo(() => questions.filter((q) => feedPaperIds.has(q.paper_id)), [questions, feedPaperIds]);

  /* 每张知识卡在最近 5 套里对应哪些真题 */
  const related = useMemo(() => {
    const m = new Map<string, Question[]>();
    for (const c of CARDS) {
      const re = new RegExp(c.kw);
      m.set(c.id, recentQs.filter((q) => re.test(q.topic_tag)));
    }
    return m;
  }, [recentQs]);

  const [known, setKnown] = useState<Set<string>>(() => {
    try {
      return new Set(JSON.parse(localStorage.getItem(KNOWN_KEY) || '[]') as string[]);
    } catch {
      return new Set();
    }
  });
  const toggleKnown = (id: string) =>
    setKnown((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      try {
        localStorage.setItem(KNOWN_KEY, JSON.stringify([...next]));
      } catch {
        /* 无法写入本地存储时忽略 */
      }
      return next;
    });

  const [seed, setSeed] = useState(() => Math.floor(Math.random() * 1e9));
  const [kind, setKind] = useState<KindFilter>('all');
  const [chapter, setChapter] = useState<ChapterId | 'all'>('all');
  const [hideDone, setHideDone] = useState(false);
  const [cur, setCur] = useState(0);
  const areaRef = useRef<HTMLDivElement | null>(null);
  const [areaH, setAreaH] = useState(600);

  /* 编排信息流：知识卡 → 对应真题 → 随机真题，循环 */
  const feed = useMemo(() => {
    const rand = rng(seed);
    const cards = shuffled(CARDS, rand);
    const pool = shuffled(recentQs, rand);
    const used = new Set<string>();
    const out: FeedItem[] = [];
    const take = (pred?: (q: Question) => boolean) => {
      const q = pool.find((x) => !used.has(x.id) && (!pred || pred(x)));
      if (q) {
        used.add(q.id);
        out.push({ t: 'q', q });
      }
    };
    for (const card of cards) {
      out.push({ t: 'k', card });
      const rel = new Set((related.get(card.id) ?? []).map((q) => q.id));
      take((q) => rel.has(q.id));
      take();
    }
    for (const q of pool) if (!used.has(q.id)) out.push({ t: 'q', q });
    return out;
  }, [seed, recentQs, related]);

  const items = useMemo(() => {
    return feed.filter((it) => {
      if (kind !== 'all' && it.t !== kind) return false;
      const ch = it.t === 'k' ? it.card.ch : it.q.chapter;
      if (chapter !== 'all' && ch !== chapter) return false;
      if (hideDone) {
        if (it.t === 'k' && known.has(it.card.id)) return false;
        if (it.t === 'q' && progress[it.q.id]?.status === 'mastered') return false;
      }
      return true;
    });
  }, [feed, kind, chapter, hideDone, known, progress]);

  const showOverview = kind === 'all' && chapter === 'all' && !hideDone;
  const total = items.length + (showOverview ? 1 : 0);

  /* 筛选或洗牌后回到第一屏 */
  useEffect(() => {
    setCur(0);
    areaRef.current?.scrollTo({ top: 0 });
  }, [seed, kind, chapter, hideDone]);

  /* 滚动区高度 = 视口高度 - 它距顶部的距离 */
  useEffect(() => {
    const measure = () => {
      const el = areaRef.current;
      if (!el) return;
      window.scrollTo(0, 0);
      setAreaH(Math.max(320, window.innerHeight - el.getBoundingClientRect().top));
    };
    measure();
    window.addEventListener('resize', measure);
    return () => window.removeEventListener('resize', measure);
  }, []);

  /* 当前是第几屏：按滚动位置算 */
  const onScroll = () => {
    const el = areaRef.current;
    if (!el) return;
    const i = Math.round(el.scrollTop / el.clientHeight);
    setCur((c) => (c === i ? c : i));
  };
  const go = (i: number) => {
    const el = areaRef.current;
    if (!el) return;
    const t = Math.max(0, Math.min(total - 1, i));
    el.scrollTo({ top: t * el.clientHeight, behavior: 'instant' as ScrollBehavior });
  };
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA') return;
      if (e.key === 'ArrowDown' || e.key === 'j') {
        e.preventDefault();
        go(cur + 1);
      } else if (e.key === 'ArrowUp' || e.key === 'k') {
        e.preventDefault();
        go(cur - 1);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  /* 近 5 套按章节的分值/题量分布 */
  const chStats = useMemo(() => {
    const total = recentQs.length || 1;
    return CHAPTERS.map((c) => {
      const n = recentQs.filter((q) => q.chapter === c.id).length;
      return { id: c.id, name: c.shortName, n, pct: Math.round((n / total) * 100) };
    });
  }, [recentQs]);

  const masteredQ = recentQs.filter((q) => progress[q.id]?.status === 'mastered').length;
  const hot = useMemo(
    () =>
      CARDS.map((c) => {
        const rel = related.get(c.id) ?? [];
        return { c, n: rel.length, papers: new Set(rel.map((q) => q.paper_id)).size };
      })
        .filter((x) => x.n > 0)
        .sort((a, b) => b.papers - a.papers || b.n - a.n)
        .slice(0, 6),
    [related],
  );

  const overview = (
    <section className="w-full max-w-3xl rounded-3xl border border-slate-200 bg-white p-5 sm:p-7 shadow-sm">
      <div className="flex flex-wrap items-center gap-2 mb-1">
        <BookMarked className="w-5 h-5 text-indigo-600" />
        <h2 className="text-lg font-bold text-slate-900">知识流 · 往下滑就行</h2>
      </div>
      <p className="text-xs text-slate-500 mb-4 leading-relaxed">
        {CARDS.length} 张知识卡 + 最近 {feedPapers.length} 套卷共 {recentQs.length} 道真题，一屏一个，穿插着来。知识卡整理自 HEU 开源《期末复习干货》，真题来自：
        {feedPapers.map((p) => `${p.term}${p.variant}`).join('、')}。
      </p>
      <div className="text-xs font-semibold text-slate-700 mb-2">近 {feedPapers.length} 套卷各章题量占比</div>
      <div className="space-y-1.5 mb-4">
        {chStats.map((st) => (
          <div key={st.id} className="flex items-center gap-2 text-xs">
            <span className="w-28 shrink-0 text-slate-600 truncate">{st.name}</span>
            <div className="flex-1 h-2 rounded-full bg-slate-100 overflow-hidden">
              <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${Math.max(st.pct * 2.5, 3)}%` }} />
            </div>
            <span className="w-20 text-right text-slate-500 tabular-nums">
              {st.n} 题 · {st.pct}%
            </span>
          </div>
        ))}
      </div>
      <div className="text-xs font-semibold text-slate-700 mb-2 flex items-center gap-1">
        <Flame className="w-3.5 h-3.5 text-orange-500" />
        出现在最多套卷里的知识点
      </div>
      <div className="flex flex-wrap gap-1.5">
        {hot.map(({ c, n, papers: pn }) => (
          <span
            key={c.id}
            className="inline-flex items-center gap-1 rounded-lg border border-orange-200 bg-orange-50 px-2 py-1 text-[11px] text-orange-800"
          >
            {c.title.replace(/[★ ]+$/, '')}
            <b className="text-orange-600">
              {pn}/{feedPapers.length} 套 · {n} 题
            </b>
          </span>
        ))}
      </div>
      <div className="mt-5 flex items-center justify-between text-xs text-slate-500">
        <span>
          已记住知识卡 <b className="text-slate-800">{known.size}</b>/{CARDS.length} · 已掌握真题{' '}
          <b className="text-slate-800">{masteredQ}</b>/{recentQs.length}
        </span>
        <button
          type="button"
          onClick={() => go(1)}
          className="inline-flex items-center gap-1 px-4 py-2 rounded-full bg-indigo-600 text-white font-semibold cursor-pointer hover:bg-indigo-700"
        >
          开始刷 <ChevronDown className="w-4 h-4" />
        </button>
      </div>
    </section>
  );

  const slides: ReactNode[] = [];
  if (showOverview) slides.push(overview);
  items.forEach((it) => {
    slides.push(
      it.t === 'k' ? (
        <KnowledgeCard
          key={it.card.id}
          card={it.card}
          related={related.get(it.card.id) ?? []}
          paperMap={paperMap}
          total={feedPapers.length}
          isKnown={known.has(it.card.id)}
          onToggle={() => toggleKnown(it.card.id)}
        />
      ) : (
        <QuestionFeedCard
          key={it.q.id}
          q={it.q}
          paper={paperMap.get(it.q.paper_id)}
          progress={progress[it.q.id]}
          onUpdateProgress={onUpdateProgress}
        />
      ),
    );
  });

  return (
    <div className="flex flex-col bg-[#F8F7F4]" style={{ height: areaH + 0 }}>
      {/* 筛选条 */}
      <div className="shrink-0 px-3 sm:px-5 py-1.5 sm:py-2 border-b border-slate-200 bg-white/90 flex flex-nowrap items-center gap-1.5 sm:gap-2 overflow-x-auto [scrollbar-width:none]">
        <div className="inline-flex shrink-0 rounded-lg bg-slate-100 p-0.5 text-xs font-semibold">
          {([
            ['all', '全部'],
            ['k', '知识卡'],
            ['q', '真题'],
          ] as const).map(([k, label]) => (
            <button
              key={k}
              type="button"
              onClick={() => setKind(k)}
              className={`px-3 py-1 rounded-md cursor-pointer ${
                kind === k ? 'bg-white text-indigo-700 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
        <select
          value={chapter}
          onChange={(e) => setChapter(e.target.value as ChapterId | 'all')}
          className="shrink-0 max-w-[6.5rem] sm:max-w-none px-2 py-1 rounded-lg border border-slate-200 bg-white text-xs text-slate-700 cursor-pointer"
        >
          <option value="all">所有章节</option>
          {CHAPTERS.map((c) => (
            <option key={c.id} value={c.id}>
              {c.shortName}
            </option>
          ))}
        </select>
        <button
          type="button"
          onClick={() => setHideDone((v) => !v)}
          className={`inline-flex shrink-0 items-center gap-1 whitespace-nowrap px-2.5 py-1 rounded-lg border text-xs cursor-pointer ${
            hideDone ? 'bg-emerald-50 text-emerald-700 border-emerald-300' : 'bg-white text-slate-600 border-slate-200'
          }`}
          title="隐藏已记住的知识卡和已掌握的真题"
        >
          <EyeOff className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">隐藏已会的</span>
        </button>
        <button
          type="button"
          onClick={() => setSeed(Math.floor(Math.random() * 1e9))}
          className="inline-flex shrink-0 items-center gap-1 whitespace-nowrap px-2.5 py-1 rounded-lg border border-indigo-200 bg-indigo-50 text-indigo-700 text-xs font-semibold cursor-pointer hover:bg-indigo-100"
        >
          <Shuffle className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">换一批</span>
        </button>
        <span className="ml-auto shrink-0 pl-1 text-xs text-slate-500 tabular-nums">
          {total > 0 ? `${Math.min(cur + 1, total)} / ${total}` : ''}
        </span>
      </div>

      {/* 一屏一条，吸附滚动 */}
      <div className="relative flex-1 min-h-0">
        {total === 0 ? (
          <div className="h-full flex items-center justify-center text-sm text-slate-500">
            这个筛选下没有内容了——要么都已经会了，要么换个章节试试。
          </div>
        ) : (
          <>
            <div
              ref={areaRef}
              onScroll={onScroll}
              className="h-full overflow-y-scroll snap-y snap-mandatory"
              style={{ overscrollBehaviorY: 'contain' }}
            >
              {slides.map((node, i) => (
                <div
                  key={i}
                  className="snap-start snap-always h-full w-full flex items-center justify-center px-2.5 sm:px-16 py-2.5 sm:py-3"
                >
                  {Math.abs(i - cur) <= 2 ? (
                    <div className="feed-slide w-full max-w-3xl max-h-full overflow-y-auto rounded-3xl">{node}</div>
                  ) : null}
                </div>
              ))}
            </div>
            {/* 右侧上下翻页（像短视频的侧边按钮） */}
            <div className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 hidden sm:flex flex-col gap-2">
              <button
                type="button"
                onClick={() => go(cur - 1)}
                disabled={cur <= 0}
                className="w-10 h-10 rounded-full bg-white border border-slate-200 shadow flex items-center justify-center text-slate-700 disabled:opacity-30 cursor-pointer hover:bg-slate-50"
                title="上一个（↑ 或 k）"
              >
                <ChevronUp className="w-5 h-5" />
              </button>
              <button
                type="button"
                onClick={() => go(cur + 1)}
                disabled={cur >= total - 1}
                className="w-10 h-10 rounded-full bg-indigo-600 text-white shadow flex items-center justify-center disabled:opacity-30 cursor-pointer hover:bg-indigo-700"
                title="下一个（↓ 或 j）"
              >
                <ChevronDown className="w-5 h-5" />
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

/* ---------------- 知识卡 ---------------- */

function KnowledgeCard({
  card,
  related,
  paperMap,
  total,
  isKnown,
  onToggle,
}: {
  card: FeedCard;
  related: Question[];
  paperMap: Map<string, Paper>;
  total: number;
  isKnown: boolean;
  onToggle: () => void;
}) {
  const [open, setOpen] = useState(false);
  const paperCount = new Set(related.map((q) => q.paper_id)).size;
  return (
    <article
      className={`rounded-3xl border bg-white p-5 sm:p-7 shadow-sm transition-colors ${
        isKnown ? 'border-emerald-300 bg-emerald-50/30' : 'border-slate-200'
      }`}
    >
      <div className="flex flex-wrap items-center gap-1.5 mb-2">
        <span className="px-2 py-0.5 rounded-md bg-indigo-600 text-white text-[10px] font-bold">知识卡</span>
        <span className={`px-2 py-0.5 rounded-md border text-[11px] ${CH_COLOR[card.ch]}`}>{chShort(card.ch)}</span>
        <span className="text-[11px] text-slate-500">{card.tag}</span>
        {paperCount > 0 && (
          <span className="ml-auto inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-orange-50 border border-orange-200 text-[11px] text-orange-700">
            <Flame className="w-3 h-3" />
            近{total}套里 {paperCount} 套考到
          </span>
        )}
      </div>
      <h3 className="text-xl font-bold text-slate-900 mb-3">{card.title}</h3>
      <div className="text-[15px] sm:text-base leading-relaxed">
        <MarkdownView content={card.body} />
      </div>

      {related.length > 0 && (
        <div className="mt-3">
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            className="inline-flex items-center gap-1 text-xs text-indigo-600 hover:text-indigo-800 cursor-pointer"
          >
            <ChevronDown className={`w-3.5 h-3.5 transition-transform ${open ? 'rotate-180' : ''}`} />
            近{total}套真题里的 {related.length} 道相关题
          </button>
          {open && (
            <ul className="mt-1.5 space-y-1 text-xs text-slate-600">
              {related.map((q) => {
                const p = paperMap.get(q.paper_id);
                return (
                  <li key={q.id} className="flex gap-1.5">
                    <span className="shrink-0 text-slate-400">
                      {p?.term}
                      {p?.variant}
                    </span>
                    <span>
                      {q.section.replace(/^[一二三四五六七八九十]+、/, '')} {q.number} · {q.topic_tag}
                    </span>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      )}

      <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between">
        <span className="text-[11px] text-slate-400">
          {card.src === 'heu' ? '整理自 HEU 期末复习干货' : '本站整理'}
        </span>
        <button
          type="button"
          onClick={onToggle}
          className={`inline-flex items-center gap-1 px-3 py-1 rounded-lg text-xs font-semibold border cursor-pointer ${
            isKnown
              ? 'bg-emerald-600 text-white border-emerald-600'
              : 'bg-white text-slate-700 border-slate-300 hover:border-emerald-400 hover:text-emerald-700'
          }`}
        >
          <Check className="w-3.5 h-3.5" />
          {isKnown ? '已记住' : '记住了'}
        </button>
      </div>
    </article>
  );
}

/* ---------------- 真题卡 ---------------- */

const letterOf = (opt: string, idx: number) => /^([A-Za-z])[\.、\s]/.exec(opt)?.[1]?.toUpperCase() ?? String.fromCharCode(65 + idx);

function QuestionFeedCard({
  q,
  paper,
  progress,
  onUpdateProgress,
}: {
  q: Question;
  paper?: Paper;
  progress?: UserProgressItem;
  onUpdateProgress: (qid: string, update: Partial<UserProgressItem>) => void;
}) {
  const status: MasteryStatus = progress?.status ?? 'unseen';
  const isChoice = q.qtype === 'choice' && q.options.length > 0;
  const [picked, setPicked] = useState<string[]>([]);
  const [checked, setChecked] = useState(false);
  const [show, setShow] = useState(false);

  const multi = q.correct_options.length > 1 || q.section.includes('不定项');
  const toggle = (l: string) => {
    if (checked) return;
    setPicked((p) => (multi ? (p.includes(l) ? p.filter((x) => x !== l) : [...p, l]) : [l]));
  };
  const submit = () => {
    if (!picked.length) return;
    setChecked(true);
    const right = [...picked].sort().join('') === [...q.correct_options].sort().join('');
    onUpdateProgress(q.id, { selectedOptions: picked, status: right ? 'mastered' : 'wrong' });
    setShow(true);
  };

  const border =
    status === 'mastered' ? 'border-emerald-300' : status === 'wrong' ? 'border-rose-300' : status === 'fuzzy' ? 'border-amber-300' : 'border-slate-200';

  return (
    <article className={`rounded-3xl border bg-white p-5 sm:p-7 shadow-sm ${border}`}>
      <div className="flex flex-wrap items-center gap-1.5 mb-2">
        <span className="px-2 py-0.5 rounded-md bg-slate-800 text-white text-[10px] font-bold">真题</span>
        <span className={`px-2 py-0.5 rounded-md border text-[11px] ${CH_COLOR[q.chapter]}`}>{chShort(q.chapter)}</span>
        <span className="text-[11px] text-slate-500">
          {paper?.term}
          {paper?.variant} · {q.section.replace(/^[一二三四五六七八九十]+、/, '')} {q.number}
        </span>
        <span className="ml-auto text-[11px] text-slate-400">{QTYPE_LABELS[q.qtype]}</span>
      </div>
      <div className="text-[11px] text-indigo-600 font-medium mb-1.5">考点：{q.topic_tag}</div>

      {q.context && (
        <div className="mb-2 rounded-lg bg-slate-50 border border-slate-200 px-3 py-2 text-sm">
          <MarkdownView content={q.context} />
        </div>
      )}
      <div className="text-[15px] sm:text-base leading-relaxed text-slate-900">
        <MarkdownView content={q.stem} />
      </div>

      {isChoice && (
        <div className="mt-2 space-y-1.5">
          <div className="text-[11px] text-slate-400">{multi ? '不定项，可多选' : '单选'}</div>
          {q.options.map((opt, i) => {
            const l = letterOf(opt, i);
            const isPick = picked.includes(l);
            const isRight = q.correct_options.includes(l);
            let cls = 'border-slate-200 hover:border-indigo-300';
            if (checked) cls = isRight ? 'border-emerald-500 bg-emerald-50' : isPick ? 'border-rose-400 bg-rose-50' : 'border-slate-200 opacity-60';
            else if (isPick) cls = 'border-indigo-500 bg-indigo-50';
            return (
              <button
                key={i}
                type="button"
                onClick={() => toggle(l)}
                className={`w-full text-left px-3 py-2 rounded-lg border text-sm flex items-start gap-2 cursor-pointer ${cls}`}
              >
                <span className="font-mono text-xs font-bold mt-0.5 text-slate-500">{l}</span>
                <span className="flex-1">{opt.replace(/^[A-Za-z][\.、\s]+/, '')}</span>
                {checked && isRight && <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />}
                {checked && isPick && !isRight && <XCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />}
              </button>
            );
          })}
          {!checked && (
            <button
              type="button"
              onClick={submit}
              disabled={!picked.length}
              className="mt-1 px-3 py-1.5 rounded-lg bg-indigo-600 text-white text-xs font-semibold disabled:opacity-40 cursor-pointer"
            >
              提交判题
            </button>
          )}
        </div>
      )}

      {!isChoice && !show && (
        <button
          type="button"
          onClick={() => setShow(true)}
          className="mt-3 px-3 py-1.5 rounded-lg bg-slate-900 text-white text-xs font-semibold cursor-pointer"
        >
          先想一想，再看答案
        </button>
      )}

      {show && (
        <div className="mt-3 space-y-2">
          <div className="rounded-xl border border-emerald-200 bg-emerald-50/60 p-3">
            <div className="text-xs font-bold text-emerald-800 mb-1">标准答案</div>
            <div className="text-sm">
              <MarkdownView content={q.answer} />
            </div>
          </div>
          {q.explanation && (
            <details className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm">
              <summary className="cursor-pointer text-xs font-bold text-slate-700">解析</summary>
              <div className="mt-2">
                <MarkdownView content={q.explanation} />
              </div>
            </details>
          )}
          {!isChoice && (
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] text-slate-500 mr-1">自评：</span>
              {([
                ['mastered', '会了', 'bg-emerald-600 text-white border-emerald-600', 'text-emerald-700 border-emerald-300'],
                ['fuzzy', '模糊', 'bg-amber-500 text-white border-amber-500', 'text-amber-700 border-amber-300'],
                ['wrong', '不会', 'bg-rose-600 text-white border-rose-600', 'text-rose-700 border-rose-300'],
              ] as const).map(([s, label, on, off]) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => onUpdateProgress(q.id, { status: s })}
                  className={`px-2.5 py-1 rounded-lg border text-xs font-semibold cursor-pointer ${status === s ? on : `bg-white ${off}`}`}
                >
                  {label}
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </article>
  );
}

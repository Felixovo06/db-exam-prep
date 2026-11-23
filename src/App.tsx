import { useState, useMemo, useEffect } from 'react';
import {
  RotateCw,
  Database,
  BookOpen,
  FileText,
  Sparkles,
  Search,
  Download,
  Upload,
  RotateCcw,
  Menu,
  X,
  LayoutList,
  Maximize2,
  Flame,
  CheckCircle2,
  AlertCircle,
  BookOpenCheck,
  Newspaper,
} from 'lucide-react';
import rawDb from './data/db.json';
import {
  Paper,
  Question,
  ChapterId,
  QType,
  MasteryStatus,
  ProgressMap,
  UserProgressItem,
  CHAPTERS,
  QTYPE_LABELS,
} from './types';
import { QuestionCard } from './components/QuestionCard';
import { CheatSheet } from './components/CheatSheet';
import { TopicGuide } from './components/TopicGuide';
import { KnowledgeFeed } from './components/KnowledgeFeed';

const db = rawDb as { papers: Paper[]; questions: Question[] };
const STORAGE_KEY = 'db_exam_prep_progress_v1';

type StudyMode = 'feed' | 'chapter' | 'paper' | 'topics' | 'cheatsheet';
type SortMode = 'weight' | 'difficulty' | 'newest';
type StatusFilter = 'all' | MasteryStatus | 'need_review';
type ViewMode = 'focus' | 'list';

export function App() {
  const [mode, setMode] = useState<StudyMode>('feed');
  const [selectedChapter, setSelectedChapter] = useState<ChapterId>('ch1');
  const [selectedPaperId, setSelectedPaperId] = useState<string>(db.papers[0]?.id ?? '2023_fall');

  const [sortMode, setSortMode] = useState<SortMode>('weight');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [qtypeFilter, setQtypeFilter] = useState<QType | 'all'>('all');
  const [recentOnly, setRecentOnly] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<ViewMode>('focus');
  const [focusIdx, setFocusIdx] = useState(0);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const [progress, setProgress] = useState<ProgressMap>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
    } catch {
      // ignore quota errors
    }
  }, [progress]);

  const paperMap = useMemo(() => {
    const m: Record<string, Paper> = {};
    for (const p of db.papers) m[p.id] = p;
    return m;
  }, []);

  // 重刷：清除指定题目的作答记录；resetNonce 变化会让题目卡片整体重建（清空选项、草稿、已展开的答案）
  const [resetNonce, setResetNonce] = useState(0);
  const redoQuestions = (ids: string[], label: string) => {
    const done = ids.filter((id) => progress[id]).length;
    if (!confirm(`确定重刷「${label}」吗？\n将清除这 ${ids.length} 道题中 ${done} 道已有的作答记录、草稿和掌握状态，可重新从头刷。\n建议先在左下角“导出备份”。`)) return;
    setProgress((prev) => {
      const next = { ...prev };
      for (const id of ids) delete next[id];
      return next;
    });
    setResetNonce((n) => n + 1);
    setStatusFilter('all');
    setFocusIdx(0);
  };

  const updateProgress = (qid: string, update: Partial<UserProgressItem>) => {
    setProgress((prev) => ({
      ...prev,
      [qid]: {
        ...prev[qid],
        ...update,
        status: update.status ?? prev[qid]?.status ?? 'unseen',
        updatedAt: Date.now(),
      },
    }));
  };

  // Global stats
  const stats = useMemo(() => {
    let mastered = 0;
    let wrong = 0;
    let fuzzy = 0;
    let recentTotal = 0;
    let recentMastered = 0;

    for (const q of db.questions) {
      const st = progress[q.id]?.status ?? 'unseen';
      if (st === 'mastered') mastered++;
      if (st === 'wrong') wrong++;
      if (st === 'fuzzy') fuzzy++;
      if (paperMap[q.paper_id]?.is_recent) {
        recentTotal++;
        if (st === 'mastered') recentMastered++;
      }
    }
    return {
      total: db.questions.length,
      mastered,
      wrong,
      fuzzy,
      recentTotal,
      recentMastered,
    };
  }, [progress, paperMap]);

  // Filtered & sorted questions
  const filteredQuestions = useMemo(() => {
    const kw = searchQuery.trim().toLowerCase();
    const list = db.questions.filter((q) => {
      if (mode === 'chapter' && q.chapter !== selectedChapter) return false;
      if (mode === 'paper' && q.paper_id !== selectedPaperId) return false;

      const p = paperMap[q.paper_id];
      if (recentOnly && !p?.is_recent) return false;
      if (qtypeFilter !== 'all' && q.qtype !== qtypeFilter) return false;

      const st = progress[q.id]?.status ?? 'unseen';
      if (statusFilter === 'need_review') {
        if (st !== 'wrong' && st !== 'fuzzy') return false;
      } else if (statusFilter !== 'all' && st !== statusFilter) {
        return false;
      }

      if (kw) {
        const hay = `${q.stem} ${q.topic_tag} ${q.context} ${q.answer}`.toLowerCase();
        if (!hay.includes(kw)) return false;
      }
      return true;
    });

    if (mode === 'paper') {
      // Keep original exam order inside a paper
      return list;
    }

    return [...list].sort((a, b) => {
      const pa = paperMap[a.paper_id];
      const pb = paperMap[b.paper_id];
      if (sortMode === 'weight') {
        const wa = pa?.weight ?? 1;
        const wb = pb?.weight ?? 1;
        if (wb !== wa) return wb - wa;
        if ((pb?.year ?? 0) !== (pa?.year ?? 0)) return (pb?.year ?? 0) - (pa?.year ?? 0);
        return a.difficulty - b.difficulty;
      }
      if (sortMode === 'difficulty') {
        if (a.difficulty !== b.difficulty) return a.difficulty - b.difficulty;
        return (pb?.weight ?? 0) - (pa?.weight ?? 0);
      }
      // newest
      return (pb?.year ?? 0) - (pa?.year ?? 0) || (pb?.weight ?? 0) - (pa?.weight ?? 0);
    });
  }, [
    mode,
    selectedChapter,
    selectedPaperId,
    sortMode,
    statusFilter,
    qtypeFilter,
    recentOnly,
    searchQuery,
    progress,
    paperMap,
  ]);

  // Clamp focusIdx when filters change
  useEffect(() => {
    setFocusIdx(0);
  }, [mode, selectedChapter, selectedPaperId, statusFilter, qtypeFilter, recentOnly, searchQuery]);

  const currentChapterMeta = CHAPTERS.find((c) => c.id === selectedChapter);
  const currentPaperMeta = paperMap[selectedPaperId];

  const handleExport = () => {
    const blob = new Blob([JSON.stringify(progress, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `db-exam-progress-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(String(reader.result));
        if (parsed && typeof parsed === 'object') {
          setProgress(parsed);
        }
      } catch {
        alert('导入失败：JSON 格式不正确');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleReset = () => {
    if (confirm('确定清空所有刷题记录和草稿吗？建议先点击“导出备份”。')) {
      setProgress({});
    }
  };

  const sidebarContent = (
    <div className="flex flex-col h-full">
      {/* Brand */}
      <div className="p-4 border-b border-slate-200 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-xs">
            <Database className="w-5 h-5" />
          </div>
          <div>
            <div className="font-bold text-sm text-slate-900 leading-tight">数据库原理刷题站</div>
            <div className="text-[11px] text-slate-500">12套真题 · {stats.total} 题全覆盖</div>
          </div>
        </div>
        <button
          type="button"
          onClick={() => setSidebarOpen(false)}
          className="lg:hidden p-1.5 rounded-lg text-slate-500 hover:bg-slate-100"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Progress Summary */}
      <div className="p-4 border-b border-slate-200 bg-slate-50/70 space-y-2.5">
        <div className="flex items-center justify-between text-xs">
          <span className="font-medium text-slate-700">总掌握进度</span>
          <span className="font-mono font-bold text-indigo-700">
            {stats.mastered} / {stats.total}
          </span>
        </div>
        <div className="w-full h-2 rounded-full bg-slate-200 overflow-hidden">
          <div
            className="h-full bg-indigo-600 transition-all duration-300"
            style={{ width: `${Math.round((stats.mastered / Math.max(1, stats.total)) * 100)}%` }}
          />
        </div>
        <div className="grid grid-cols-2 gap-2 pt-1 text-[11px]">
          <button
            type="button"
            onClick={() => {
              setStatusFilter('need_review');
              if (mode === 'cheatsheet' || mode === 'feed') setMode('chapter');
              setSidebarOpen(false);
            }}
            className="flex items-center justify-between px-2.5 py-1.5 rounded-lg bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100 cursor-pointer"
          >
            <span className="flex items-center gap-1"><AlertCircle className="w-3 h-3" /> 错题/模糊</span>
            <span className="font-bold">{stats.wrong + stats.fuzzy}</span>
          </button>
          <div className="flex items-center justify-between px-2.5 py-1.5 rounded-lg bg-indigo-50 text-indigo-700 border border-indigo-200">
            <span className="flex items-center gap-1"><Flame className="w-3 h-3" /> 近期高频</span>
            <span className="font-bold">{stats.recentMastered}/{stats.recentTotal}</span>
          </div>
        </div>
      </div>

      {/* Navigation List */}
      <div className="flex-1 overflow-y-auto p-3 space-y-1">
        {mode === 'chapter' && (
          <>
            <div className="px-2 py-1 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
              按考点章节（7大模块）
            </div>
            {CHAPTERS.map((ch) => {
              const chQs = db.questions.filter((q) => q.chapter === ch.id);
              const chMastered = chQs.filter((q) => progress[q.id]?.status === 'mastered').length;
              const active = selectedChapter === ch.id;
              return (
                <button
                  key={ch.id}
                  type="button"
                  onClick={() => {
                    setSelectedChapter(ch.id);
                    setSidebarOpen(false);
                  }}
                  className={`w-full text-left px-3 py-2.5 rounded-xl transition-all cursor-pointer border ${
                    active
                      ? 'bg-indigo-50 border-indigo-200 text-indigo-950 shadow-2xs'
                      : 'bg-transparent border-transparent hover:bg-slate-100 text-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-semibold truncate">{ch.name}</span>
                    <span className="text-[11px] font-mono text-slate-500 shrink-0">
                      {chMastered}/{chQs.length}
                    </span>
                  </div>
                  <div className="w-full h-1 rounded-full bg-slate-200 mt-1.5 overflow-hidden">
                    <div
                      className={`h-full ${active ? 'bg-indigo-600' : 'bg-emerald-500'}`}
                      style={{ width: `${Math.round((chMastered / Math.max(1, chQs.length)) * 100)}%` }}
                    />
                  </div>
                </button>
              );
            })}
          </>
        )}

        {mode === 'paper' && (
          <>
            <div className="px-2 py-1 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
              历年真题套卷（按年份由新到旧）
            </div>
            {db.papers.map((p) => {
              const pQs = db.questions.filter((q) => q.paper_id === p.id);
              const pMastered = pQs.filter((q) => progress[q.id]?.status === 'mastered').length;
              const active = selectedPaperId === p.id;
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => {
                    setSelectedPaperId(p.id);
                    setSidebarOpen(false);
                  }}
                  className={`w-full text-left px-3 py-2.5 rounded-xl transition-all cursor-pointer border ${
                    active
                      ? 'bg-indigo-50 border-indigo-200 text-indigo-950'
                      : 'bg-transparent border-transparent hover:bg-slate-100 text-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-semibold truncate">
                      {p.term} {p.variant}
                    </span>
                    <span className="text-[11px] font-mono text-slate-500 shrink-0">
                      {pMastered}/{pQs.length}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 mt-1">
                    {p.weight >= 4 && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-rose-100 text-rose-700 font-semibold">
                        高权重 ★{p.weight}
                      </span>
                    )}
                    {p.is_recent && p.weight < 4 && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-indigo-100 text-indigo-700 font-medium">
                        近期真题
                      </span>
                    )}
                    <span className="text-[10px] text-slate-400">{pQs.length}题</span>
                  </div>
                </button>
              );
            })}
          </>
        )}

        {(mode === 'cheatsheet' || mode === 'topics' || mode === 'feed') && (
          <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900 space-y-2">
            <div className="font-bold">
              {mode === 'feed' ? '正在浏览：知识流' : mode === 'topics' ? '正在浏览：13大考点详解+例题' : '正在浏览：0基础急救手册'}
            </div>
            <p className="text-amber-800 leading-relaxed">
              看完套路与例题后，切回「按考点章节」或「历年套卷」直接刷全套真题！
              知识流里做的题，进度和这里是同步的。
            </p>
          </div>
        )}
      </div>

      {/* Footer Backup Tools */}
      <div className="p-3 border-t border-slate-200 flex items-center justify-between gap-1 text-[11px] text-slate-600">
        <button
          type="button"
          onClick={handleExport}
          className="inline-flex items-center gap-1 px-2 py-1.5 rounded-lg hover:bg-slate-100 cursor-pointer"
          title="导出刷题进度 JSON"
        >
          <Download className="w-3.5 h-3.5" />
          导出
        </button>
        <label className="inline-flex items-center gap-1 px-2 py-1.5 rounded-lg hover:bg-slate-100 cursor-pointer">
          <Upload className="w-3.5 h-3.5" />
          导入
          <input type="file" accept=".json" onChange={handleImport} className="hidden" />
        </label>
        <button
          type="button"
          onClick={handleReset}
          className="inline-flex items-center gap-1 px-2 py-1.5 rounded-lg hover:bg-rose-50 hover:text-rose-600 cursor-pointer"
          title="重置全部记录"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          重置
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen flex bg-[#F8F7F4]">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:block w-72 shrink-0 bg-white border-r border-slate-200 sticky top-0 h-screen">
        {sidebarContent}
      </aside>

      {/* Mobile Sidebar Drawer */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div
            className="fixed inset-0 bg-slate-900/40"
            onClick={() => setSidebarOpen(false)}
          />
          <aside className="relative w-72 max-w-[85vw] bg-white h-full shadow-xl z-10">
            {sidebarContent}
          </aside>
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 min-w-0 flex flex-col">
        {/* Top Mode Navbar */}
        <header className="sticky top-0 z-30 bg-white/95 backdrop-blur border-b border-slate-200 px-4 sm:px-6 py-3">
          <div className="max-w-5xl mx-auto flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setSidebarOpen(true)}
                className="lg:hidden p-2 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-100"
              >
                <Menu className="w-5 h-5" />
              </button>

              <div className="inline-flex min-w-0 max-w-full overflow-x-auto rounded-xl bg-slate-100 p-1">
                <button
                  type="button"
                  onClick={() => setMode('chapter')}
                  className={`inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                    mode === 'chapter'
                      ? 'bg-white text-indigo-700 shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <BookOpen className="w-3.5 h-3.5" />
                  按考点章节
                </button>
                <button
                  type="button"
                  onClick={() => setMode('paper')}
                  className={`inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                    mode === 'paper'
                      ? 'bg-white text-indigo-700 shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <FileText className="w-3.5 h-3.5" />
                  历年套卷
                </button>
                <button
                  type="button"
                  onClick={() => setMode('topics')}
                  className={`inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                    mode === 'topics'
                      ? 'bg-white text-indigo-700 shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <BookOpenCheck className="w-3.5 h-3.5" />
                  考点详解+例题
                </button>
                <button
                  type="button"
                  onClick={() => setMode('cheatsheet')}
                  className={`inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                    mode === 'cheatsheet'
                      ? 'bg-white text-amber-700 shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  0基础速查
                </button>
                <button
                  type="button"
                  onClick={() => setMode('feed')}
                  className={`inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                    mode === 'feed'
                      ? 'bg-white text-indigo-700 shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Newspaper className="w-3.5 h-3.5" />
                  知识流
                </button>
              </div>
            </div>

            {mode !== 'cheatsheet' && mode !== 'topics' && mode !== 'feed' && (
              <div className="flex items-center gap-2">
                <div className="inline-flex rounded-lg border border-slate-200 bg-white p-0.5 text-xs">
                  <button
                    type="button"
                    onClick={() => setViewMode('focus')}
                    className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md cursor-pointer ${
                      viewMode === 'focus' ? 'bg-indigo-50 text-indigo-700 font-medium' : 'text-slate-600'
                    }`}
                  >
                    <Maximize2 className="w-3.5 h-3.5" />
                    逐题刷
                  </button>
                  <button
                    type="button"
                    onClick={() => setViewMode('list')}
                    className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md cursor-pointer ${
                      viewMode === 'list' ? 'bg-indigo-50 text-indigo-700 font-medium' : 'text-slate-600'
                    }`}
                  >
                    <LayoutList className="w-3.5 h-3.5" />
                    全览
                  </button>
                </div>
              </div>
            )}
          </div>
        </header>

        {/* Body */}
        <main className={mode === 'feed' ? 'flex-1 min-w-0' : 'flex-1 px-4 sm:px-6 py-6'}>
          {mode === 'feed' ? (
            <KnowledgeFeed
              questions={db.questions}
              papers={db.papers}
              progress={progress}
              onUpdateProgress={updateProgress}
            />
          ) : mode === 'cheatsheet' ? (
            <CheatSheet />
          ) : mode === 'topics' ? (
            <TopicGuide
              questions={db.questions}
              paperMap={paperMap}
              progress={progress}
              onUpdateProgress={updateProgress}
              resetNonce={resetNonce}
              onRedo={redoQuestions}
              onJumpToPractice={(chapter, keyword) => {
                setSelectedChapter(chapter);
                setSearchQuery(keyword ?? '');
                setStatusFilter('all');
                setQtypeFilter('all');
                setMode('chapter');
              }}
            />
          ) : (
            <div className="max-w-5xl mx-auto space-y-5">
              {/* Context Banner */}
              <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs">
                {mode === 'chapter' && currentChapterMeta && (
                  <div className="space-y-1.5">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <h1 className="text-lg font-bold text-slate-900">{currentChapterMeta.name}</h1>
                      <span className="text-xs text-slate-500">
                        当前筛选结果：<strong>{filteredQuestions.length}</strong> 题
                      </span>
                    </div>
                    <p className="text-xs text-slate-600">{currentChapterMeta.description}</p>
                    <div className="text-xs text-indigo-800 bg-indigo-50/70 border border-indigo-100 rounded-lg px-3 py-2 mt-2">
                      <strong>0基础攻略：</strong>
                      {currentChapterMeta.examTip}
                    </div>
                  </div>
                )}

                {mode === 'paper' && currentPaperMeta && (
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <h1 className="text-lg font-bold text-slate-900">{currentPaperMeta.title}</h1>
                      <p className="text-xs text-slate-500 mt-0.5">
                        按原试卷题号顺序排列 · 当前显示 {filteredQuestions.length} 题
                      </p>
                    </div>
                    {currentPaperMeta.weight >= 4 && (
                      <span className="text-xs px-3 py-1 rounded-full bg-rose-50 text-rose-700 border border-rose-200 font-semibold">
                        近期高权重真题 ★{currentPaperMeta.weight}
                      </span>
                    )}
                  </div>
                )}

                {(mode === 'chapter' || mode === 'paper') && (() => {
                  const scopeQs = db.questions.filter((q) =>
                    mode === 'chapter' ? q.chapter === selectedChapter : q.paper_id === selectedPaperId,
                  );
                  const scopeLabel = mode === 'chapter' ? currentChapterMeta?.shortName ?? '本章' : currentPaperMeta?.title ?? '本套卷';
                  const reviewQs = scopeQs.filter((q) => {
                    const st = progress[q.id]?.status;
                    return st === 'wrong' || st === 'fuzzy';
                  });
                  const doneCount = scopeQs.filter((q) => progress[q.id]).length;
                  return (
                    <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
                      <span className="text-slate-500">
                        已刷 {doneCount}/{scopeQs.length}
                      </span>
                      <button
                        type="button"
                        disabled={doneCount === 0}
                        onClick={() => redoQuestions(scopeQs.map((q) => q.id), `${scopeLabel}（全部）`)}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-indigo-600 text-white font-semibold hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                      >
                        <RotateCw className="w-3.5 h-3.5" />
                        {mode === 'chapter' ? '重刷本章全部' : '重刷本套卷全部'}
                      </button>
                      <button
                        type="button"
                        disabled={reviewQs.length === 0}
                        onClick={() => redoQuestions(reviewQs.map((q) => q.id), `${scopeLabel}（错题与模糊题）`)}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-rose-50 text-rose-700 border border-rose-200 font-semibold hover:bg-rose-100 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                      >
                        <RotateCw className="w-3.5 h-3.5" />
                        只重刷错题/模糊（{reviewQs.length}）
                      </button>
                    </div>
                  );
                })()}

                {/* Filters Bar */}
                <div className="mt-4 pt-4 border-t border-slate-100 flex flex-wrap items-center gap-2.5">
                  <div className="relative flex-1 min-w-[180px]">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="搜索题干 / 考点 / SQL 关键词..."
                      className="w-full pl-9 pr-3 py-1.5 rounded-lg border border-slate-200 text-xs bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>

                  {mode === 'chapter' && (
                    <select
                      value={sortMode}
                      onChange={(e) => setSortMode(e.target.value as SortMode)}
                      className="px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs bg-white text-slate-700"
                    >
                      <option value="weight">排序：近几年高权重优先</option>
                      <option value="difficulty">排序：由易到难（0基础）</option>
                      <option value="newest">排序：年份从新到旧</option>
                    </select>
                  )}

                  <select
                    value={qtypeFilter}
                    onChange={(e) => setQtypeFilter(e.target.value as QType | 'all')}
                    className="px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs bg-white text-slate-700"
                  >
                    <option value="all">全部题型</option>
                    {Object.entries(QTYPE_LABELS).map(([k, v]) => (
                      <option key={k} value={k}>
                        {v}
                      </option>
                    ))}
                  </select>

                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
                    className="px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs bg-white text-slate-700"
                  >
                    <option value="all">全部状态</option>
                    <option value="unseen">仅未刷</option>
                    <option value="need_review">错题与模糊</option>
                    <option value="wrong">仅错题/不会</option>
                    <option value="mastered">已掌握</option>
                  </select>

                  {mode === 'chapter' && (
                    <button
                      type="button"
                      onClick={() => setRecentOnly((v) => !v)}
                      className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border text-xs font-medium cursor-pointer transition-colors ${
                        recentOnly
                          ? 'bg-rose-600 text-white border-rose-600'
                          : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      <Flame className="w-3.5 h-3.5" />
                      仅近几年 (2018-2024)
                    </button>
                  )}
                </div>
              </div>

              {/* Questions Display */}
              {filteredQuestions.length === 0 ? (
                <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center space-y-2">
                  <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto" />
                  <div className="font-semibold text-slate-800">当前筛选条件下没有题目</div>
                  <p className="text-xs text-slate-500">
                    可以切换状态筛选（例如改为“全部状态”）或清空搜索词。
                  </p>
                </div>
              ) : viewMode === 'focus' ? (
                <div className="space-y-4">
                  {/* Question Quick Jump Strip */}
                  <div className="bg-white rounded-xl border border-slate-200 p-3 flex flex-wrap items-center gap-1.5">
                    {filteredQuestions.map((q, idx) => {
                      const st = progress[q.id]?.status ?? 'unseen';
                      const isCur = idx === focusIdx;
                      let pillCls = 'bg-slate-100 text-slate-600 border-transparent hover:bg-slate-200';
                      if (st === 'mastered') pillCls = 'bg-emerald-100 text-emerald-800 border-emerald-200';
                      if (st === 'wrong') pillCls = 'bg-rose-100 text-rose-800 border-rose-200';
                      if (st === 'fuzzy') pillCls = 'bg-amber-100 text-amber-800 border-amber-200';
                      if (isCur) pillCls += ' ring-2 ring-indigo-600 font-bold';

                      return (
                        <button
                          key={q.id}
                          type="button"
                          onClick={() => setFocusIdx(idx)}
                          className={`w-7 h-7 rounded-md text-xs font-mono border transition-all cursor-pointer ${pillCls}`}
                          title={`${q.topic_tag}`}
                        >
                          {idx + 1}
                        </button>
                      );
                    })}
                  </div>

                  <QuestionCard
                    key={`${filteredQuestions[focusIdx].id}-${resetNonce}`}
                    question={filteredQuestions[focusIdx]}
                    paper={paperMap[filteredQuestions[focusIdx].paper_id]}
                    progress={progress[filteredQuestions[focusIdx].id]}
                    onUpdateProgress={updateProgress}
                    indexLabel={`第 ${focusIdx + 1} / ${filteredQuestions.length} 题`}
                    onPrev={focusIdx > 0 ? () => setFocusIdx((i) => i - 1) : undefined}
                    onNext={
                      focusIdx < filteredQuestions.length - 1
                        ? () => setFocusIdx((i) => i + 1)
                        : undefined
                    }
                  />
                </div>
              ) : (
                <div className="space-y-5">
                  {filteredQuestions.map((q, idx) => (
                    <QuestionCard
                      key={`${q.id}-${resetNonce}`}
                      question={q}
                      paper={paperMap[q.paper_id]}
                      progress={progress[q.id]}
                      onUpdateProgress={updateProgress}
                      indexLabel={`#${idx + 1}`}
                    />
                  ))}
                </div>
              )}
            </div>
          )}
        </main>
      </div>
      <div className="fixed bottom-2 right-3 text-[11px] text-slate-400 bg-white/80 rounded px-2 py-0.5 pointer-events-none">
        <span id="busuanzi_container_site_uv" style={{ display: 'none' }}>
          访客 <span id="busuanzi_value_site_uv" />
        </span>
        <span id="busuanzi_container_site_pv" style={{ display: 'none' }}>
          {' · '}访问 <span id="busuanzi_value_site_pv" />
        </span>
      </div>
    </div>
  );
}

export default App;

import { useState } from 'react';
import { Flame, ArrowRight, BookOpenCheck, Sparkles, CheckCircle2 } from 'lucide-react';
import { TOPIC_GUIDES, TopicGuideItem } from '../data/topics';
import { Question, Paper, UserProgressItem, CHAPTERS } from '../types';
import { MarkdownView } from './MarkdownView';
import { QuestionCard } from './QuestionCard';

interface TopicGuideProps {
  questions: Question[];
  paperMap: Record<string, Paper>;
  progress: Record<string, UserProgressItem>;
  onUpdateProgress: (qid: string, update: Partial<UserProgressItem>) => void;
  onJumpToPractice: (chapter: TopicGuideItem['chapter'], keyword?: string) => void;
}

const TIER_BADGE: Record<TopicGuideItem['tier'], { label: string; cls: string }> = {
  must: { label: '100% 必考', cls: 'bg-rose-100 text-rose-700 border-rose-200' },
  almost: { label: '几乎必考', cls: 'bg-amber-100 text-amber-800 border-amber-200' },
  high: { label: '高频常考', cls: 'bg-indigo-100 text-indigo-700 border-indigo-200' },
};

export function TopicGuide({
  questions,
  paperMap,
  progress,
  onUpdateProgress,
  onJumpToPractice,
}: TopicGuideProps) {
  const [selectedId, setSelectedId] = useState<string>(TOPIC_GUIDES[0].id);

  const current = TOPIC_GUIDES.find((t) => t.id === selectedId) ?? TOPIC_GUIDES[0];
  const exampleQuestion = questions.find((q) => q.id === current.exampleQuestionId);
  const chapterMeta = CHAPTERS.find((c) => c.id === current.chapter);

  const relatedCount = questions.filter((q) => {
    if (q.chapter !== current.chapter) return false;
    if (!current.filterKeyword) return true;
    const hay = `${q.stem} ${q.topic_tag} ${q.answer}`.toLowerCase();
    return hay.includes(current.filterKeyword.toLowerCase());
  }).length;

  return (
    <div className="max-w-5xl mx-auto space-y-5 pb-12">
      {/* Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white rounded-2xl p-5 shadow-xs">
        <div className="flex items-center gap-2 text-indigo-300 text-xs font-semibold uppercase tracking-wider mb-1.5">
          <BookOpenCheck className="w-4 h-4" />
          13 大核心固定考点精讲 + 真题例题
        </div>
        <h1 className="text-xl font-bold mb-1">逐个考点详解（面向 0 基础）</h1>
        <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
          根据近 8 套真题统计，这 13 个考点覆盖了约 85% 以上的考分。建议按顺序逐个看懂套路，直接做下方配套的历年真题例题，再一键刷同类题。
        </p>
      </div>

      <div className="grid lg:grid-cols-12 gap-5 items-start">
        {/* Topic Selector List */}
        <div className="lg:col-span-4 bg-white rounded-2xl border border-slate-200 p-3 space-y-1 lg:sticky lg:top-20 max-h-[78vh] overflow-y-auto">
          <div className="px-2 py-1 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
            选择考点（按考频排序）
          </div>
          {TOPIC_GUIDES.map((t) => {
            const active = t.id === current.id;
            const badge = TIER_BADGE[t.tier];
            const exDone = progress[t.exampleQuestionId]?.status === 'mastered';
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => setSelectedId(t.id)}
                className={`w-full text-left px-3 py-2.5 rounded-xl border transition-all cursor-pointer ${
                  active
                    ? 'bg-indigo-50 border-indigo-300 text-indigo-950 shadow-2xs'
                    : 'bg-transparent border-transparent hover:bg-slate-50 text-slate-700'
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-bold leading-snug">{t.title}</span>
                  {exDone && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />}
                </div>
                <div className="flex items-center gap-1.5 mt-1.5">
                  <span className={`text-[10px] px-1.5 py-0.5 rounded border font-medium ${badge.cls}`}>
                    {t.hitRate}
                  </span>
                  <span className="text-[10px] text-slate-500">{t.pointsHint}</span>
                </div>
              </button>
            );
          })}
        </div>

        {/* Topic Detail + Embedded Real Example */}
        <div className="lg:col-span-8 space-y-5 min-w-0">
          <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-xs space-y-4">
            <div className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-100 pb-4">
              <div className="space-y-1.5">
                <div className="flex flex-wrap items-center gap-2">
                  <span
                    className={`text-xs px-2.5 py-0.5 rounded-full border font-semibold ${
                      TIER_BADGE[current.tier].cls
                    }`}
                  >
                    <Flame className="w-3 h-3 inline mr-1 -mt-0.5" />
                    {current.hitRate}
                  </span>
                  <span className="text-xs px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 font-medium">
                    分值参考：{current.pointsHint}
                  </span>
                  <span className="text-xs text-slate-500">{chapterMeta?.shortName}</span>
                </div>
                <h2 className="text-xl font-bold text-slate-900">{current.title}</h2>
                <p className="text-xs text-slate-600 leading-relaxed">{current.summary}</p>
              </div>

              <button
                type="button"
                onClick={() => onJumpToPractice(current.chapter, current.filterKeyword)}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-indigo-600 text-white text-xs font-semibold hover:bg-indigo-700 transition-colors cursor-pointer shrink-0 shadow-2xs"
              >
                去刷同类真题 ({relatedCount}题)
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <MarkdownView content={current.guideMarkdown} className="text-sm" />
          </div>

          {/* Real Past Exam Example */}
          {exampleQuestion && (
            <div className="space-y-2.5">
              <div className="flex items-center justify-between px-1">
                <div className="flex items-center gap-1.5 text-sm font-bold text-slate-900">
                  <Sparkles className="w-4 h-4 text-amber-500" />
                  配套真题例题（可直接作答与对答案）
                </div>
                <button
                  type="button"
                  onClick={() => onJumpToPractice(current.chapter, current.filterKeyword)}
                  className="text-xs text-indigo-600 hover:text-indigo-800 font-medium cursor-pointer"
                >
                  查看更多同类题 →
                </button>
              </div>

              <QuestionCard
                question={exampleQuestion}
                paper={paperMap[exampleQuestion.paper_id]}
                progress={progress[exampleQuestion.id]}
                onUpdateProgress={onUpdateProgress}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

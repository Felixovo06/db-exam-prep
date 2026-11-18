import { useState, useEffect } from 'react';
import {
  Lightbulb,
  CheckCircle2,
  XCircle,
  HelpCircle,
  Eye,
  EyeOff,
  ChevronLeft,
  ChevronRight,
  Star,
  BookMarked,
} from 'lucide-react';
import {
  Question,
  Paper,
  MasteryStatus,
  UserProgressItem,
  CHAPTERS,
  QTYPE_LABELS,
} from '../types';
import { MarkdownView } from './MarkdownView';

interface QuestionCardProps {
  question: Question;
  paper?: Paper;
  progress?: UserProgressItem;
  onUpdateProgress: (qid: string, update: Partial<UserProgressItem>) => void;
  onPrev?: () => void;
  onNext?: () => void;
  indexLabel?: string;
}

const DIFF_LABELS: Record<number, { text: string; cls: string }> = {
  1: { text: '基础', cls: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  2: { text: '常规', cls: 'bg-sky-50 text-sky-700 border-sky-200' },
  3: { text: '综合', cls: 'bg-purple-50 text-purple-700 border-purple-200' },
};

const STATUS_BADGE: Record<MasteryStatus, { text: string; cls: string }> = {
  unseen: { text: '未刷', cls: 'bg-slate-100 text-slate-600' },
  wrong: { text: '错题/不会', cls: 'bg-rose-100 text-rose-700' },
  fuzzy: { text: '模糊待巩固', cls: 'bg-amber-100 text-amber-700' },
  mastered: { text: '已掌握', cls: 'bg-emerald-100 text-emerald-700' },
};

export function QuestionCard({
  question,
  paper,
  progress,
  onUpdateProgress,
  onPrev,
  onNext,
  indexLabel,
}: QuestionCardProps) {
  const [showPrereq, setShowPrereq] = useState(false);
  const [showAnswer, setShowAnswer] = useState(false);
  const [selected, setSelected] = useState<string[]>(progress?.selectedOptions ?? []);
  const [draft, setDraft] = useState(progress?.draft ?? '');
  const [choiceSubmitted, setChoiceSubmitted] = useState(false);

  useEffect(() => {
    setSelected(progress?.selectedOptions ?? []);
    setDraft(progress?.draft ?? '');
    setChoiceSubmitted(Boolean(progress?.selectedOptions && progress.selectedOptions.length > 0 && progress.status !== 'unseen'));
    setShowAnswer(false);
    setShowPrereq(false);
  }, [question.id]);

  const chapterMeta = CHAPTERS.find((c) => c.id === question.chapter);
  const status: MasteryStatus = progress?.status ?? 'unseen';
  const diff = DIFF_LABELS[question.difficulty] ?? DIFF_LABELS[2];

  const isMultiple =
    question.qtype === 'choice' &&
    (question.correct_options.length > 1 || question.section.includes('不定项'));

  const toggleOption = (letter: string) => {
    if (choiceSubmitted) return;
    if (isMultiple) {
      setSelected((prev) =>
        prev.includes(letter) ? prev.filter((x) => x !== letter) : [...prev, letter].sort()
      );
    } else {
      setSelected([letter]);
    }
  };

  const handleCheckChoice = () => {
    if (selected.length === 0) return;
    const normSelected = [...selected].sort().join('');
    const normCorrect = [...question.correct_options].sort().join('');
    const isRight = normSelected === normCorrect;
    setChoiceSubmitted(true);
    setShowAnswer(true);
    onUpdateProgress(question.id, {
      selectedOptions: selected,
      status: isRight ? 'mastered' : 'wrong',
    });
  };

  const handleResetChoice = () => {
    setSelected([]);
    setChoiceSubmitted(false);
    setShowAnswer(false);
  };

  const handleSaveDraft = (val: string) => {
    setDraft(val);
    onUpdateProgress(question.id, { draft: val });
  };

  const setMastery = (newStatus: MasteryStatus) => {
    onUpdateProgress(question.id, { status: newStatus });
  };

  const extractOptionLetter = (opt: string, idx: number) => {
    const m = opt.trim().match(/^([A-Za-z])[\.、\s]/);
    return m ? m[1].toUpperCase() : String.fromCharCode(65 + idx);
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
      {/* Top Meta Bar */}
      <div className="px-5 py-3.5 bg-slate-50/80 border-b border-slate-200 flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-2 text-xs">
          {indexLabel && (
            <span className="font-mono font-semibold text-slate-500 mr-1">{indexLabel}</span>
          )}
          {paper && (
            <span
              className={`px-2.5 py-0.5 rounded-full font-medium flex items-center gap-1 border ${
                paper.is_recent
                  ? 'bg-indigo-50 text-indigo-700 border-indigo-200'
                  : 'bg-slate-100 text-slate-600 border-slate-200'
              }`}
            >
              {paper.is_recent && <Star className="w-3 h-3 fill-indigo-500 text-indigo-500" />}
              {paper.term} · {paper.variant}
              {paper.weight >= 4 && ' (高权重)'}
            </span>
          )}
          <span className="px-2 py-0.5 rounded-md bg-white border border-slate-200 text-slate-700 font-medium">
            {question.section} #{question.number}
          </span>
          <span className="px-2 py-0.5 rounded-md bg-white border border-slate-200 text-slate-600">
            {QTYPE_LABELS[question.qtype]} · {question.points}分
          </span>
          <span className={`px-2 py-0.5 rounded-md border ${diff.cls}`}>{diff.text}</span>
        </div>

        <div className="flex items-center gap-2">
          <span className={`text-xs px-2.5 py-0.5 rounded-full font-medium ${STATUS_BADGE[status].cls}`}>
            {STATUS_BADGE[status].text}
          </span>
        </div>
      </div>

      {/* Chapter + Topic Tag + 0-Foundation Prereq Toggle */}
      <div className="px-5 pt-4 pb-2 flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <span className="inline-flex items-center gap-1 text-slate-600 bg-slate-100 px-2.5 py-1 rounded-md">
            <BookMarked className="w-3.5 h-3.5 text-slate-500" />
            {chapterMeta?.shortName ?? question.chapter}
          </span>
          <span className="inline-flex items-center px-2.5 py-1 rounded-md bg-amber-50 text-amber-800 border border-amber-200 font-medium">
            考点：{question.topic_tag}
          </span>
        </div>

        <button
          type="button"
          onClick={() => setShowPrereq((v) => !v)}
          className={`inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg border transition-colors cursor-pointer ${
            showPrereq
              ? 'bg-amber-500 text-white border-amber-500'
              : 'bg-amber-50 text-amber-800 border-amber-200 hover:bg-amber-100'
          }`}
        >
          <Lightbulb className="w-3.5 h-3.5" />
          {showPrereq ? '收起前置知识点' : '0基础前置考点速通'}
        </button>
      </div>

      {/* Collapsible 0-Foundation Prereq Card */}
      {showPrereq && (
        <div className="mx-5 my-2 p-4 rounded-xl bg-amber-50/70 border border-amber-200 text-sm">
          <div className="font-semibold text-amber-900 mb-1 flex items-center gap-1.5 text-xs uppercase tracking-wide">
            <Lightbulb className="w-4 h-4 text-amber-600" />
            做题前先看这 30 秒
          </div>
          <MarkdownView content={question.prereq_note} className="text-sm text-amber-950" />
        </div>
      )}

      {/* Main Question Body */}
      <div className="px-5 py-4 space-y-4">
        {question.context && question.context.trim() !== '' && (
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-sm">
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
              已知关系模式 / 背景数据
            </div>
            <MarkdownView content={question.context} />
          </div>
        )}

        <div className="text-[15px] text-slate-900 leading-relaxed">
          <MarkdownView content={question.stem} />
        </div>

        {/* Choice Interaction */}
        {question.qtype === 'choice' && question.options.length > 0 && (
          <div className="space-y-2.5 pt-1">
            <div className="text-xs text-slate-500">
              {isMultiple ? '不定项选择（可多选，点击选项后提交判题）' : '单项选择题'}
            </div>
            <div className="grid gap-2">
              {question.options.map((opt, idx) => {
                const letter = extractOptionLetter(opt, idx);
                const isPicked = selected.includes(letter);
                const isCorrect = question.correct_options.includes(letter);

                let cardCls =
                  'border-slate-200 bg-white hover:border-indigo-300 hover:bg-indigo-50/30';
                if (choiceSubmitted) {
                  if (isCorrect) {
                    cardCls = 'border-emerald-500 bg-emerald-50/70 text-emerald-950';
                  } else if (isPicked && !isCorrect) {
                    cardCls = 'border-rose-400 bg-rose-50/70 text-rose-950';
                  } else {
                    cardCls = 'border-slate-200 bg-slate-50/50 opacity-70';
                  }
                } else if (isPicked) {
                  cardCls = 'border-indigo-500 bg-indigo-50/70 ring-1 ring-indigo-500';
                }

                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => toggleOption(letter)}
                    className={`w-full text-left px-4 py-3 rounded-xl border text-sm transition-all flex items-start gap-3 cursor-pointer ${cardCls}`}
                  >
                    <span
                      className={`w-6 h-6 rounded-md shrink-0 flex items-center justify-center font-mono text-xs font-bold border ${
                        isPicked
                          ? 'bg-indigo-600 text-white border-indigo-600'
                          : 'bg-slate-100 text-slate-700 border-slate-300'
                      }`}
                    >
                      {letter}
                    </span>
                    <span className="flex-1 pt-0.5 leading-relaxed">
                      {opt.replace(/^[A-Za-z][\.、\s]+/, '')}
                    </span>
                    {choiceSubmitted && isCorrect && (
                      <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                    )}
                    {choiceSubmitted && isPicked && !isCorrect && (
                      <XCircle className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />
                    )}
                  </button>
                );
              })}
            </div>

            <div className="flex flex-wrap items-center gap-2.5 pt-2">
              {!choiceSubmitted ? (
                <button
                  type="button"
                  disabled={selected.length === 0}
                  onClick={handleCheckChoice}
                  className="px-4 py-2 rounded-lg bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                >
                  提交判题
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleResetChoice}
                  className="px-3.5 py-2 rounded-lg bg-slate-100 text-slate-700 text-sm font-medium hover:bg-slate-200 cursor-pointer"
                >
                  重新作答
                </button>
              )}
              <button
                type="button"
                onClick={() => setShowAnswer((v) => !v)}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-slate-200 text-slate-700 text-sm hover:bg-slate-50 cursor-pointer"
              >
                {showAnswer ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                {showAnswer ? '隐藏解析' : '直接看解析'}
              </button>
            </div>
          </div>
        )}

        {/* Non-choice Scratchpad + Show Answer */}
        {question.qtype !== 'choice' && (
          <div className="space-y-3 pt-1">
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1.5">
                草稿 / 作答区（自动保存在本地，写完后对比标准答案）
              </label>
              <textarea
                value={draft}
                onChange={(e) => handleSaveDraft(e.target.value)}
                rows={question.qtype === 'fill' ? 2 : 4}
                placeholder={
                  question.qtype === 'sql'
                    ? '在这里试写你的 SQL 语句...'
                    : '在这里写下你的思路、关系代数或关系模式...'
                }
                className="w-full rounded-xl border border-slate-200 bg-slate-50/50 p-3 text-sm font-mono text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white"
              />
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => setShowAnswer((v) => !v)}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700 cursor-pointer"
              >
                {showAnswer ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                {showAnswer ? '收起答案与解析' : '查看标准答案与分步解析'}
              </button>
            </div>
          </div>
        )}

        {/* Standard Answer & Explanation */}
        {showAnswer && (
          <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50/40 p-4 space-y-3">
            <div>
              <div className="text-xs font-bold text-emerald-800 uppercase tracking-wider mb-1">
                标准答案
              </div>
              <MarkdownView content={question.answer} className="text-sm font-medium text-slate-900" />
            </div>
            <div className="border-t border-emerald-200/70 pt-3">
              <div className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                分步解析 & 易错点
              </div>
              <MarkdownView content={question.explanation} className="text-sm text-slate-700" />
            </div>
          </div>
        )}
      </div>

      {/* Footer: Self-rating + Prev/Next */}
      <div className="px-5 py-3.5 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs text-slate-500 mr-1">掌握自评：</span>
          <button
            type="button"
            onClick={() => setMastery('wrong')}
            className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium border cursor-pointer transition-colors ${
              status === 'wrong'
                ? 'bg-rose-600 text-white border-rose-600'
                : 'bg-white text-rose-700 border-rose-200 hover:bg-rose-50'
            }`}
          >
            <XCircle className="w-3.5 h-3.5" />
            不会 (进错题)
          </button>
          <button
            type="button"
            onClick={() => setMastery('fuzzy')}
            className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium border cursor-pointer transition-colors ${
              status === 'fuzzy'
                ? 'bg-amber-500 text-white border-amber-500'
                : 'bg-white text-amber-700 border-amber-200 hover:bg-amber-50'
            }`}
          >
            <HelpCircle className="w-3.5 h-3.5" />
            模糊
          </button>
          <button
            type="button"
            onClick={() => setMastery('mastered')}
            className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium border cursor-pointer transition-colors ${
              status === 'mastered'
                ? 'bg-emerald-600 text-white border-emerald-600'
                : 'bg-white text-emerald-700 border-emerald-200 hover:bg-emerald-50'
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            已掌握
          </button>
        </div>

        {(onPrev || onNext) && (
          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={!onPrev}
              onClick={onPrev}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-xs font-medium text-slate-700 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
              上一题
            </button>
            <button
              type="button"
              disabled={!onNext}
              onClick={onNext}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-xs font-medium text-slate-700 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
            >
              下一题
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Timer,
  Play,
  Pause,
  RotateCcw,
  Eye,
  EyeOff,
  Lightbulb,
  CheckCircle2,
  XCircle,
  Target,
  Trophy,
} from 'lucide-react';
import mockData from '../data/mock.json';
import { CHAPTERS, Question } from '../types';
import { MarkdownView } from './MarkdownView';

type Src = 'orig' | 'adapt' | 'classic';
interface MockQuestion extends Question {
  src: Src;
  frm: string[];
}
interface ExamMeta {
  id: string;
  title: string;
  subtitle: string;
  minutes: number;
}
interface Mark {
  score?: number;
  picked?: string[];
  done?: boolean; // 选择题已提交
}
type Marks = Record<string, Mark>;

const EXAMS = mockData.exams as ExamMeta[];
const ALL = mockData.questions as unknown as MockQuestion[];
const STORAGE = 'db_mock_exam_v1';

const SRC: Record<Src, { text: string; cls: string; desc: string }> = {
  orig: { text: '原题', cls: 'bg-emerald-50 text-emerald-700 border-emerald-200', desc: '近6套真题原样搬来' },
  adapt: { text: '改编', cls: 'bg-amber-50 text-amber-800 border-amber-200', desc: '真题换数据/换问法' },
  classic: { text: '经典同类', cls: 'bg-sky-50 text-sky-700 border-sky-200', desc: '教材经典题，套路同真题' },
};

const fmtTime = (s: number) => {
  const sign = s < 0 ? '-' : '';
  const a = Math.abs(s);
  const h = Math.floor(a / 3600);
  const m = Math.floor((a % 3600) / 60);
  const ss = a % 60;
  return `${sign}${h > 0 ? h + ':' : ''}${String(m).padStart(2, '0')}:${String(ss).padStart(2, '0')}`;
};

const fmtScore = (n: number) => (Number.isInteger(n) ? String(n) : n.toFixed(1));

function loadMarks(): Marks {
  try {
    const raw = localStorage.getItem(STORAGE);
    return raw ? (JSON.parse(raw) as Marks) : {};
  } catch {
    return {};
  }
}

export function MockExam() {
  const [examId, setExamId] = useState(EXAMS[0].id);
  const [marks, setMarks] = useState<Marks>(loadMarks);
  const [open, setOpen] = useState<Record<string, boolean>>({});
  const [prereq, setPrereq] = useState<Record<string, boolean>>({});
  const [running, setRunning] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const topRef = useRef<HTMLDivElement>(null);

  const exam = EXAMS.find((e) => e.id === examId) ?? EXAMS[0];
  const qs = useMemo(() => ALL.filter((q) => q.paper_id === exam.id), [exam.id]);
  const sections = useMemo(() => {
    const out: { name: string; items: MockQuestion[] }[] = [];
    for (const q of qs) {
      let g = out.find((x) => x.name === q.section);
      if (!g) out.push((g = { name: q.section, items: [] }));
      g.items.push(q);
    }
    return out;
  }, [qs]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE, JSON.stringify(marks));
    } catch {
      /* ignore */
    }
  }, [marks]);

  useEffect(() => {
    if (!running) return;
    const t = setInterval(() => setElapsed((e) => e + 1), 1000);
    return () => clearInterval(t);
  }, [running]);

  // 切卷时重置计时
  useEffect(() => {
    setRunning(false);
    setElapsed(0);
  }, [examId]);

  const setMark = (id: string, patch: Mark) => setMarks((m) => ({ ...m, [id]: { ...m[id], ...patch } }));

  const total = qs.reduce((s, q) => s + q.points, 0);
  const graded = qs.filter((q) => marks[q.id]?.score !== undefined);
  const gradedPts = graded.reduce((s, q) => s + q.points, 0);
  const got = graded.reduce((s, q) => s + (marks[q.id]?.score ?? 0), 0);
  const remain = exam.minutes * 60 - elapsed;

  const loseByChapter = useMemo(() => {
    const m: Record<string, number> = {};
    for (const q of graded) {
      const lost = q.points - (marks[q.id]?.score ?? 0);
      if (lost > 0) m[q.chapter] = (m[q.chapter] ?? 0) + lost;
    }
    return Object.entries(m).sort((a, b) => b[1] - a[1]);
  }, [graded, marks]);

  const srcCount = (s: Src) => qs.filter((q) => q.src === s).length;

  const resetExam = () => {
    if (!window.confirm(`清空「${exam.title}」的全部作答和打分？`)) return;
    setMarks((m) => {
      const n = { ...m };
      qs.forEach((q) => delete n[q.id]);
      return n;
    });
    setOpen({});
    setPrereq({});
    setElapsed(0);
    setRunning(false);
  };

  const verdict = () => {
    if (graded.length === 0) return null;
    const rate = (got / gradedPts) * 100;
    if (graded.length < qs.length)
      return { t: `已批 ${fmtScore(gradedPts)} 分中拿到 ${fmtScore(got)} 分，得分率 ${Math.round(rate)}%（边做边更新，做完整卷给最终结论）`, c: 'text-slate-700 bg-slate-50 border-slate-200' };
    if (got >= 90) return { t: '验收通过：可以放心进考场了', c: 'text-emerald-700 bg-emerald-50 border-emerald-200' };
    if (got >= 80) return { t: '基本过关：把下面的失分章节再扫一遍', c: 'text-sky-700 bg-sky-50 border-sky-200' };
    if (got >= 60) return { t: '及格线上：优先回补失分最多的章节', c: 'text-amber-800 bg-amber-50 border-amber-200' };
    return { t: '还没到位：回到知识流和考点详解先补，再重做一遍', c: 'text-rose-700 bg-rose-50 border-rose-200' };
  };
  const v = verdict();

  return (
    <div ref={topRef} className="max-w-3xl mx-auto space-y-5">
      {/* 选卷 */}
      <div className="flex gap-2">
        {EXAMS.map((e) => (
          <button
            key={e.id}
            type="button"
            onClick={() => setExamId(e.id)}
            className={`flex-1 min-w-0 px-3 py-2.5 rounded-xl border text-sm font-semibold cursor-pointer transition-colors ${
              e.id === exam.id
                ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
            }`}
          >
            {e.title.replace('考前验收卷', '验收卷')}
          </button>
        ))}
      </div>

      {/* 卷头 */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="px-4 sm:px-5 py-4 bg-linear-to-r from-indigo-50 to-white border-b border-slate-200">
          <div className="flex items-start justify-between gap-3 flex-wrap">
            <div className="min-w-0">
              <h2 className="text-lg sm:text-xl font-bold text-slate-900">
                数据库原理 · {exam.title}
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 mt-1">{exam.subtitle}</p>
            </div>
            <div className="text-right shrink-0">
              <div className="text-2xl font-bold text-indigo-700 leading-none">
                {fmtScore(got)}
                <span className="text-sm font-medium text-slate-500"> / {total}</span>
              </div>
              <div className="text-[11px] text-slate-500 mt-1">
                已批 {graded.length}/{qs.length} 题
              </div>
            </div>
          </div>
          <p className="text-xs text-slate-600 mt-3 leading-relaxed">
            题型、分值、题量按最近 3 套（2023秋 / 2020春A / 2018春A）的出题结构组卷，满分 100，建议 {exam.minutes} 分钟。
            题目取自近 6 套真题，每题标明是
            <b className="text-emerald-700"> 原题 </b>、<b className="text-amber-700">改编</b> 还是
            <b className="text-sky-700"> 经典同类</b>，并写出处。
          </p>
        </div>

        {/* 来源分布 + 计时 */}
        <div className="px-4 sm:px-5 py-3 flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap gap-1.5 text-xs">
            {(Object.keys(SRC) as Src[]).map((s) => (
              <span key={s} className={`px-2 py-1 rounded-md border font-medium ${SRC[s].cls}`} title={SRC[s].desc}>
                {SRC[s].text} {srcCount(s)} 题
              </span>
            ))}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={`inline-flex items-center gap-1.5 font-mono text-sm font-semibold px-2.5 py-1.5 rounded-lg border ${
                remain < 0 ? 'bg-rose-50 text-rose-700 border-rose-200' : 'bg-slate-50 text-slate-800 border-slate-200'
              }`}
            >
              <Timer className="w-4 h-4" />
              {fmtTime(remain)}
            </span>
            <button
              type="button"
              onClick={() => setRunning((r) => !r)}
              className="inline-flex shrink-0 items-center gap-1 whitespace-nowrap px-3 py-1.5 rounded-lg bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700 cursor-pointer"
            >
              {running ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
              {running ? '暂停' : elapsed > 0 ? '继续' : '开始计时'}
            </button>
            <button
              type="button"
              onClick={() => {
                setRunning(false);
                setElapsed(0);
              }}
              className="p-2 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 cursor-pointer"
              title="计时归零"
              aria-label="计时归零"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* 各大题 */}
      {sections.map((sec) => (
        <section key={sec.name} className="space-y-3">
          <h3 className="text-sm sm:text-base font-bold text-slate-800 px-1 flex items-center gap-2">
            <span className="w-1 h-5 rounded-full bg-indigo-500" />
            {sec.name}
          </h3>
          {sec.items.map((q) => (
            <QCard
              key={q.id}
              q={q}
              mark={marks[q.id]}
              showAns={!!open[q.id]}
              showPre={!!prereq[q.id]}
              onToggleAns={() => setOpen((o) => ({ ...o, [q.id]: !o[q.id] }))}
              onTogglePre={() => setPrereq((o) => ({ ...o, [q.id]: !o[q.id] }))}
              onMark={(p) => setMark(q.id, p)}
              onSubmitChoice={(picked) => {
                const right = [...picked].sort().join('') === [...q.correct_options].sort().join('');
                setMark(q.id, { picked, done: true, score: right ? q.points : 0 });
                setOpen((o) => ({ ...o, [q.id]: true }));
              }}
              onRedoChoice={() => {
                setMarks((m) => {
                  const n = { ...m };
                  delete n[q.id];
                  return n;
                });
                setOpen((o) => ({ ...o, [q.id]: false }));
              }}
            />
          ))}
        </section>
      ))}

      {/* 成绩单 */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-4 sm:p-5 space-y-3">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <div className="flex items-center gap-2 font-bold text-slate-900">
            <Trophy className="w-5 h-5 text-amber-500" />
            本卷成绩
          </div>
          <div className="text-2xl font-bold text-indigo-700">
            {fmtScore(got)}
            <span className="text-sm font-medium text-slate-500"> / {total}</span>
          </div>
        </div>
        {graded.length < qs.length && (
          <p className="text-xs text-slate-500">
            每道题写完就点“对答案”，对照后打分，成绩和失分分布会实时更新，不用等整卷做完。
          </p>
        )}
        {v && <div className={`text-sm font-semibold px-3 py-2 rounded-lg border ${v.c}`}>{v.t}</div>}
        {loseByChapter.length > 0 && (
          <div>
            <div className="flex items-center gap-1.5 text-sm font-semibold text-slate-800 mb-2">
              <Target className="w-4 h-4 text-rose-500" />
              失分分布（优先回补前面的）
            </div>
            <div className="space-y-1.5">
              {loseByChapter.map(([ch, lost]) => {
                const meta = CHAPTERS.find((c) => c.id === ch);
                return (
                  <div key={ch} className="flex items-center gap-2 text-xs sm:text-sm">
                    <span className="w-28 sm:w-44 shrink-0 truncate text-slate-700">{meta?.shortName ?? ch}</span>
                    <div className="flex-1 h-2 rounded-full bg-slate-100 overflow-hidden">
                      <div className="h-full bg-rose-400" style={{ width: `${Math.min(100, (lost / total) * 400)}%` }} />
                    </div>
                    <span className="w-10 text-right font-mono text-rose-600">-{fmtScore(lost)}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
        <button
          type="button"
          onClick={resetExam}
          className="text-xs px-3 py-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 cursor-pointer"
        >
          清空本卷重做
        </button>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ 单题卡片 */

interface QCardProps {
  q: MockQuestion;
  mark?: Mark;
  showAns: boolean;
  showPre: boolean;
  onToggleAns: () => void;
  onTogglePre: () => void;
  onMark: (p: Mark) => void;
  onSubmitChoice: (picked: string[]) => void;
  onRedoChoice: () => void;
}

function QCard({ q, mark, showAns, showPre, onToggleAns, onTogglePre, onMark, onSubmitChoice, onRedoChoice }: QCardProps) {
  const [picked, setPicked] = useState<string[]>(mark?.picked ?? []);
  useEffect(() => {
    setPicked(mark?.picked ?? []);
  }, [mark?.picked, q.id]);

  const done = !!mark?.done;
  const src = SRC[q.src];
  const steps = q.points >= 5 ? [0, 0.25, 0.5, 0.75, 1] : [0, 0.5, 1];
  const chapter = CHAPTERS.find((c) => c.id === q.chapter);
  const letter = (opt: string, i: number) => {
    const m = opt.trim().match(/^([A-Za-z])[.、\s]/);
    return m ? m[1].toUpperCase() : String.fromCharCode(65 + i);
  };

  const toggle = (l: string) => {
    if (done) return;
    setPicked((p) => (p.includes(l) ? p.filter((x) => x !== l) : [...p, l].sort()));
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
      <div className="px-4 py-2.5 bg-slate-50/80 border-b border-slate-200 flex flex-wrap items-center gap-1.5 text-xs">
        <span className="font-mono font-bold text-slate-700">第 {q.number} 题</span>
        <span className="px-2 py-0.5 rounded-md bg-white border border-slate-200 text-slate-600">{q.points} 分</span>
        <span className={`px-2 py-0.5 rounded-md border font-semibold ${src.cls}`}>{src.text}</span>
        <span className="text-slate-500 min-w-0 break-words">出处：{q.frm.join(' / ')}</span>
        {mark?.score !== undefined && (
          <span
            className={`ml-auto px-2 py-0.5 rounded-full font-semibold ${
              mark.score >= q.points
                ? 'bg-emerald-100 text-emerald-700'
                : mark.score > 0
                  ? 'bg-amber-100 text-amber-800'
                  : 'bg-rose-100 text-rose-700'
            }`}
          >
            {fmtScore(mark.score)} / {q.points}
          </span>
        )}
      </div>

      <div className="px-4 py-4 space-y-3">
        {q.context.trim() !== '' && (
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-sm overflow-x-auto">
            <MarkdownView content={q.context} />
          </div>
        )}
        <div className="text-[15px] text-slate-900 leading-relaxed overflow-x-auto">
          <MarkdownView content={q.stem} />
        </div>

        {q.qtype === 'choice' && (
          <div className="space-y-2">
            <div className="text-xs text-slate-500">不定项选择（多选，选完点“提交判题”）</div>
            {q.options.map((opt, i) => {
              const l = letter(opt, i);
              const on = picked.includes(l);
              const right = q.correct_options.includes(l);
              let cls = 'border-slate-200 bg-white hover:border-indigo-300';
              if (done) {
                cls = right
                  ? 'border-emerald-500 bg-emerald-50/70'
                  : on
                    ? 'border-rose-400 bg-rose-50/70'
                    : 'border-slate-200 bg-slate-50/50 opacity-70';
              } else if (on) cls = 'border-indigo-500 bg-indigo-50/70 ring-1 ring-indigo-500';
              return (
                <button
                  key={i}
                  type="button"
                  onClick={() => toggle(l)}
                  className={`w-full text-left px-3 py-2.5 rounded-xl border text-sm flex items-start gap-3 cursor-pointer ${cls}`}
                >
                  <span
                    className={`w-6 h-6 rounded-md shrink-0 flex items-center justify-center font-mono text-xs font-bold border ${
                      on ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-slate-100 text-slate-700 border-slate-300'
                    }`}
                  >
                    {l}
                  </span>
                  <span className="flex-1 pt-0.5 leading-relaxed min-w-0 break-words">
                    {opt.replace(/^[A-Za-z][.、\s]+/, '')}
                  </span>
                  {done && right && <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />}
                  {done && on && !right && <XCircle className="w-5 h-5 text-rose-500 shrink-0" />}
                </button>
              );
            })}
            <div className="flex flex-wrap gap-2 pt-1">
              {!done ? (
                <button
                  type="button"
                  disabled={picked.length === 0}
                  onClick={() => onSubmitChoice(picked)}
                  className="px-4 py-2 rounded-lg bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700 disabled:opacity-40 cursor-pointer"
                >
                  提交判题
                </button>
              ) : (
                <button
                  type="button"
                  onClick={onRedoChoice}
                  className="px-3.5 py-2 rounded-lg bg-slate-100 text-slate-700 text-sm font-medium hover:bg-slate-200 cursor-pointer"
                >
                  重新作答
                </button>
              )}
            </div>
          </div>
        )}

        <div className="flex flex-wrap items-center gap-2 pt-1">
          <button
            type="button"
            onClick={onToggleAns}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-slate-200 text-slate-700 text-sm hover:bg-slate-50 cursor-pointer"
          >
            {showAns ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            {showAns ? '收起答案' : '对答案'}
          </button>
          <button
            type="button"
            onClick={onTogglePre}
            className={`inline-flex items-center gap-1.5 text-xs font-medium px-3 py-2 rounded-lg border cursor-pointer ${
              showPre
                ? 'bg-amber-500 text-white border-amber-500'
                : 'bg-amber-50 text-amber-800 border-amber-200 hover:bg-amber-100'
            }`}
          >
            <Lightbulb className="w-3.5 h-3.5" />
            前置知识
          </button>
          <span className="text-[11px] text-slate-500 ml-auto">
            {chapter?.shortName} · {q.topic_tag}
          </span>
        </div>

        {showPre && (
          <div className="p-3 rounded-xl bg-amber-50/70 border border-amber-200 text-sm">
            <MarkdownView content={q.prereq_note} className="text-sm text-amber-950" />
          </div>
        )}

        {showAns && (
          <div className="space-y-3">
            <div className="p-3 rounded-xl bg-emerald-50/60 border border-emerald-200 text-sm overflow-x-auto">
              <div className="text-xs font-semibold text-emerald-800 mb-1.5">参考答案</div>
              <MarkdownView content={q.answer} />
            </div>
            <div className="p-3 rounded-xl bg-indigo-50/50 border border-indigo-100 text-sm overflow-x-auto">
              <div className="text-xs font-semibold text-indigo-800 mb-1.5">解析</div>
              <MarkdownView content={q.explanation} />
            </div>

            {q.qtype !== 'choice' && (
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                <div className="text-xs font-semibold text-slate-700 mb-2">对照你写的，给自己打分（满分 {q.points}）</div>
                <div className="flex flex-wrap gap-1.5">
                  {steps.map((f) => {
                    const sc = Math.round(q.points * f * 2) / 2;
                    const on = mark?.score === sc;
                    return (
                      <button
                        key={f}
                        type="button"
                        onClick={() => onMark({ score: sc })}
                        className={`px-3 py-1.5 rounded-lg border text-sm font-medium cursor-pointer ${
                          on
                            ? f === 1
                              ? 'bg-emerald-600 text-white border-emerald-600'
                              : f === 0
                                ? 'bg-rose-500 text-white border-rose-500'
                                : 'bg-amber-500 text-white border-amber-500'
                            : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        {f === 1 ? `满分 ${q.points}` : f === 0 ? '0 分' : `${fmtScore(sc)} 分`}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

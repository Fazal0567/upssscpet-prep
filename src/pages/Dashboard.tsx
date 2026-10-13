import React from 'react';
import {
  BookOpen,
  CheckCircle2,
  XCircle,
  Target,
  ArrowRight,
  RotateCcw,
  Timer,
  Layers,
  Sparkles,
  TrendingUp,
  Award,
  ChevronRight,
  Flame,
  Bookmark
} from 'lucide-react';
import { Question, SubjectItem, UserAttempt, QuizResult } from '../types';
import { useAuth } from '../context/AuthContext';

interface DashboardProps {
  questions: Question[];
  subjects: SubjectItem[];
  userAttempts: UserAttempt[];
  quizResults: QuizResult[];
  bookmarks: string[];
  onNavigate: (tab: string, meta?: any) => void;
  openAuthModal: () => void;
}

export const Dashboard: React.FC<DashboardProps> = ({
  questions,
  subjects,
  userAttempts,
  quizResults,
  bookmarks,
  onNavigate,
  openAuthModal
}) => {
  const { user, profile } = useAuth();

  // Compute metrics
  const totalQuestions = questions.length;
  const attemptedQuestionIds = new Set(userAttempts.map(a => a.questionId));
  const attemptedCount = attemptedQuestionIds.size;

  const correctAttempts = userAttempts.filter(a => a.isCorrect);
  const incorrectAttempts = userAttempts.filter(a => !a.isCorrect);

  const accuracy = userAttempts.length > 0
    ? Math.round((correctAttempts.length / userAttempts.length) * 100)
    : 0;

  // Incorrect unique questions
  const incorrectQuestionIds = new Set(incorrectAttempts.map(a => a.questionId));

  // Subject-wise progress calculation
  const subjectStats = subjects.map(s => {
    const sQuestions = questions.filter(q => q.subject.toLowerCase() === s.name_en.toLowerCase() || q.subject.toLowerCase() === s.name_hi.toLowerCase());
    const sAttempts = userAttempts.filter(a => a.subject.toLowerCase() === s.name_en.toLowerCase());
    const sCorrect = sAttempts.filter(a => a.isCorrect).length;
    const sAccuracy = sAttempts.length > 0 ? Math.round((sCorrect / sAttempts.length) * 100) : 0;
    const attemptedInSubject = new Set(sAttempts.map(a => a.questionId)).size;
    const completionPercent = sQuestions.length > 0 ? Math.min(100, Math.round((attemptedInSubject / sQuestions.length) * 100)) : 0;

    return {
      ...s,
      totalCount: sQuestions.length,
      attemptedCount: attemptedInSubject,
      correctCount: sCorrect,
      accuracy: sAccuracy,
      completionPercent
    };
  });

  return (
    <div className="space-y-8 pb-12 animate-fade-in">
      {/* Welcome Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-900 via-blue-950 to-indigo-900 text-white p-6 sm:p-8 shadow-xl border border-blue-900/40">
        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/20 text-blue-300 text-xs font-semibold border border-blue-500/30">
              <Sparkles className="w-3.5 h-3.5 text-blue-400" />
              <span>UPSSSC Preliminary Eligibility Test (PET) 2026</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
              Welcome, {profile?.displayName || (user ? 'Aspirant' : 'Candidate')}!
            </h1>
            <p className="text-slate-300 text-xs sm:text-sm leading-relaxed">
              Target 85+ percentile in UPSSSC PET with bilingual questions, real exam mock tests with negative marking, and smart retention flashcards.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => onNavigate('practice')}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs transition shadow-lg shadow-blue-600/30"
            >
              <span>Continue Practice</span>
              <ArrowRight className="w-4 h-4" />
            </button>
            <button
              onClick={() => onNavigate('mocktest')}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-semibold text-xs border border-white/20 transition"
            >
              <Timer className="w-4 h-4 text-amber-400" />
              <span>Full Mock Test</span>
            </button>
          </div>
        </div>
      </div>

      {/* Primary Metrics Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
        {/* Available questions */}
        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-sm hover:shadow-md transition">
          <div className="flex items-center justify-between">
            <span className="text-[11px] sm:text-xs font-semibold text-slate-500 uppercase tracking-wider">Available Qs</span>
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <BookOpen className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2.5 flex items-baseline gap-1.5 sm:gap-2">
            <span className="text-xl sm:text-2xl md:text-3xl font-extrabold text-slate-900">{totalQuestions}</span>
            <span className="text-[11px] sm:text-xs text-slate-500 font-medium">in bank</span>
          </div>
          <div className="mt-2 text-[10px] sm:text-[11px] text-blue-600 font-medium flex items-center gap-1">
            <span>8 syllabus subjects</span>
          </div>
        </div>

        {/* Attempted questions */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm hover:shadow-md transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Attempted</span>
            <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-extrabold text-slate-900">{attemptedCount}</span>
            <span className="text-xs text-slate-500 font-medium">unique questions</span>
          </div>
          <div className="mt-2 text-[11px] text-slate-500">
            {totalQuestions > 0 ? `${Math.round((attemptedCount / totalQuestions) * 100)}% bank completed` : '0%'}
          </div>
        </div>

        {/* Accuracy percentage */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm hover:shadow-md transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Accuracy</span>
            <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Target className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-extrabold text-slate-900">{accuracy}%</span>
            <span className="text-xs text-emerald-600 font-semibold flex items-center gap-0.5">
              <TrendingUp className="w-3.5 h-3.5" />
              {accuracy >= 75 ? 'Excellent' : accuracy >= 50 ? 'Good' : 'Needs Practice'}
            </span>
          </div>
          <div className="mt-2 text-[11px] text-slate-500">
            {userAttempts.length} total answer submissions
          </div>
        </div>

        {/* Correct vs Incorrect */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm hover:shadow-md transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Correct / Wrong</span>
            <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <Award className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-3">
            <div className="flex items-center gap-1 text-emerald-600 font-extrabold text-xl">
              <span>{correctAttempts.length}</span>
              <span className="text-xs font-semibold text-slate-400">Right</span>
            </div>
            <span className="text-slate-300">/</span>
            <div className="flex items-center gap-1 text-rose-600 font-extrabold text-xl">
              <span>{incorrectAttempts.length}</span>
              <span className="text-xs font-semibold text-slate-400">Wrong</span>
            </div>
          </div>
          <div className="mt-2 text-[11px] text-slate-500">
            {bookmarks.length} questions saved in bookmarks
          </div>
        </div>
      </div>

      {/* Action Banners: Continue Practice & Review Incorrect */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
        <div className="bg-gradient-to-br from-blue-50 to-indigo-50/50 rounded-2xl p-6 border border-blue-200 flex flex-col justify-between">
          <div>
            <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center mb-3 shadow-md shadow-blue-500/20">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-slate-900">Continue Topic Practice</h3>
            <p className="text-xs text-slate-600 mt-1 leading-relaxed">
              Sharpen your knowledge with single-question MCQ mode. Instant explanation in Hindi & English with bookmarking.
            </p>
          </div>
          <div className="mt-6 flex items-center justify-between pt-4 border-t border-blue-200/70">
            <span className="text-xs font-semibold text-blue-700">Filter by Subject & Difficulty</span>
            <button
              onClick={() => onNavigate('practice')}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold transition"
            >
              <span>Start Practice</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        <div className="bg-gradient-to-br from-rose-50 to-amber-50/50 rounded-2xl p-6 border border-rose-200 flex flex-col justify-between">
          <div>
            <div className="w-10 h-10 rounded-xl bg-rose-600 text-white flex items-center justify-center mb-3 shadow-md shadow-rose-500/20">
              <RotateCcw className="w-5 h-5" />
            </div>
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900">Review Incorrect Questions</h3>
              <span className="px-2 py-0.5 rounded-full bg-rose-100 text-rose-700 text-xs font-bold">
                {incorrectQuestionIds.size} Needs Revision
              </span>
            </div>
            <p className="text-xs text-slate-600 mt-1 leading-relaxed">
              Don't repeat past mistakes! Re-attempt questions you answered incorrectly during tests and study their in-depth solutions.
            </p>
          </div>
          <div className="mt-6 flex items-center justify-between pt-4 border-t border-rose-200/70">
            <span className="text-xs font-semibold text-rose-700">Target Weak Topics</span>
            <button
              onClick={() => onNavigate('revision')}
              disabled={incorrectQuestionIds.size === 0}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 disabled:bg-slate-300 text-white text-xs font-semibold transition"
            >
              <span>Review Mistakes</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Subject-Wise Progress */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Subject-Wise Mastery (UPSSSC Syllabus)</h2>
            <p className="text-xs text-slate-500">Track coverage and accuracy for each exam section</p>
          </div>
          <button
            onClick={() => onNavigate('practice')}
            className="text-xs font-semibold text-blue-600 hover:underline flex items-center gap-1"
          >
            <span>Practice All Subjects</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {subjectStats.map((sub) => (
            <div
              key={sub.id}
              onClick={() => onNavigate('practice', { subject: sub.name_en })}
              className="group p-4 rounded-xl border border-slate-200 hover:border-blue-400 bg-slate-50/50 hover:bg-white transition cursor-pointer flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-slate-800 line-clamp-1">{sub.name_en}</span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-100 text-blue-700 font-semibold">
                    {sub.totalCount} Qs
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 line-clamp-1 mb-3">{sub.name_hi}</p>

                {/* Progress bar */}
                <div className="space-y-1">
                  <div className="flex justify-between text-[10px] text-slate-500 font-medium">
                    <span>Progress: {sub.completionPercent}%</span>
                    <span>Acc: {sub.accuracy}%</span>
                  </div>
                  <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-blue-600 rounded-full transition-all duration-500"
                      style={{ width: `${sub.completionPercent}%` }}
                    />
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-200/80 flex items-center justify-between text-[11px] font-semibold text-blue-600 group-hover:text-blue-700">
                <span>Practice this</span>
                <ChevronRight className="w-3.5 h-3.5 transform group-hover:translate-x-1 transition" />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Recent Practice Sessions / Quiz History */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Recent Test & Practice Sessions</h2>
            <p className="text-xs text-slate-500">Your latest timed mock tests and practice summaries</p>
          </div>
          {quizResults.length > 0 && (
            <button
              onClick={() => onNavigate('analytics')}
              className="text-xs font-semibold text-blue-600 hover:underline"
            >
              View Detailed Analytics
            </button>
          )}
        </div>

        {quizResults.length === 0 ? (
          <div className="py-10 text-center rounded-xl bg-slate-50 border border-dashed border-slate-300">
            <Timer className="w-10 h-10 text-slate-400 mx-auto mb-2" />
            <h4 className="text-sm font-semibold text-slate-700">No mock tests attempted yet</h4>
            <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1 mb-4">
              Take a timed mock test with negative marking (-0.25) to evaluate your current UPSSSC PET readiness.
            </p>
            <button
              onClick={() => onNavigate('mocktest')}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs transition"
            >
              <Timer className="w-4 h-4" />
              <span>Launch Mock Test</span>
            </button>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {quizResults.slice(0, 5).map((q) => (
              <div key={q.id} className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-xs text-slate-900">{q.title}</span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 font-mono">
                      {new Date(q.timestamp).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="flex items-center gap-4 text-[11px] text-slate-500">
                    <span>{q.totalQuestions} Questions</span>
                    <span className="text-emerald-600 font-medium">{q.correctCount} Correct</span>
                    <span className="text-rose-600 font-medium">{q.incorrectCount} Incorrect</span>
                    <span>{Math.round(q.timeSpentSeconds / 60)} mins</span>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <span className="text-sm font-extrabold text-blue-600">{q.score.toFixed(2)}</span>
                    <span className="text-xs text-slate-400">/{q.maxScore}</span>
                    <p className="text-[10px] text-slate-500">{q.accuracy}% accuracy</p>
                  </div>
                  <button
                    onClick={() => onNavigate('mocktest')}
                    className="p-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition"
                    title="Retake or practice"
                  >
                    Retake
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

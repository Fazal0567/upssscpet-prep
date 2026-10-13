import React, { useState } from 'react';
import { Bookmark, Trash2, CheckCircle2, ChevronRight, BookOpen, Sparkles } from 'lucide-react';
import { Question } from '../types';
import { useAuth } from '../context/AuthContext';

interface BookmarksProps {
  questions: Question[];
  bookmarkIds: string[];
  onToggleBookmark: (qId: string) => void;
  onPracticeQuestion: (q: Question) => void;
}

export const Bookmarks: React.FC<BookmarksProps> = ({
  questions,
  bookmarkIds,
  onToggleBookmark,
  onPracticeQuestion
}) => {
  const { language } = useAuth();
  const [selectedSubject, setSelectedSubject] = useState<string>('all');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const bookmarkedQuestions = questions.filter(q => bookmarkIds.includes(q.id));

  const filtered = bookmarkedQuestions.filter(q => {
    if (selectedSubject !== 'all' && q.subject.toLowerCase() !== selectedSubject.toLowerCase()) {
      return false;
    }
    return true;
  });

  const subjectsInBookmarks = Array.from(new Set(bookmarkedQuestions.map(q => q.subject)));

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12 animate-fade-in">
      <div className="bg-white rounded-2xl p-6 border border-slate-200/90 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Bookmark className="w-5 h-5 text-blue-600 fill-blue-600" />
            <h1 className="text-lg font-bold text-slate-900">Bookmarked Questions ({bookmarkedQuestions.length})</h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">Review and re-attempt questions you saved during tests and practice</p>
        </div>

        {subjectsInBookmarks.length > 0 && (
          <select
            value={selectedSubject}
            onChange={(e) => setSelectedSubject(e.target.value)}
            className="text-xs font-semibold bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800"
          >
            <option value="all">All Saved Subjects ({bookmarkedQuestions.length})</option>
            {subjectsInBookmarks.map(s => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        )}
      </div>

      {filtered.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 text-center border border-slate-200 space-y-3">
          <Bookmark className="w-12 h-12 text-slate-300 mx-auto" />
          <h3 className="text-base font-bold text-slate-800">No bookmarked questions found</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Click the bookmark icon on any question during MCQ practice or mock tests to save it here for fast retrieval.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map((q, idx) => {
            const isExpanded = expandedId === q.id;

            return (
              <div
                key={q.id}
                className="bg-white rounded-2xl border border-slate-200/90 shadow-sm hover:border-blue-300 transition p-5 space-y-3"
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-md bg-blue-50 text-blue-700 font-bold text-xs flex items-center justify-center font-mono">
                      {idx + 1}
                    </span>
                    <span className="text-xs font-bold text-slate-700">{q.subject}</span>
                    <span className="text-slate-300">•</span>
                    <span className="text-xs text-slate-500">{q.topic}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => onToggleBookmark(q.id)}
                      className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-50 transition"
                      title="Remove bookmark"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="space-y-1">
                  <h4 className="text-sm font-semibold text-slate-900 leading-snug">
                    {language === 'hi' ? (q.question_hi || q.question_en) : (q.question_en || q.question_hi)}
                  </h4>
                  {language === 'bilingual' && q.question_hi && q.question_hi !== q.question_en && (
                    <p className="text-xs text-slate-500 font-sans">{q.question_hi}</p>
                  )}
                </div>

                {/* Option preview / toggle solution */}
                <div className="pt-2 flex items-center justify-between border-t border-slate-100">
                  <button
                    onClick={() => setExpandedId(isExpanded ? null : q.id)}
                    className="text-xs font-semibold text-blue-600 hover:underline flex items-center gap-1"
                  >
                    <span>{isExpanded ? 'Hide Solution' : 'View Correct Answer & Explanation'}</span>
                  </button>

                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${
                    q.difficulty === 'easy' ? 'bg-emerald-100 text-emerald-700' :
                    q.difficulty === 'hard' ? 'bg-rose-100 text-rose-700' : 'bg-amber-100 text-amber-700'
                  }`}>
                    {q.difficulty}
                  </span>
                </div>

                {isExpanded && (
                  <div className="mt-3 p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-2 animate-fade-in">
                    <div className="flex items-center gap-1.5 text-emerald-700 font-bold">
                      <CheckCircle2 className="w-4 h-4" />
                      <span>
                        Correct Answer: Option {['A', 'B', 'C', 'D'][q.correct_option]} - {language === 'hi' ? (q.options_hi?.[q.correct_option] || q.options_en?.[q.correct_option]) : (q.options_en?.[q.correct_option] || q.options_hi?.[q.correct_option])}
                      </span>
                    </div>
                    <p className="text-slate-700 leading-relaxed">
                      {language === 'hi' ? (q.explanation_hi || q.explanation_en) : (q.explanation_en || q.explanation_hi)}
                    </p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

import React, { useState, useEffect, useMemo } from 'react';
import {
  CheckCircle2,
  XCircle,
  Bookmark,
  RotateCcw,
  ChevronLeft,
  ChevronRight,
  Filter,
  Languages,
  Award,
  AlertCircle,
  Sparkles,
  BookOpen
} from 'lucide-react';
import { Question, SubjectItem, DifficultyLevel, AppLanguage } from '../types';
import { useAuth } from '../context/AuthContext';

interface MCQPracticeProps {
  questions: Question[];
  subjects: SubjectItem[];
  bookmarks: string[];
  onToggleBookmark: (qId: string) => void;
  onRecordAttempt: (qId: string, selected: number, isCorrect: boolean, timeSpent: number) => void;
  initialSubject?: string;
}

export const MCQPractice: React.FC<MCQPracticeProps> = ({
  questions,
  subjects,
  bookmarks,
  onToggleBookmark,
  onRecordAttempt,
  initialSubject
}) => {
  const { language, setLanguage } = useAuth();

  // Filters
  const [selectedSubject, setSelectedSubject] = useState<string>(initialSubject || 'all');
  const [selectedTopic, setSelectedTopic] = useState<string>('all');
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>('all');
  const [practiceLang, setPracticeLang] = useState<AppLanguage>(language);

  useEffect(() => {
    setPracticeLang(language);
  }, [language]);

  // Filter questions
  const filteredQuestions = useMemo(() => {
    return questions.filter(q => {
      if (selectedSubject !== 'all' && q.subject.toLowerCase() !== selectedSubject.toLowerCase()) {
        return false;
      }
      if (selectedTopic !== 'all' && q.topic.toLowerCase() !== selectedTopic.toLowerCase()) {
        return false;
      }
      if (selectedDifficulty !== 'all' && q.difficulty !== selectedDifficulty) {
        return false;
      }
      return true;
    });
  }, [questions, selectedSubject, selectedTopic, selectedDifficulty]);

  // Available topics for chosen subject
  const availableTopics = useMemo(() => {
    if (selectedSubject === 'all') {
      const topics = new Set<string>();
      questions.forEach(q => topics.add(q.topic));
      return Array.from(topics);
    }
    const subj = subjects.find(s => s.name_en.toLowerCase() === selectedSubject.toLowerCase());
    if (subj && subj.topics.length > 0) return subj.topics;
    const topics = new Set<string>();
    questions.filter(q => q.subject.toLowerCase() === selectedSubject.toLowerCase()).forEach(q => topics.add(q.topic));
    return Array.from(topics);
  }, [selectedSubject, subjects, questions]);

  // Current question index
  const [currentIndex, setCurrentIndex] = useState(0);

  // State for current question submission
  // Map of questionId -> { selectedOption: number, submitted: boolean, isCorrect: boolean }
  const [attemptState, setAttemptState] = useState<Record<string, { selectedOption: number | null; submitted: boolean }>>({});
  const [difficultMarked, setDifficultMarked] = useState<Record<string, boolean>>({});

  // Reset index when filters change
  useEffect(() => {
    setCurrentIndex(0);
  }, [selectedSubject, selectedTopic, selectedDifficulty]);

  const currentQuestion = filteredQuestions[currentIndex] || null;
  const currentAttempt = currentQuestion ? attemptState[currentQuestion.id] || { selectedOption: null, submitted: false } : null;

  const handleSelectOption = (idx: number) => {
    if (!currentQuestion || currentAttempt?.submitted) return;
    setAttemptState(prev => ({
      ...prev,
      [currentQuestion.id]: {
        selectedOption: idx,
        submitted: false
      }
    }));
  };

  const handleSubmitAnswer = () => {
    if (!currentQuestion || !currentAttempt || currentAttempt.selectedOption === null || currentAttempt.submitted) return;
    const selectedOption = currentAttempt.selectedOption;
    const isCorrect = selectedOption === currentQuestion.correct_option;
    setAttemptState(prev => ({
      ...prev,
      [currentQuestion.id]: {
        selectedOption,
        submitted: true
      }
    }));
    onRecordAttempt(currentQuestion.id, selectedOption, isCorrect, 15);
  };

  const handleNext = () => {
    if (currentIndex < filteredQuestions.length - 1) {
      setCurrentIndex(prev => prev + 1);
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1);
    }
  };

  const isBookmarked = currentQuestion ? bookmarks.includes(currentQuestion.id) : false;
  const isMarkedDifficult = currentQuestion ? !!difficultMarked[currentQuestion.id] : false;

  return (
    <div className="space-y-6 pb-12 animate-fade-in max-w-4xl mx-auto">
      {/* Filter and Control Bar */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-sm space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-blue-600" />
            <h2 className="text-sm font-bold text-slate-900">Practice Configuration</h2>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-500">Language:</span>
            <div className="flex bg-slate-100 p-0.5 rounded-lg text-xs font-semibold">
              {(['bilingual', 'hi', 'en'] as AppLanguage[]).map(l => (
                <button
                  key={l}
                  onClick={() => setPracticeLang(l)}
                  className={`px-2.5 py-1 rounded-md capitalize transition ${
                    practiceLang === l ? 'bg-white text-blue-600 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {l === 'bilingual' ? 'द्विभाषी / Bilingual' : l === 'hi' ? 'हिंदी' : 'English'}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Dropdowns */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="block text-[11px] font-semibold text-slate-500 uppercase mb-1">Subject</label>
            <select
              value={selectedSubject}
              onChange={(e) => {
                setSelectedSubject(e.target.value);
                setSelectedTopic('all');
              }}
              className="w-full text-xs font-medium bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All UPSSSC Subjects ({questions.length})</option>
              {subjects.map(s => (
                <option key={s.id} value={s.name_en}>
                  {s.name_en} ({questions.filter(q => q.subject.toLowerCase() === s.name_en.toLowerCase()).length})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-500 uppercase mb-1">Topic</label>
            <select
              value={selectedTopic}
              onChange={(e) => setSelectedTopic(e.target.value)}
              className="w-full text-xs font-medium bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Topics ({filteredQuestions.length})</option>
              {availableTopics.map(t => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-500 uppercase mb-1">Difficulty</label>
            <select
              value={selectedDifficulty}
              onChange={(e) => setSelectedDifficulty(e.target.value)}
              className="w-full text-xs font-medium bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 capitalize"
            >
              <option value="all">All Difficulties</option>
              <option value="easy">Easy (सरल)</option>
              <option value="medium">Medium (मध्यम)</option>
              <option value="hard">Hard (कठिन)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main Practice Card */}
      {filteredQuestions.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center border border-slate-200 space-y-3">
          <BookOpen className="w-12 h-12 text-slate-400 mx-auto" />
          <h3 className="text-base font-bold text-slate-800">No questions match this filter</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Try choosing a different topic or resetting the difficulty filter to explore more questions.
          </p>
          <button
            onClick={() => {
              setSelectedSubject('all');
              setSelectedTopic('all');
              setSelectedDifficulty('all');
            }}
            className="px-4 py-2 rounded-xl bg-blue-600 text-white text-xs font-semibold hover:bg-blue-700 transition"
          >
            Reset All Filters
          </button>
        </div>
      ) : currentQuestion ? (
        <div className="bg-white rounded-3xl border border-slate-200/90 shadow-md overflow-hidden">
          {/* Card Header & Controls */}
          <div className="bg-slate-50 px-4 sm:px-6 py-3 sm:py-4 border-b border-slate-200 flex flex-wrap items-center justify-between gap-2 sm:gap-3">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-1 rounded-lg bg-blue-600 text-white text-xs font-bold font-mono">
                Q {currentIndex + 1} / {filteredQuestions.length}
              </span>
              <span className="text-xs font-semibold text-slate-700">{currentQuestion.subject}</span>
              <span className="text-slate-300 hidden xs:inline">•</span>
              <span className="text-xs text-slate-500 hidden xs:inline">{currentQuestion.topic}</span>
            </div>

            <div className="flex items-center gap-1.5 sm:gap-2">
              <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full ${
                currentQuestion.difficulty === 'easy' ? 'bg-emerald-100 text-emerald-700' :
                currentQuestion.difficulty === 'hard' ? 'bg-rose-100 text-rose-700' :
                'bg-amber-100 text-amber-700'
              }`}>
                {currentQuestion.difficulty}
              </span>

              {/* Mark Difficult Toggle */}
              <button
                onClick={() => setDifficultMarked(prev => ({ ...prev, [currentQuestion.id]: !isMarkedDifficult }))}
                className={`p-1.5 rounded-lg border text-xs font-medium transition ${
                  isMarkedDifficult ? 'bg-amber-100 border-amber-300 text-amber-800' : 'bg-white border-slate-200 text-slate-500 hover:text-slate-800'
                }`}
                title="Mark as tough question"
              >
                <Sparkles className="w-4 h-4" />
              </button>

              {/* Bookmark Toggle */}
              <button
                onClick={() => onToggleBookmark(currentQuestion.id)}
                className={`p-1.5 rounded-lg border text-xs font-medium transition ${
                  isBookmarked ? 'bg-blue-100 border-blue-300 text-blue-700' : 'bg-white border-slate-200 text-slate-500 hover:text-slate-800'
                }`}
                title="Save to bookmarks"
              >
                <Bookmark className={`w-4 h-4 ${isBookmarked ? 'fill-current' : ''}`} />
              </button>
            </div>
          </div>

          {/* Question Text */}
          <div className="p-4 sm:p-6 md:p-8 space-y-4">
            {/* When English mode is selected */}
            {practiceLang === 'en' && (
              <div className="text-base sm:text-lg font-medium text-slate-900 leading-relaxed font-sans">
                <span className="text-blue-600 font-bold mr-1">Q.</span>
                {currentQuestion.question_en || currentQuestion.question_hi}
              </div>
            )}

            {/* When Hindi mode is selected */}
            {practiceLang === 'hi' && (
              <div className="text-base sm:text-lg font-medium text-slate-900 leading-relaxed font-sans">
                <span className="text-blue-600 font-bold mr-1">प्र.</span>
                {currentQuestion.question_hi || currentQuestion.question_en}
              </div>
            )}

            {/* When Bilingual mode is selected */}
            {practiceLang === 'bilingual' && (
              <div className="space-y-3">
                <div className="text-base sm:text-lg font-medium text-slate-900 leading-relaxed font-sans">
                  <span className="text-blue-600 font-bold mr-1">Q.</span>
                  {currentQuestion.question_en || currentQuestion.question_hi}
                </div>
                {currentQuestion.question_hi && currentQuestion.question_hi !== currentQuestion.question_en && (
                  <div className="text-sm sm:text-base text-slate-700 leading-relaxed pt-2 border-t border-slate-100 font-sans">
                    <span className="text-slate-400 font-bold mr-1">हिंदी:</span>
                    {currentQuestion.question_hi}
                  </div>
                )}
              </div>
            )}

            {/* Options */}
            <div className="pt-4 space-y-3">
              {['A', 'B', 'C', 'D'].map((letter, optIdx) => {
                const optHi = currentQuestion.options_hi?.[optIdx] || '';
                const optEn = currentQuestion.options_en?.[optIdx] || '';
                if (!optHi && !optEn) return null;

                const isSelected = currentAttempt?.selectedOption === optIdx;
                const isCorrect = optIdx === currentQuestion.correct_option;
                const isSubmitted = currentAttempt?.submitted;

                let optStyle = 'border-slate-200 bg-white hover:bg-slate-50 text-slate-800';
                let badgeStyle = 'bg-slate-100 text-slate-700';

                if (isSelected && !isSubmitted) {
                  optStyle = 'border-blue-600 bg-blue-50/70 text-blue-900 ring-2 ring-blue-500/20';
                  badgeStyle = 'bg-blue-600 text-white';
                }

                if (isSubmitted) {
                  if (isCorrect) {
                    optStyle = 'border-emerald-500 bg-emerald-50 text-emerald-900 ring-2 ring-emerald-500/30';
                    badgeStyle = 'bg-emerald-600 text-white';
                  } else if (isSelected && !isCorrect) {
                    optStyle = 'border-rose-500 bg-rose-50 text-rose-900 ring-2 ring-rose-500/30';
                    badgeStyle = 'bg-rose-600 text-white';
                  }
                }

                return (
                  <button
                    key={letter}
                    onClick={() => handleSelectOption(optIdx)}
                    disabled={isSubmitted}
                    className={`w-full text-left p-4 rounded-2xl border transition-all flex items-start gap-3.5 ${optStyle}`}
                  >
                    <span className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs shrink-0 transition-colors ${badgeStyle}`}>
                      {letter}
                    </span>
                    <div className="flex-1 text-xs sm:text-sm font-medium space-y-1">
                      {practiceLang === 'en' ? (
                        <div>{optEn || optHi}</div>
                      ) : practiceLang === 'hi' ? (
                        <div>{optHi || optEn}</div>
                      ) : (
                        <div>
                          <div>{optEn || optHi}</div>
                          {optHi && optHi !== optEn && (
                            <div className="text-xs text-slate-500 font-normal pt-0.5">{optHi}</div>
                          )}
                        </div>
                      )}
                    </div>

                    {isSubmitted && isCorrect && (
                      <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                    )}
                    {isSubmitted && isSelected && !isCorrect && (
                      <XCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                    )}
                  </button>
                );
              })}
            </div>

            {/* Submit Action */}
            {!currentAttempt?.submitted ? (
              <div className="pt-4 flex justify-end">
                <button
                  onClick={handleSubmitAnswer}
                  disabled={currentAttempt?.selectedOption === null}
                  className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:bg-slate-200 disabled:text-slate-400 text-white font-semibold text-xs transition shadow-md shadow-blue-600/20"
                >
                  Submit Answer
                </button>
              </div>
            ) : (
              /* Explanation Box (Visible strictly after submission) */
              <div className="mt-6 p-5 rounded-2xl bg-gradient-to-br from-slate-50 to-blue-50/40 border border-blue-200/80 space-y-3 animate-fade-in">
                <div className="flex items-center gap-2">
                  {currentAttempt.selectedOption === currentQuestion.correct_option ? (
                    <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-700">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      <span>Correct Answer!</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1.5 text-xs font-bold text-rose-700">
                      <XCircle className="w-4 h-4 text-rose-600" />
                      <span>
                        Incorrect! Correct Answer: Option {['A', 'B', 'C', 'D'][currentQuestion.correct_option]} (
                        {practiceLang === 'hi'
                          ? (currentQuestion.options_hi?.[currentQuestion.correct_option] || currentQuestion.options_en?.[currentQuestion.correct_option])
                          : (currentQuestion.options_en?.[currentQuestion.correct_option] || currentQuestion.options_hi?.[currentQuestion.correct_option])}
                        )
                      </span>
                    </div>
                  )}
                </div>

                <div className="space-y-2 text-xs sm:text-sm text-slate-800 leading-relaxed">
                  <div className="font-semibold text-slate-900 flex items-center gap-1.5">
                    <BookOpen className="w-4 h-4 text-blue-600" />
                    <span>Detailed Explanation:</span>
                  </div>
                  {practiceLang === 'en' ? (
                    <p className="text-slate-800">{currentQuestion.explanation_en || currentQuestion.explanation_hi}</p>
                  ) : practiceLang === 'hi' ? (
                    <p className="text-slate-800">{currentQuestion.explanation_hi || currentQuestion.explanation_en}</p>
                  ) : (
                    <>
                      {currentQuestion.explanation_en && (
                        <p className="text-slate-800">{currentQuestion.explanation_en}</p>
                      )}
                      {currentQuestion.explanation_hi && currentQuestion.explanation_hi !== currentQuestion.explanation_en && (
                        <p className="text-slate-600 pt-1 border-t border-slate-200/60 font-sans">{currentQuestion.explanation_hi}</p>
                      )}
                    </>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Bottom Navigation */}
          <div className="bg-slate-50 px-6 py-4 border-t border-slate-200 flex items-center justify-between">
            <button
              onClick={handlePrev}
              disabled={currentIndex === 0}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white border border-slate-200 hover:bg-slate-100 disabled:opacity-40 text-xs font-semibold text-slate-700 transition"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Previous</span>
            </button>

            <span className="text-xs font-medium text-slate-500 font-mono">
              {currentIndex + 1} of {filteredQuestions.length}
            </span>

            <button
              onClick={handleNext}
              disabled={currentIndex === filteredQuestions.length - 1}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white text-xs font-semibold transition"
            >
              <span>Next Question</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
};

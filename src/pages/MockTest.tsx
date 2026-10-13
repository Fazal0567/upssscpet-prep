import React, { useState, useEffect, useRef } from 'react';
import {
  Timer,
  CheckCircle2,
  XCircle,
  AlertCircle,
  HelpCircle,
  RotateCcw,
  Award,
  ChevronLeft,
  ChevronRight,
  Flag,
  Play,
  BarChart2,
  BookOpen,
  Filter,
  Check,
  X
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { Question, SubjectItem, QuizResult, QuizQuestionSummary } from '../types';
import { useAuth } from '../context/AuthContext';

interface MockTestProps {
  questions: Question[];
  subjects: SubjectItem[];
  onSaveQuizResult: (result: QuizResult) => void;
}

export const MockTest: React.FC<MockTestProps> = ({
  questions,
  subjects,
  onSaveQuizResult
}) => {
  const { language } = useAuth();

  // Test setup config
  const [inExam, setInExam] = useState(false);
  const [examFinished, setExamFinished] = useState(false);
  const [selectedSubject, setSelectedSubject] = useState<string>('all');
  const [questionCount, setQuestionCount] = useState<number>(20);
  const [durationMinutes, setDurationMinutes] = useState<number>(25);
  const [positiveMark, setPositiveMark] = useState<number>(1.0);
  const [negativeMark, setNegativeMark] = useState<number>(0.25);

  // Active exam state
  const [testQuestions, setTestQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, number | null>>({});
  const [markedForReview, setMarkedForReview] = useState<Record<string, boolean>>({});
  const [visited, setVisited] = useState<Record<string, boolean>>({});
  const [secondsRemaining, setSecondsRemaining] = useState<number>(0);
  const [elapsedSeconds, setElapsedSeconds] = useState<number>(0);

  // Completed result state
  const [quizResult, setQuizResult] = useState<QuizResult | null>(null);
  const [reviewFilter, setReviewFilter] = useState<'all' | 'correct' | 'incorrect' | 'skipped'>('all');
  const [mobilePaletteOpen, setMobilePaletteOpen] = useState(false);
  const [startExamError, setStartExamError] = useState<string | null>(null);

  const timerRef = useRef<any>(null);

  // Start exam
  const handleStartExam = () => {
    setStartExamError(null);
    let pool = [...questions];
    if (selectedSubject !== 'all') {
      pool = pool.filter(q => q.subject.toLowerCase() === selectedSubject.toLowerCase());
    }
    // Shuffle
    pool.sort(() => Math.random() - 0.5);
    const selected = pool.slice(0, Math.min(questionCount, pool.length));

    if (selected.length === 0) {
      setStartExamError('No questions available for this criteria. Please select All Subjects or import questions in Admin Portal.');
      return;
    }

    setTestQuestions(selected);
    setCurrentIndex(0);
    setAnswers({});
    setMarkedForReview({});
    setVisited({ [selected[0].id]: true });
    setSecondsRemaining(durationMinutes * 60);
    setElapsedSeconds(0);
    setInExam(true);
    setExamFinished(false);
    setQuizResult(null);
  };

  // Timer countdown
  useEffect(() => {
    if (inExam && !examFinished) {
      timerRef.current = setInterval(() => {
        setElapsedSeconds(prev => prev + 1);
        setSecondsRemaining(prev => {
          if (prev <= 1) {
            clearInterval(timerRef.current);
            handleAutoSubmit();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [inExam, examFinished]);

  const handleAutoSubmit = () => {
    finishExam();
  };

  const handleSelectOption = (optIdx: number) => {
    const q = testQuestions[currentIndex];
    if (!q) return;
    setAnswers(prev => ({
      ...prev,
      [q.id]: optIdx
    }));
  };

  const handleClearResponse = () => {
    const q = testQuestions[currentIndex];
    if (!q) return;
    setAnswers(prev => {
      const copy = { ...prev };
      delete copy[q.id];
      return copy;
    });
  };

  const handleToggleReview = () => {
    const q = testQuestions[currentIndex];
    if (!q) return;
    setMarkedForReview(prev => ({
      ...prev,
      [q.id]: !prev[q.id]
    }));
  };

  const navigateToQuestion = (index: number) => {
    if (index >= 0 && index < testQuestions.length) {
      setCurrentIndex(index);
      setVisited(prev => ({
        ...prev,
        [testQuestions[index].id]: true
      }));
    }
  };

  // Calculate score and submit
  const finishExam = () => {
    if (timerRef.current) clearInterval(timerRef.current);

    let correctCount = 0;
    let incorrectCount = 0;
    let skippedCount = 0;

    const summaryList: QuizQuestionSummary[] = testQuestions.map(q => {
      const selected = answers[q.id] !== undefined ? answers[q.id] : null;
      const isCorrect = selected !== null && selected === q.correct_option;
      if (selected === null) {
        skippedCount++;
      } else if (isCorrect) {
        correctCount++;
      } else {
        incorrectCount++;
      }

      return {
        questionId: q.id,
        selectedOption: selected,
        correctOption: q.correct_option,
        isCorrect,
        markedForReview: !!markedForReview[q.id],
        timeSpentSeconds: Math.round(elapsedSeconds / testQuestions.length)
      };
    });

    const calculatedScore = (correctCount * positiveMark) - (incorrectCount * negativeMark);
    const maxScore = testQuestions.length * positiveMark;
    const accuracy = (correctCount + incorrectCount) > 0
      ? Math.round((correctCount / (correctCount + incorrectCount)) * 100)
      : 0;

    const result: QuizResult = {
      id: `quiz_${Date.now()}`,
      userId: 'current',
      title: selectedSubject === 'all' ? 'UPSSSC PET Full Mock Test' : `${selectedSubject} Subject Test`,
      subject: selectedSubject,
      totalQuestions: testQuestions.length,
      attemptedCount: correctCount + incorrectCount,
      correctCount,
      incorrectCount,
      skippedCount,
      score: Math.max(0, parseFloat(calculatedScore.toFixed(2))),
      maxScore,
      accuracy,
      positiveMarking: positiveMark,
      negativeMarking: negativeMark,
      timeSpentSeconds: elapsedSeconds,
      timestamp: new Date().toISOString(),
      questionsSummary: summaryList
    };

    setQuizResult(result);
    setExamFinished(true);
    setInExam(false);
    onSaveQuizResult(result);

    if (accuracy >= 70) {
      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 }
        });
      } catch {}
    }
  };

  // Format mm:ss
  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // 1. Setup screen
  if (!inExam && !examFinished) {
    return (
      <div className="max-w-3xl mx-auto space-y-6 pb-12 animate-fade-in">
        <div className="bg-gradient-to-r from-slate-900 to-blue-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl">
          <div className="flex items-center gap-2 mb-2">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-500/30 text-blue-300 border border-blue-400/30">
              Exam Simulation Engine
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">UPSSSC PET Timed Mock Test</h1>
          <p className="text-slate-300 text-xs sm:text-sm mt-1 max-w-xl">
            Simulate the actual examination environment with negative marking, question navigation palette, and comprehensive score card analysis.
          </p>
        </div>

        {/* Configuration Box */}
        <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200/90 shadow-sm space-y-6">
          <h2 className="text-base font-bold text-slate-900 border-b pb-3">Test Parameters</h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">Subject Selection</label>
              <select
                value={selectedSubject}
                onChange={(e) => setSelectedSubject(e.target.value)}
                className="w-full text-xs font-medium bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-slate-800 focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">Full Syllabus (All 8 Subjects)</option>
                {subjects.map(s => (
                  <option key={s.id} value={s.name_en}>{s.name_en}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">Question Count</label>
              <div className="grid grid-cols-3 gap-2">
                {[10, 20, Math.min(50, questions.length)].map(cnt => (
                  <button
                    key={cnt}
                    onClick={() => setQuestionCount(cnt)}
                    className={`py-2 rounded-xl text-xs font-semibold border transition ${
                      questionCount === cnt
                        ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                        : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    {cnt} Questions
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">Time Limit (Minutes)</label>
              <div className="grid grid-cols-3 gap-2">
                {[15, 25, 45].map(m => (
                  <button
                    key={m}
                    onClick={() => setDurationMinutes(m)}
                    className={`py-2 rounded-xl text-xs font-semibold border transition ${
                      durationMinutes === m
                        ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                        : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    {m} Mins
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">Marking Scheme</label>
              <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs flex items-center justify-between">
                <div>
                  <span className="font-semibold text-emerald-700">+{positiveMark}</span>
                  <span className="text-slate-500"> for Correct</span>
                </div>
                <div className="h-4 border-r border-slate-300" />
                <div>
                  <span className="font-semibold text-rose-700">-{negativeMark}</span>
                  <span className="text-slate-500"> for Wrong</span>
                </div>
              </div>
            </div>
          </div>

          {/* Test Guidelines */}
          <div className="rounded-xl bg-blue-50/70 p-4 border border-blue-200/80 space-y-2 text-xs text-slate-700">
            <h4 className="font-bold text-blue-900 flex items-center gap-1.5">
              <AlertCircle className="w-4 h-4 text-blue-600" />
              <span>Important Exam Instructions</span>
            </h4>
            <ul className="list-disc pl-5 space-y-1 text-slate-600">
              <li>Each question carries 1.00 mark with 0.25 negative marks for wrong attempts.</li>
              <li>Use the question palette to jump between questions or mark for review.</li>
              <li>Answers are hidden during the test to simulate real exam conditions.</li>
              <li>The test will automatically submit if the timer reaches 00:00.</li>
            </ul>
          </div>

          {startExamError && (
            <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-center gap-2 animate-fade-in">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{startExamError}</span>
            </div>
          )}

          {questions.length === 0 && (
            <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs font-semibold flex items-center gap-2 animate-fade-in">
              <AlertCircle className="w-4 h-4 shrink-0 text-amber-600" />
              <span>Question bank is currently empty. Please import or add questions via the Admin Portal to take a mock test.</span>
            </div>
          )}

          <button
            onClick={handleStartExam}
            disabled={questions.length === 0}
            className={`w-full py-3.5 px-4 rounded-xl font-bold text-sm transition shadow-lg flex items-center justify-center gap-2 ${
              questions.length === 0
                ? 'bg-slate-300 text-slate-500 cursor-not-allowed shadow-none'
                : 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-600/30'
            }`}
          >
            <Play className="w-4 h-4 fill-current" />
            <span>Start Test Now (परीक्षा शुरू करें)</span>
          </button>
        </div>
      </div>
    );
  }

  // 2. Active Exam Mode
  if (inExam && !examFinished) {
    const currentQ = testQuestions[currentIndex];
    const currentAnswer = currentQ ? answers[currentQ.id] : undefined;
    const isReviewed = currentQ ? !!markedForReview[currentQ.id] : false;

    // Palette count summary
    const answeredCount = Object.keys(answers).length;
    const reviewCount = Object.keys(markedForReview).filter(k => markedForReview[k]).length;
    const unvisitedCount = testQuestions.length - Object.keys(visited).length;

    return (
      <div className="space-y-4 pb-12 animate-fade-in max-w-6xl mx-auto">
        {/* Top Exam Header & Floating Timer */}
        <div className="sticky top-14 sm:top-16 z-30 bg-slate-900 text-white rounded-2xl px-3 sm:px-5 py-2.5 sm:py-3 shadow-lg border border-slate-800 flex items-center justify-between gap-2 sm:gap-3">
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            <span className="font-bold text-xs sm:text-sm text-blue-300">PET Mock</span>
            <span className="text-slate-600 hidden xs:inline">|</span>
            <span className="text-[11px] sm:text-xs text-slate-300 font-mono">
              Q {currentIndex + 1}/{testQuestions.length}
            </span>
          </div>

          {/* Palette button for mobile */}
          <button
            onClick={() => setMobilePaletteOpen(true)}
            className="lg:hidden px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-[11px] font-semibold text-slate-200 border border-slate-700 flex items-center gap-1"
          >
            <span>Palette ({answeredCount}/{testQuestions.length})</span>
          </button>

          {/* Timer Display & Submit */}
          <div className="flex items-center gap-2 sm:gap-4 shrink-0">
            <div className={`flex items-center gap-1.5 px-2.5 sm:px-3.5 py-1 rounded-xl font-mono text-xs sm:text-sm font-bold ${
              secondsRemaining < 180 ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40 animate-pulse' : 'bg-slate-800 text-amber-300 border border-slate-700'
            }`}>
              <Timer className="w-3.5 h-3.5" />
              <span>{formatTime(secondsRemaining)}</span>
            </div>

            <button
              onClick={() => {
                if (window.confirm('Are you sure you want to finish and submit your exam?')) {
                  finishExam();
                }
              }}
              className="px-2.5 sm:px-4 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-[11px] sm:text-xs font-bold transition shadow-sm"
            >
              Submit
            </button>
          </div>
        </div>

        {/* Exam Split Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Main Question Arena */}
          <div className="lg:col-span-8 space-y-4">
            <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm p-6 sm:p-8 space-y-6">
              {/* Question metadata */}
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-1 rounded-lg bg-blue-600 text-white text-xs font-bold">
                    Question {currentIndex + 1}
                  </span>
                  <span className="text-xs font-semibold text-slate-600">{currentQ?.subject}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-500">Marks: +{positiveMark} / -{negativeMark}</span>
                </div>
              </div>

              {/* Question Text */}
              <div className="space-y-3">
                {language === 'en' ? (
                  <p className="text-base sm:text-lg font-medium text-slate-900 leading-relaxed font-sans">
                    <span className="text-blue-600 font-bold mr-1">Q.</span>
                    {currentQ?.question_en || currentQ?.question_hi}
                  </p>
                ) : language === 'hi' ? (
                  <p className="text-base sm:text-lg font-medium text-slate-900 leading-relaxed font-sans">
                    <span className="text-blue-600 font-bold mr-1">प्र.</span>
                    {currentQ?.question_hi || currentQ?.question_en}
                  </p>
                ) : (
                  <>
                    <p className="text-base sm:text-lg font-medium text-slate-900 leading-relaxed font-sans">
                      <span className="text-blue-600 font-bold mr-1">Q.</span>
                      {currentQ?.question_en || currentQ?.question_hi}
                    </p>
                    {currentQ?.question_hi && currentQ?.question_hi !== currentQ?.question_en && (
                      <p className="text-sm sm:text-base text-slate-600 leading-relaxed border-t border-slate-100 pt-2 font-sans">
                        <span className="text-slate-400 font-bold mr-1">हिंदी:</span>
                        {currentQ.question_hi}
                      </p>
                    )}
                  </>
                )}
              </div>

              {/* Options */}
              <div className="space-y-3 pt-2">
                {['A', 'B', 'C', 'D'].map((letter, optIdx) => {
                  const optHi = currentQ?.options_hi?.[optIdx] || '';
                  const optEn = currentQ?.options_en?.[optIdx] || '';
                  if (!optHi && !optEn) return null;

                  const isSelected = currentAnswer === optIdx;

                  return (
                    <button
                      key={letter}
                      onClick={() => handleSelectOption(optIdx)}
                      className={`w-full text-left p-4 rounded-xl border transition-all flex items-start gap-3.5 ${
                        isSelected
                          ? 'border-blue-600 bg-blue-50/70 text-blue-900 ring-2 ring-blue-500/20'
                          : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-800'
                      }`}
                    >
                      <span className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs shrink-0 ${
                        isSelected ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-700'
                      }`}>
                        {letter}
                      </span>
                      <div className="flex-1 text-xs sm:text-sm font-medium space-y-1">
                        {language === 'en' ? (
                          <div>{optEn || optHi}</div>
                        ) : language === 'hi' ? (
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
                    </button>
                  );
                })}
              </div>

              {/* Action Buttons */}
              <div className="pt-4 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleToggleReview}
                    className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold border transition ${
                      isReviewed
                        ? 'bg-purple-100 border-purple-300 text-purple-800'
                        : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <Flag className="w-3.5 h-3.5 text-purple-600" />
                    <span>{isReviewed ? 'Unmark Review' : 'Mark for Review'}</span>
                  </button>

                  {currentAnswer !== undefined && (
                    <button
                      onClick={handleClearResponse}
                      className="px-3 py-2 rounded-xl text-xs font-semibold text-rose-600 hover:bg-rose-50 transition"
                    >
                      Clear Response
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => navigateToQuestion(currentIndex - 1)}
                    disabled={currentIndex === 0}
                    className="flex items-center gap-1 px-3.5 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 text-xs font-semibold text-slate-700"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    <span>Previous</span>
                  </button>

                  <button
                    onClick={() => navigateToQuestion(currentIndex + 1)}
                    disabled={currentIndex === testQuestions.length - 1}
                    className="flex items-center gap-1 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white text-xs font-semibold transition"
                  >
                    <span>Save & Next</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Question Palette Sidebar */}
          <div className="lg:col-span-4 space-y-4">
            <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm p-5 space-y-4">
              <h3 className="text-sm font-bold text-slate-900 border-b pb-2">Question Palette</h3>

              {/* Legend */}
              <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-600">
                <div className="flex items-center gap-1.5">
                  <span className="w-3.5 h-3.5 rounded bg-emerald-500 text-white" />
                  <span>Answered ({answeredCount})</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-3.5 h-3.5 rounded bg-purple-500 text-white" />
                  <span>Marked Review ({reviewCount})</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-3.5 h-3.5 rounded bg-slate-200" />
                  <span>Not Answered</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-3.5 h-3.5 rounded border border-slate-300" />
                  <span>Not Visited</span>
                </div>
              </div>

              {/* Grid of question buttons */}
              <div className="grid grid-cols-5 sm:grid-cols-6 gap-2 max-h-72 overflow-y-auto no-scrollbar p-1">
                {testQuestions.map((q, idx) => {
                  const hasAnswer = answers[q.id] !== undefined;
                  const isMarked = markedForReview[q.id];
                  const isCurrent = idx === currentIndex;
                  const isV = visited[q.id];

                  let btnStyle = 'bg-white border-slate-200 text-slate-600';
                  if (hasAnswer && isMarked) {
                    btnStyle = 'bg-purple-600 text-white font-bold ring-2 ring-emerald-400';
                  } else if (hasAnswer) {
                    btnStyle = 'bg-emerald-600 text-white font-bold';
                  } else if (isMarked) {
                    btnStyle = 'bg-purple-600 text-white font-bold';
                  } else if (isV) {
                    btnStyle = 'bg-amber-100 text-amber-900 font-semibold border-amber-300';
                  }

                  if (isCurrent) {
                    btnStyle += ' ring-2 ring-blue-600';
                  }

                  return (
                    <button
                      key={q.id}
                      onClick={() => navigateToQuestion(idx)}
                      className={`h-9 rounded-lg border text-xs font-mono transition flex items-center justify-center ${btnStyle}`}
                    >
                      {idx + 1}
                    </button>
                  );
                })}
              </div>

              <button
                onClick={() => {
                  if (window.confirm('Submit and view detailed result analysis?')) {
                    finishExam();
                  }
                }}
                className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition shadow-sm"
              >
                Submit & End Test
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Palette Drawer Overlay */}
        {mobilePaletteOpen && (
          <div className="fixed inset-0 z-50 lg:hidden flex flex-col justify-end bg-slate-950/75 backdrop-blur-xs animate-fade-in">
            <div className="bg-white rounded-t-3xl max-h-[80vh] flex flex-col p-5 shadow-2xl border-t border-slate-200">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div>
                  <h3 className="font-bold text-sm text-slate-900">Question Navigation Palette</h3>
                  <p className="text-[11px] text-slate-500">Tap question number to jump directly</p>
                </div>
                <button
                  onClick={() => setMobilePaletteOpen(false)}
                  className="p-1.5 rounded-full bg-slate-100 text-slate-500 hover:text-slate-800"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Legend */}
              <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-600 py-2.5 border-b border-slate-100">
                <div className="flex items-center gap-1.5">
                  <span className="w-3.5 h-3.5 rounded bg-emerald-500 text-white" />
                  <span>Answered ({answeredCount})</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-3.5 h-3.5 rounded bg-purple-500 text-white" />
                  <span>Marked Review ({reviewCount})</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-3.5 h-3.5 rounded bg-slate-200" />
                  <span>Not Answered</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-3.5 h-3.5 rounded border border-slate-300" />
                  <span>Not Visited</span>
                </div>
              </div>

              {/* Button Grid */}
              <div className="grid grid-cols-6 gap-2 my-4 overflow-y-auto max-h-56 no-scrollbar p-1">
                {testQuestions.map((q, idx) => {
                  const hasAnswer = answers[q.id] !== undefined;
                  const isMarked = markedForReview[q.id];
                  const isCurrent = idx === currentIndex;
                  const isV = visited[q.id];

                  let btnStyle = 'bg-white border-slate-200 text-slate-600';
                  if (hasAnswer && isMarked) {
                    btnStyle = 'bg-purple-600 text-white font-bold ring-2 ring-emerald-400';
                  } else if (hasAnswer) {
                    btnStyle = 'bg-emerald-600 text-white font-bold';
                  } else if (isMarked) {
                    btnStyle = 'bg-purple-600 text-white font-bold';
                  } else if (isV) {
                    btnStyle = 'bg-amber-100 text-amber-900 font-semibold border-amber-300';
                  }

                  if (isCurrent) {
                    btnStyle += ' ring-2 ring-blue-600';
                  }

                  return (
                    <button
                      key={q.id}
                      onClick={() => {
                        navigateToQuestion(idx);
                        setMobilePaletteOpen(false);
                      }}
                      className={`h-10 rounded-lg border text-xs font-mono transition flex items-center justify-center ${btnStyle}`}
                    >
                      {idx + 1}
                    </button>
                  );
                })}
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  onClick={() => setMobilePaletteOpen(false)}
                  className="flex-1 py-2.5 rounded-xl bg-slate-100 text-slate-800 text-xs font-bold"
                >
                  Close
                </button>
                <button
                  onClick={() => {
                    setMobilePaletteOpen(false);
                    if (window.confirm('Are you sure you want to finish and submit your exam?')) {
                      finishExam();
                    }
                  }}
                  className="flex-1 py-2.5 rounded-xl bg-rose-600 text-white text-xs font-bold"
                >
                  Submit Exam
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // 3. Post-Test Result & Review Screen
  if (examFinished && quizResult) {
    const summary = quizResult.questionsSummary || [];
    const filteredReview = summary.filter(s => {
      if (reviewFilter === 'correct') return s.isCorrect;
      if (reviewFilter === 'incorrect') return s.selectedOption !== null && !s.isCorrect;
      if (reviewFilter === 'skipped') return s.selectedOption === null;
      return true;
    });

    return (
      <div className="max-w-4xl mx-auto space-y-6 pb-12 animate-fade-in">
        {/* Scorecard Hero */}
        <div className="bg-gradient-to-r from-slate-900 via-blue-950 to-indigo-950 rounded-3xl p-6 sm:p-8 text-white shadow-xl border border-blue-900/40">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-blue-300">Test Complete</span>
              <h1 className="text-2xl sm:text-3xl font-extrabold mt-1">Mock Test Performance Analysis</h1>
              <p className="text-xs text-slate-300 mt-1">
                Completed on {new Date(quizResult.timestamp).toLocaleDateString()} in {Math.round(quizResult.timeSpentSeconds / 60)} minutes
              </p>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={handleStartExam}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs transition shadow-lg shadow-blue-600/30"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Retake New Test</span>
              </button>
            </div>
          </div>

          {/* Key Metrics Chips */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-6 border-t border-white/10">
            <div className="bg-white/5 rounded-xl p-3 border border-white/10">
              <span className="text-[11px] text-slate-400 block">Total Score</span>
              <span className="text-2xl font-extrabold text-blue-400">{quizResult.score.toFixed(2)}</span>
              <span className="text-xs text-slate-400"> / {quizResult.maxScore}</span>
            </div>

            <div className="bg-white/5 rounded-xl p-3 border border-white/10">
              <span className="text-[11px] text-slate-400 block">Accuracy Rate</span>
              <span className="text-2xl font-extrabold text-emerald-400">{quizResult.accuracy}%</span>
              <span className="text-xs text-slate-400"> precision</span>
            </div>

            <div className="bg-white/5 rounded-xl p-3 border border-white/10">
              <span className="text-[11px] text-slate-400 block">Correct / Wrong</span>
              <div className="flex items-center gap-1.5 text-lg font-bold">
                <span className="text-emerald-400">{quizResult.correctCount}</span>
                <span className="text-slate-500">/</span>
                <span className="text-rose-400">{quizResult.incorrectCount}</span>
              </div>
            </div>

            <div className="bg-white/5 rounded-xl p-3 border border-white/10">
              <span className="text-[11px] text-slate-400 block">Time Spent</span>
              <span className="text-2xl font-extrabold text-amber-300">
                {formatTime(quizResult.timeSpentSeconds)}
              </span>
            </div>
          </div>
        </div>

        {/* Question Review Section */}
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm p-6 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b pb-4">
            <div>
              <h2 className="text-base font-bold text-slate-900">Detailed Solution & Answer Key</h2>
              <p className="text-xs text-slate-500">Review correct answers, explanations, and your submissions</p>
            </div>

            {/* Filter buttons */}
            <div className="flex flex-wrap gap-1 bg-slate-100 p-1 rounded-xl text-xs font-semibold">
              {[
                { id: 'all', label: `All (${summary.length})` },
                { id: 'correct', label: `Correct (${quizResult.correctCount})` },
                { id: 'incorrect', label: `Wrong (${quizResult.incorrectCount})` },
                { id: 'skipped', label: `Skipped (${quizResult.skippedCount})` }
              ].map(f => (
                <button
                  key={f.id}
                  onClick={() => setReviewFilter(f.id as any)}
                  className={`px-3 py-1.5 rounded-lg transition ${
                    reviewFilter === f.id ? 'bg-white text-blue-600 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          {/* List of reviewed questions */}
          <div className="space-y-6">
            {filteredReview.map((item, idx) => {
              const q = testQuestions.find(tq => tq.id === item.questionId);
              if (!q) return null;

              return (
                <div
                  key={item.questionId}
                  className={`p-5 rounded-2xl border transition ${
                    item.isCorrect
                      ? 'border-emerald-200 bg-emerald-50/20'
                      : item.selectedOption === null
                      ? 'border-slate-200 bg-slate-50/50'
                      : 'border-rose-200 bg-rose-50/20'
                  }`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <span className="w-6 h-6 rounded-md bg-slate-800 text-white text-xs font-bold flex items-center justify-center">
                        {idx + 1}
                      </span>
                      <span className="text-xs font-semibold text-slate-600">{q.subject}</span>
                    </div>

                    <div>
                      {item.isCorrect ? (
                        <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Correct (+{positiveMark})
                        </span>
                      ) : item.selectedOption === null ? (
                        <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-slate-100 text-slate-700">
                          Unattempted (0.0)
                        </span>
                      ) : (
                        <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-rose-100 text-rose-800 flex items-center gap-1">
                          <XCircle className="w-3.5 h-3.5" /> Incorrect (-{negativeMark})
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Question text based on language */}
                  {language === 'en' ? (
                    <p className="text-sm sm:text-base font-medium text-slate-900 mb-3">
                      <span className="text-blue-600 font-bold mr-1">Q.</span>
                      {q.question_en || q.question_hi}
                    </p>
                  ) : language === 'hi' ? (
                    <p className="text-sm sm:text-base font-medium text-slate-900 mb-3">
                      <span className="text-blue-600 font-bold mr-1">प्र.</span>
                      {q.question_hi || q.question_en}
                    </p>
                  ) : (
                    <div className="mb-3 space-y-1">
                      <p className="text-sm sm:text-base font-medium text-slate-900">
                        <span className="text-blue-600 font-bold mr-1">Q.</span>
                        {q.question_en || q.question_hi}
                      </p>
                      {q.question_hi && q.question_hi !== q.question_en && (
                        <p className="text-xs sm:text-sm text-slate-600 font-sans">
                          <span className="text-slate-400 font-bold mr-1">हिंदी:</span>
                          {q.question_hi}
                        </p>
                      )}
                    </div>
                  )}

                  {/* Options status */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                    {['A', 'B', 'C', 'D'].map((letter, optIdx) => {
                      const optText = language === 'hi'
                        ? (q.options_hi?.[optIdx] || q.options_en?.[optIdx] || '')
                        : (q.options_en?.[optIdx] || q.options_hi?.[optIdx] || '');
                      const isCorrect = optIdx === q.correct_option;
                      const isChosen = item.selectedOption === optIdx;

                      let style = 'bg-white border-slate-200 text-slate-700';
                      if (isCorrect) {
                        style = 'bg-emerald-50 border-emerald-400 text-emerald-900 font-semibold';
                      } else if (isChosen && !isCorrect) {
                        style = 'bg-rose-50 border-rose-400 text-rose-900 font-semibold';
                      }

                      return (
                        <div key={letter} className={`p-2.5 rounded-xl border flex items-center justify-between ${style}`}>
                          <div className="flex items-center gap-2">
                            <span className="font-bold">{letter}.</span>
                            <span>{optText}</span>
                          </div>
                          {isCorrect && <Check className="w-4 h-4 text-emerald-600" />}
                          {isChosen && !isCorrect && <XCircle className="w-4 h-4 text-rose-600" />}
                        </div>
                      );
                    })}
                  </div>

                  {/* Explanation */}
                  <div className="mt-4 pt-3 border-t border-slate-200/80 text-xs text-slate-700 space-y-1">
                    <span className="font-bold text-blue-900 flex items-center gap-1">
                      <BookOpen className="w-3.5 h-3.5 text-blue-600" />
                      Detailed Explanation:
                    </span>
                    <p>
                      {language === 'hi'
                        ? (q.explanation_hi || q.explanation_en)
                        : (q.explanation_en || q.explanation_hi)}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  return null;
};

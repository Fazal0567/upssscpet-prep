import React, { useState } from 'react';
import { RotateCcw, CheckCircle2, XCircle, ArrowRight, BookOpen, AlertCircle, Sparkles } from 'lucide-react';
import { Question, UserAttempt } from '../types';
import { useAuth } from '../context/AuthContext';

interface RevisionProps {
  questions: Question[];
  userAttempts: UserAttempt[];
  onRecordAttempt: (qId: string, selected: number, isCorrect: boolean, timeSpent: number) => void;
}

export const Revision: React.FC<RevisionProps> = ({
  questions,
  userAttempts,
  onRecordAttempt
}) => {
  const { language } = useAuth();
  // Find all questions where the most recent attempt was incorrect
  const latestAttemptMap: Record<string, UserAttempt> = {};
  userAttempts.forEach(a => {
    if (!latestAttemptMap[a.questionId] || new Date(a.timestamp) > new Date(latestAttemptMap[a.questionId].timestamp)) {
      latestAttemptMap[a.questionId] = a;
    }
  });

  const incorrectQuestionIds = Object.keys(latestAttemptMap).filter(qId => !latestAttemptMap[qId].isCorrect);
  const incorrectQuestions = questions.filter(q => incorrectQuestionIds.includes(q.id));

  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [submitted, setSubmitted] = useState(false);

  const currentQ = incorrectQuestions[currentIndex] || null;

  const handleSelectOption = (idx: number) => {
    if (submitted) return;
    setSelectedOption(idx);
  };

  const handleSubmit = () => {
    if (!currentQ || selectedOption === null || submitted) return;
    const isCorrect = selectedOption === currentQ.correct_option;
    setSubmitted(true);
    onRecordAttempt(currentQ.id, selectedOption, isCorrect, 10);
  };

  const handleNext = () => {
    setSelectedOption(null);
    setSubmitted(false);
    if (currentIndex < incorrectQuestions.length - 1) {
      setCurrentIndex(prev => prev + 1);
    } else {
      setCurrentIndex(0);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-12 animate-fade-in">
      <div className="bg-gradient-to-r from-rose-900 via-slate-900 to-indigo-950 rounded-3xl p-6 sm:p-8 text-white shadow-xl">
        <div className="flex items-center gap-2 mb-2">
          <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-500/30 text-rose-300 border border-rose-500/30">
            Error Remediation Deck
          </span>
        </div>
        <h1 className="text-2xl font-bold tracking-tight">Review Incorrect Questions</h1>
        <p className="text-slate-300 text-xs sm:text-sm mt-1 max-w-lg">
          Zero in on past mistakes. Re-attempting incorrect questions is the proven fastest way to boost your UPSSSC PET percentile.
        </p>
      </div>

      {incorrectQuestions.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 text-center border border-slate-200 space-y-3">
          <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto" />
          <h3 className="text-base font-bold text-slate-800">No Pending Mistakes!</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            You currently have no uncorrected questions. Continue practicing in MCQ Practice or take a fresh Mock Test.
          </p>
        </div>
      ) : currentQ ? (
        <div className="bg-white rounded-3xl border border-slate-200/90 shadow-md p-6 sm:p-8 space-y-6">
          <div className="flex items-center justify-between pb-3 border-b">
            <span className="text-xs font-bold font-mono px-2.5 py-1 rounded-lg bg-rose-100 text-rose-800">
              Mistake {currentIndex + 1} of {incorrectQuestions.length}
            </span>
            <span className="text-xs font-semibold text-slate-600">{currentQ.subject}</span>
          </div>

          <div className="space-y-3">
            {language === 'en' ? (
              <h3 className="text-base sm:text-lg font-medium text-slate-900 leading-relaxed font-sans">
                <span className="text-blue-600 font-bold mr-1">Q.</span>
                {currentQ.question_en || currentQ.question_hi}
              </h3>
            ) : language === 'hi' ? (
              <h3 className="text-base sm:text-lg font-medium text-slate-900 leading-relaxed font-sans">
                <span className="text-blue-600 font-bold mr-1">प्र.</span>
                {currentQ.question_hi || currentQ.question_en}
              </h3>
            ) : (
              <>
                <h3 className="text-base sm:text-lg font-medium text-slate-900 leading-relaxed font-sans">
                  <span className="text-blue-600 font-bold mr-1">Q.</span>
                  {currentQ.question_en || currentQ.question_hi}
                </h3>
                {currentQ.question_hi && currentQ.question_hi !== currentQ.question_en && (
                  <p className="text-xs sm:text-sm text-slate-600 font-sans border-t border-slate-100 pt-2">
                    <span className="text-slate-400 font-bold mr-1">हिंदी:</span>
                    {currentQ.question_hi}
                  </p>
                )}
              </>
            )}
          </div>

          {/* Options */}
          <div className="space-y-2.5 pt-2">
            {['A', 'B', 'C', 'D'].map((letter, optIdx) => {
              const optText = language === 'hi'
                ? (currentQ.options_hi?.[optIdx] || currentQ.options_en?.[optIdx])
                : (currentQ.options_en?.[optIdx] || currentQ.options_hi?.[optIdx]);
              if (!optText) return null;

              const isChosen = selectedOption === optIdx;
              const isCorrect = optIdx === currentQ.correct_option;

              let style = 'bg-white border-slate-200 text-slate-800 hover:bg-slate-50';
              if (isChosen && !submitted) {
                style = 'bg-blue-50 border-blue-600 text-blue-900 ring-2 ring-blue-500/20';
              }
              if (submitted) {
                if (isCorrect) {
                  style = 'bg-emerald-50 border-emerald-500 text-emerald-900 font-semibold';
                } else if (isChosen && !isCorrect) {
                  style = 'bg-rose-50 border-rose-500 text-rose-900';
                }
              }

              return (
                <button
                  key={letter}
                  onClick={() => handleSelectOption(optIdx)}
                  disabled={submitted}
                  className={`w-full text-left p-3.5 rounded-xl border transition flex items-center justify-between text-xs sm:text-sm ${style}`}
                >
                  <div className="flex items-center gap-2.5">
                    <span className="font-bold">{letter}.</span>
                    <span>{optText}</span>
                  </div>
                  {submitted && isCorrect && <CheckCircle2 className="w-4 h-4 text-emerald-600" />}
                  {submitted && isChosen && !isCorrect && <XCircle className="w-4 h-4 text-rose-600" />}
                </button>
              );
            })}
          </div>

          {!submitted ? (
            <div className="pt-2 flex justify-end">
              <button
                onClick={handleSubmit}
                disabled={selectedOption === null}
                className="px-6 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 disabled:opacity-40 text-white font-semibold text-xs transition"
              >
                Re-Submit Answer
              </button>
            </div>
          ) : (
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-2 animate-fade-in">
              <div className="font-bold flex items-center gap-1.5 text-blue-900">
                <BookOpen className="w-4 h-4 text-blue-600" />
                <span>
                  {language === 'en' ? 'Detailed Explanation:' : language === 'hi' ? 'विस्तृत व्याख्या:' : 'Explanation / व्याख्या:'}
                </span>
              </div>
              <p className="text-slate-700 leading-relaxed">
                {language === 'hi'
                  ? (currentQ.explanation_hi || currentQ.explanation_en)
                  : (currentQ.explanation_en || currentQ.explanation_hi)}
              </p>
              <div className="pt-3 flex justify-end">
                <button
                  onClick={handleNext}
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs transition flex items-center gap-1"
                >
                  <span>Next Question</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
};

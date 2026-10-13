import React, { useState, useMemo } from 'react';
import {
  Layers,
  RotateCw,
  Shuffle,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  BookOpen,
  CheckCircle2,
  AlertTriangle,
  Flame,
  Check,
  Filter
} from 'lucide-react';
import { Question, SubjectItem } from '../types';
import { useAuth } from '../context/AuthContext';

interface FlashcardsProps {
  questions: Question[];
  subjects: SubjectItem[];
  ratings: Record<string, 'easy' | 'medium' | 'hard'>;
  onSaveRating: (questionId: string, rating: 'easy' | 'medium' | 'hard') => void;
}

export const Flashcards: React.FC<FlashcardsProps> = ({
  questions,
  subjects,
  ratings,
  onSaveRating
}) => {
  const { language } = useAuth();

  // Filters
  const [selectedSubject, setSelectedSubject] = useState<string>('all');
  const [deckMode, setDeckMode] = useState<'all' | 'revision'>('all'); // revision = only Hard/Medium
  const [isFlipped, setIsFlipped] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);

  // Filtered pool
  const activeDeck = useMemo(() => {
    let pool = questions.filter(q => {
      if (selectedSubject !== 'all' && q.subject.toLowerCase() !== selectedSubject.toLowerCase()) {
        return false;
      }
      if (deckMode === 'revision') {
        const rating = ratings[q.id];
        return rating === 'hard' || rating === 'medium';
      }
      return true;
    });
    return pool;
  }, [questions, selectedSubject, deckMode, ratings]);

  const currentCard = activeDeck[currentIndex] || null;
  const currentRating = currentCard ? ratings[currentCard.id] : undefined;

  const handleNext = () => {
    setIsFlipped(false);
    if (currentIndex < activeDeck.length - 1) {
      setCurrentIndex(prev => prev + 1);
    } else {
      setCurrentIndex(0); // loop back
    }
  };

  const handlePrev = () => {
    setIsFlipped(false);
    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1);
    } else {
      setCurrentIndex(activeDeck.length - 1);
    }
  };

  const handleShuffle = () => {
    setIsFlipped(false);
    const randomIndex = Math.floor(Math.random() * activeDeck.length);
    setCurrentIndex(randomIndex);
  };

  const handleRate = (rating: 'easy' | 'medium' | 'hard') => {
    if (!currentCard) return;
    onSaveRating(currentCard.id, rating);
    // Auto advance
    setTimeout(() => {
      handleNext();
    }, 250);
  };

  // Keyboard shortcut listener
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        e.preventDefault();
        setIsFlipped(prev => !prev);
      } else if (e.code === 'ArrowRight') {
        handleNext();
      } else if (e.code === 'ArrowLeft') {
        handlePrev();
      } else if (e.key === '1') {
        handleRate('hard');
      } else if (e.key === '2') {
        handleRate('medium');
      } else if (e.key === '3') {
        handleRate('easy');
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentIndex, activeDeck, currentCard]);

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-12 animate-fade-in">
      {/* Header and Deck Mode Selector */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200/90 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <Layers className="w-5 h-5 text-blue-600" />
            <h1 className="text-base sm:text-lg font-bold text-slate-900">Spaced Repetition Flashcards</h1>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">Quick active recall memory deck for key facts and answers</p>
        </div>

        <div className="flex items-center gap-2">
          {/* Deck mode switcher */}
          <div className="flex bg-slate-100 p-0.5 rounded-xl text-xs font-semibold">
            <button
              onClick={() => { setDeckMode('all'); setCurrentIndex(0); setIsFlipped(false); }}
              className={`px-3 py-1.5 rounded-lg transition ${
                deckMode === 'all' ? 'bg-white text-blue-600 shadow-xs' : 'text-slate-600'
              }`}
            >
              All Cards ({questions.length})
            </button>
            <button
              onClick={() => { setDeckMode('revision'); setCurrentIndex(0); setIsFlipped(false); }}
              className={`px-3 py-1.5 rounded-lg transition flex items-center gap-1 ${
                deckMode === 'revision' ? 'bg-amber-500 text-slate-950 font-bold shadow-xs' : 'text-slate-600'
              }`}
            >
              <Flame className="w-3.5 h-3.5 text-amber-500" />
              <span>Revision Deck</span>
            </button>
          </div>

          <button
            onClick={handleShuffle}
            className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium transition"
            title="Shuffle Deck"
          >
            <Shuffle className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Subject Filter Bar */}
      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1 text-xs">
        <button
          onClick={() => { setSelectedSubject('all'); setCurrentIndex(0); setIsFlipped(false); }}
          className={`px-3 py-1.5 rounded-xl font-semibold shrink-0 transition ${
            selectedSubject === 'all' ? 'bg-slate-900 text-white' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
          }`}
        >
          All Subjects
        </button>
        {subjects.map(s => (
          <button
            key={s.id}
            onClick={() => { setSelectedSubject(s.name_en); setCurrentIndex(0); setIsFlipped(false); }}
            className={`px-3 py-1.5 rounded-xl font-semibold shrink-0 transition ${
              selectedSubject.toLowerCase() === s.name_en.toLowerCase()
                ? 'bg-blue-600 text-white shadow-sm'
                : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            {s.name_en}
          </button>
        ))}
      </div>

      {/* Flashcard Area */}
      {activeDeck.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 text-center border border-slate-200 space-y-3">
          <Layers className="w-12 h-12 text-slate-300 mx-auto" />
          <h3 className="text-base font-bold text-slate-800">
            {deckMode === 'revision' ? 'Revision Deck is Empty!' : 'No Cards for this filter'}
          </h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            {deckMode === 'revision'
              ? 'Great job! Cards you mark as "Hard" or "Medium" during regular study will automatically appear here for focused revision.'
              : 'Try selecting a different subject or reset your filters.'}
          </p>
          {deckMode === 'revision' && (
            <button
              onClick={() => setDeckMode('all')}
              className="px-4 py-2 rounded-xl bg-blue-600 text-white text-xs font-semibold"
            >
              Study All Flashcards
            </button>
          )}
        </div>
      ) : currentCard ? (
        <div className="space-y-4">
          {/* Progress Indicator */}
          <div className="flex items-center justify-between text-xs text-slate-500 font-mono">
            <span>Card {currentIndex + 1} of {activeDeck.length}</span>
            <span>
              Rating: {currentRating ? (
                <span className={`font-bold capitalize ${
                  currentRating === 'easy' ? 'text-emerald-600' : currentRating === 'hard' ? 'text-rose-600' : 'text-amber-600'
                }`}>
                  {currentRating}
                </span>
              ) : 'Not rated yet'}
            </span>
          </div>

          {/* Interactive Flip Card */}
          <div
            onClick={() => setIsFlipped(!isFlipped)}
            className="w-full min-h-[360px] cursor-pointer group rounded-3xl p-6 sm:p-8 border-2 transition-all duration-300 shadow-md relative flex flex-col justify-between select-none"
            style={{
              backgroundColor: isFlipped ? '#f0fdf4' : '#ffffff',
              borderColor: isFlipped ? '#86efac' : '#e2e8f0'
            }}
          >
            {/* Top Bar of card */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-1 rounded-lg bg-blue-100 text-blue-700 text-xs font-bold">
                  {currentCard.subject}
                </span>
                <span className="text-xs text-slate-500">{currentCard.topic}</span>
              </div>

              <div className="flex items-center gap-1.5 text-xs text-slate-400 group-hover:text-blue-600 transition">
                <RotateCw className="w-3.5 h-3.5" />
                <span>{isFlipped ? 'Show Question' : 'Click to Flip'}</span>
              </div>
            </div>

            {/* Body */}
            <div className="py-6 my-auto text-center space-y-4">
              {!isFlipped ? (
                /* Front Side: Question */
                <div className="space-y-3">
                  <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                    {language === 'en' ? 'Question' : language === 'hi' ? 'प्रश्न' : 'Question (प्रश्न)'}
                  </div>
                  {language === 'en' ? (
                    <h3 className="text-lg sm:text-xl font-bold text-slate-900 leading-snug font-sans">
                      {currentCard.question_en || currentCard.question_hi}
                    </h3>
                  ) : language === 'hi' ? (
                    <h3 className="text-lg sm:text-xl font-bold text-slate-900 leading-snug font-sans">
                      {currentCard.question_hi || currentCard.question_en}
                    </h3>
                  ) : (
                    <>
                      <h3 className="text-lg sm:text-xl font-bold text-slate-900 leading-snug font-sans">
                        {currentCard.question_en || currentCard.question_hi}
                      </h3>
                      {currentCard.question_hi && currentCard.question_hi !== currentCard.question_en && (
                        <p className="text-xs sm:text-sm text-slate-600 font-sans pt-1">
                          {currentCard.question_hi}
                        </p>
                      )}
                    </>
                  )}
                </div>
              ) : (
                /* Back Side: Correct Answer & Explanation */
                <div className="space-y-4 animate-fade-in">
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>
                      {language === 'en' ? 'Correct Answer' : language === 'hi' ? 'सही उत्तर' : 'Correct Answer / उत्तर'}
                    </span>
                  </div>

                  <h3 className="text-xl sm:text-2xl font-extrabold text-emerald-950">
                    {language === 'hi'
                      ? (currentCard.options_hi?.[currentCard.correct_option] || currentCard.options_en?.[currentCard.correct_option] || currentCard.answer_hi || currentCard.answer_en)
                      : (currentCard.options_en?.[currentCard.correct_option] || currentCard.options_hi?.[currentCard.correct_option] || currentCard.answer_en || currentCard.answer_hi)}
                  </h3>

                  <div className="max-w-lg mx-auto text-xs sm:text-sm text-slate-700 bg-white/80 p-4 rounded-2xl border border-emerald-200 text-left space-y-2">
                    <span className="font-bold text-slate-900 block">
                      {language === 'en' ? 'Detailed Explanation:' : language === 'hi' ? 'विस्तृत व्याख्या:' : 'Explanation / व्याख्या:'}
                    </span>
                    <p>
                      {language === 'hi'
                        ? (currentCard.explanation_hi || currentCard.explanation_en)
                        : (currentCard.explanation_en || currentCard.explanation_hi)}
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Bottom prompt */}
            <div className="text-center text-[11px] text-slate-400">
              <span>Press <kbd className="px-1.5 py-0.5 rounded bg-slate-100 border text-slate-600 font-mono">Space</kbd> to flip</span>
            </div>
          </div>

          {/* Rating Buttons: Easy, Medium, Hard */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="text-xs font-semibold text-slate-700">Rate Your Recall:</div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <button
                onClick={() => handleRate('hard')}
                className={`flex-1 sm:flex-none px-4 py-2 rounded-xl text-xs font-bold border transition flex items-center justify-center gap-1.5 ${
                  currentRating === 'hard'
                    ? 'bg-rose-600 text-white border-rose-600 shadow-sm'
                    : 'bg-rose-50 border-rose-200 text-rose-700 hover:bg-rose-100'
                }`}
                title="Press 1"
              >
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>Hard (1)</span>
              </button>

              <button
                onClick={() => handleRate('medium')}
                className={`flex-1 sm:flex-none px-4 py-2 rounded-xl text-xs font-bold border transition flex items-center justify-center gap-1.5 ${
                  currentRating === 'medium'
                    ? 'bg-amber-500 text-slate-950 border-amber-500 shadow-sm'
                    : 'bg-amber-50 border-amber-200 text-amber-700 hover:bg-amber-100'
                }`}
                title="Press 2"
              >
                <span>Medium (2)</span>
              </button>

              <button
                onClick={() => handleRate('easy')}
                className={`flex-1 sm:flex-none px-4 py-2 rounded-xl text-xs font-bold border transition flex items-center justify-center gap-1.5 ${
                  currentRating === 'easy'
                    ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                    : 'bg-emerald-50 border-emerald-200 text-emerald-700 hover:bg-emerald-100'
                }`}
                title="Press 3"
              >
                <Check className="w-3.5 h-3.5" />
                <span>Easy (3)</span>
              </button>
            </div>

            {/* Navigation buttons */}
            <div className="flex items-center gap-2">
              <button
                onClick={handlePrev}
                className="p-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 transition"
                title="Previous Card"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={handleNext}
                className="p-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 transition"
                title="Next Card"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
};

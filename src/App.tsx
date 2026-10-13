import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { AuthModal } from './components/AuthModal';
import { LandingPage } from './pages/LandingPage';
import { Dashboard } from './pages/Dashboard';
import { MCQPractice } from './pages/MCQPractice';
import { MockTest } from './pages/MockTest';
import { Flashcards } from './pages/Flashcards';
import { Bookmarks } from './pages/Bookmarks';
import { Revision } from './pages/Revision';
import { Analytics } from './pages/Analytics';
import { AdminDashboard } from './pages/AdminDashboard';
import {
  fetchAllQuestions,
  fetchSubjects,
  fetchUserAttempts,
  saveUserAttempt,
  fetchUserQuizzes,
  saveQuizResult,
  fetchUserBookmarks,
  toggleUserBookmark,
  fetchUserFlashcardRatings,
  saveFlashcardRating,
  saveQuestion,
  deleteQuestion,
  batchImportQuestions,
  fetchImportHistory,
  deleteAllQuestions,
  clearAllDummyData,
  seedDemoQuestions
} from './firebase/service';
import { Question, SubjectItem, UserAttempt, QuizResult, ImportHistoryItem } from './types';
import { SEED_QUESTIONS, DEMO_SAMPLE_QUESTIONS, INITIAL_SUBJECTS } from './data/seedQuestions';

function MainApp() {
  const { user } = useAuth();

  // Navigation State
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState<'login' | 'register' | 'forgot' | 'admin'>('login');
  const [navMeta, setNavMeta] = useState<any>(null);

  const handleOpenAuth = (mode: 'login' | 'register' | 'forgot' | 'admin' = 'login') => {
    setAuthModalMode(mode);
    setAuthModalOpen(true);
  };

  // Data State
  const [questions, setQuestions] = useState<Question[]>(SEED_QUESTIONS);
  const [subjects, setSubjects] = useState<SubjectItem[]>(INITIAL_SUBJECTS);
  const [userAttempts, setUserAttempts] = useState<UserAttempt[]>([]);
  const [quizResults, setQuizResults] = useState<QuizResult[]>([]);
  const [bookmarks, setBookmarks] = useState<string[]>([]);
  const [flashcardRatings, setFlashcardRatings] = useState<Record<string, 'easy' | 'medium' | 'hard'>>({});
  const [importHistory, setImportHistory] = useState<ImportHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Load questions & subjects on mount
  useEffect(() => {
    async function loadInitialData() {
      try {
        const [loadedQuestions, loadedSubjects, loadedHistory] = await Promise.all([
          fetchAllQuestions(),
          fetchSubjects(),
          fetchImportHistory()
        ]);
        setQuestions(loadedQuestions || []);
        if (loadedSubjects && loadedSubjects.length > 0) setSubjects(loadedSubjects);
        if (loadedHistory) setImportHistory(loadedHistory);
      } catch (err) {
        console.warn('Failed loading data from Firestore, falling back to local dataset:', err);
      } finally {
        setLoading(false);
      }
    }
    loadInitialData();
  }, []);

  // Load user data when authenticated or changed
  useEffect(() => {
    if (!user) return;
    const userId = user.uid;
    async function loadUserData() {
      try {
        const [attempts, quizzes, bms, ratings] = await Promise.all([
          fetchUserAttempts(userId),
          fetchUserQuizzes(userId),
          fetchUserBookmarks(userId),
          fetchUserFlashcardRatings(userId)
        ]);
        if (attempts) setUserAttempts(attempts);
        if (quizzes) setQuizResults(quizzes);
        if (bms) setBookmarks(bms);
        if (ratings) setFlashcardRatings(ratings);
      } catch (err) {
        console.warn('Failed fetching user personal progress:', err);
      }
    }
    loadUserData();
  }, [user]);

  // Handle Question Attempt
  const handleRecordAttempt = async (qId: string, selected: number, isCorrect: boolean, timeSpent: number) => {
    const targetQ = questions.find(q => q.id === qId);
    if (!targetQ) return;

    const attempt: UserAttempt = {
      id: `att_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      userId: user?.uid || 'guest',
      questionId: qId,
      selectedOption: selected,
      isCorrect,
      subject: targetQ.subject,
      topic: targetQ.topic,
      difficulty: targetQ.difficulty,
      timeSpentSeconds: timeSpent,
      timestamp: new Date().toISOString()
    };

    // Update local state immediately for responsive UI
    setUserAttempts(prev => [attempt, ...prev]);

    // Persist to Firestore if logged in
    if (user) {
      await saveUserAttempt(user.uid, attempt);
    }
  };

  // Handle Quiz Result Save
  const handleSaveQuizResult = async (result: QuizResult) => {
    setQuizResults(prev => [result, ...prev]);

    // Also populate attempts for question breakdown
    if (result.questionsSummary) {
      const newAttempts: UserAttempt[] = result.questionsSummary.map(s => {
        const q = questions.find(tq => tq.id === s.questionId);
        return {
          id: `att_${Date.now()}_${s.questionId}`,
          userId: user?.uid || 'guest',
          questionId: s.questionId,
          selectedOption: s.selectedOption !== null ? s.selectedOption : -1,
          isCorrect: s.isCorrect,
          subject: q?.subject || 'Mock Test',
          topic: q?.topic || 'General Practice',
          difficulty: q?.difficulty || 'medium',
          timeSpentSeconds: s.timeSpentSeconds,
          timestamp: new Date().toISOString()
        };
      });
      setUserAttempts(prev => [...newAttempts, ...prev]);
    }

    if (user) {
      await saveQuizResult(user.uid, {
        ...result,
        userId: user.uid
      });
    }
  };

  // Bookmark toggle
  const handleToggleBookmark = async (qId: string) => {
    const isCurrently = bookmarks.includes(qId);
    setBookmarks(prev => isCurrently ? prev.filter(id => id !== qId) : [...prev, qId]);
    if (user) {
      await toggleUserBookmark(user.uid, qId, isCurrently);
    }
  };

  // Flashcard review rating
  const handleSaveFlashcardRating = async (qId: string, rating: 'easy' | 'medium' | 'hard') => {
    setFlashcardRatings(prev => ({ ...prev, [qId]: rating }));
    if (user) {
      await saveFlashcardRating(user.uid, qId, rating);
    }
  };

  // Admin Question CRUD
  const handleSaveQuestion = async (q: Question) => {
    await saveQuestion(q);
    setQuestions(prev => {
      const idx = prev.findIndex(item => item.id === q.id);
      if (idx !== -1) {
        const copy = [...prev];
        copy[idx] = q;
        return copy;
      }
      return [q, ...prev];
    });
  };

  const handleDeleteQuestion = async (qId: string) => {
    await deleteQuestion(qId);
    setQuestions(prev => prev.filter(q => q.id !== qId));
  };

  const handleBatchImport = async (
    validQuestions: Question[],
    fName: string,
    onProgress: (p: number, t: number) => void
  ) => {
    await batchImportQuestions(validQuestions, fName, user?.uid || 'admin', onProgress);
    const updatedQuestions = await fetchAllQuestions();
    setQuestions(updatedQuestions);
    const updatedHistory = await fetchImportHistory();
    setImportHistory(updatedHistory);
  };

  const handleRefreshData = async () => {
    const [qList, sList, hList] = await Promise.all([
      fetchAllQuestions(),
      fetchSubjects(),
      fetchImportHistory()
    ]);
    setQuestions(qList);
    setSubjects(sList);
    setImportHistory(hList);
  };

  const handleDeleteAllQuestions = async () => {
    await deleteAllQuestions();
    setQuestions([]);
  };

  const handleClearAllDummyData = async () => {
    await clearAllDummyData();
    setQuestions([]);
    setImportHistory([]);
  };

  const handleSeedDemoQuestions = async () => {
    await seedDemoQuestions();
    const updated = await fetchAllQuestions();
    setQuestions(updated);
  };

  const handleNavigate = (tab: string, meta?: any) => {
    setActiveTab(tab);
    setNavMeta(meta);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      <Navbar
        activeTab={activeTab}
        setActiveTab={handleNavigate}
        openAuthModal={handleOpenAuth}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto px-3 sm:px-6 lg:px-8 pt-4 sm:pt-8 pb-24 lg:pb-12">
        {activeTab === 'landing' && (
          <LandingPage
            subjects={subjects}
            onStart={handleNavigate}
            openAuthModal={() => setAuthModalOpen(true)}
          />
        )}

        {activeTab === 'dashboard' && (
          <Dashboard
            questions={questions}
            subjects={subjects}
            userAttempts={userAttempts}
            quizResults={quizResults}
            bookmarks={bookmarks}
            onNavigate={handleNavigate}
            openAuthModal={() => setAuthModalOpen(true)}
          />
        )}

        {activeTab === 'practice' && (
          <MCQPractice
            questions={questions}
            subjects={subjects}
            bookmarks={bookmarks}
            onToggleBookmark={handleToggleBookmark}
            onRecordAttempt={handleRecordAttempt}
            initialSubject={navMeta?.subject}
          />
        )}

        {activeTab === 'mocktest' && (
          <MockTest
            questions={questions}
            subjects={subjects}
            onSaveQuizResult={handleSaveQuizResult}
          />
        )}

        {activeTab === 'flashcards' && (
          <Flashcards
            questions={questions}
            subjects={subjects}
            ratings={flashcardRatings}
            onSaveRating={handleSaveFlashcardRating}
          />
        )}

        {activeTab === 'bookmarks' && (
          <Bookmarks
            questions={questions}
            bookmarkIds={bookmarks}
            onToggleBookmark={handleToggleBookmark}
            onPracticeQuestion={(q) => handleNavigate('practice', { subject: q.subject })}
          />
        )}

        {activeTab === 'revision' && (
          <Revision
            questions={questions}
            userAttempts={userAttempts}
            onRecordAttempt={handleRecordAttempt}
          />
        )}

        {activeTab === 'analytics' && (
          <Analytics
            questions={questions}
            subjects={subjects}
            userAttempts={userAttempts}
            quizResults={quizResults}
          />
        )}

        {activeTab === 'admin' && (
          <AdminDashboard
            questions={questions}
            subjects={subjects}
            importHistory={importHistory}
            onSaveQuestion={handleSaveQuestion}
            onDeleteQuestion={handleDeleteQuestion}
            onDeleteAllQuestions={handleDeleteAllQuestions}
            onClearAllDummyData={handleClearAllDummyData}
            onSeedDemoQuestions={handleSeedDemoQuestions}
            onBatchImport={handleBatchImport}
            onRefreshData={handleRefreshData}
          />
        )}
      </main>

      <Footer setActiveTab={handleNavigate} />

      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        initialMode={authModalMode}
      />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <MainApp />
    </AuthProvider>
  );
}

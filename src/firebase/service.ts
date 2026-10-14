import {
  collection,
  doc,
  getDocs,
  getDoc,
  setDoc,
  deleteDoc,
  writeBatch,
  query,
  orderBy,
  limit
} from 'firebase/firestore';
import { db } from './config';
import { handleFirestoreError, OperationType } from './error';
import { Question, SubjectItem, UserAttempt, QuizResult, BookmarkItem, FlashcardRatingItem, ImportHistoryItem } from '../types';
import { SEED_QUESTIONS, DEMO_SAMPLE_QUESTIONS, INITIAL_SUBJECTS } from '../data/seedQuestions';

const ADMIN_EMAILS = ['mohdfazalali1@gmail.com', 'fazalalicontribute@gmail.com'];

export async function checkIsAdmin(userId: string, email?: string | null): Promise<boolean> {
  if (email && ADMIN_EMAILS.includes(email.toLowerCase())) {
    return true;
  }
  if (!userId) return false;
  try {
    const adminDoc = await getDoc(doc(db, 'admins', userId));
    return adminDoc.exists();
  } catch {
    return false;
  }
}

const LOCAL_QUESTIONS_KEY = 'pet_local_imported_questions';
const LOCAL_HISTORY_KEY = 'pet_local_import_history';

function getStoredLocalQuestions(): Question[] {
  try {
    const raw = localStorage.getItem(LOCAL_QUESTIONS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function setStoredLocalQuestions(questions: Question[]): void {
  try {
    localStorage.setItem(LOCAL_QUESTIONS_KEY, JSON.stringify(questions));
  } catch (e) {
    console.warn('Failed to store questions in localStorage:', e);
  }
}

function getStoredLocalHistory(): ImportHistoryItem[] {
  try {
    const raw = localStorage.getItem(LOCAL_HISTORY_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function appendStoredLocalHistory(item: ImportHistoryItem): void {
  try {
    const list = getStoredLocalHistory();
    list.unshift(item);
    localStorage.setItem(LOCAL_HISTORY_KEY, JSON.stringify(list.slice(0, 50)));
  } catch {}
}

export async function fetchAllQuestions(): Promise<Question[]> {
  const localQuestions = getStoredLocalQuestions();
  try {
    const snap = await getDocs(collection(db, 'questions'));
    if (!snap.empty) {
      const cloudQuestions: Question[] = [];
      snap.forEach(docSnap => {
        cloudQuestions.push(docSnap.data() as Question);
      });
      const map = new Map<string, Question>();
      cloudQuestions.forEach(q => map.set(q.id, q));
      localQuestions.forEach(q => map.set(q.id, q));
      return Array.from(map.values());
    }
  } catch (error) {
    console.warn('Failed to load questions from Firestore, using local fallback:', error);
  }

  // If Cloud Firestore had no questions or failed, merge seed + local
  const map = new Map<string, Question>();
  SEED_QUESTIONS.forEach(q => map.set(q.id, q));
  localQuestions.forEach(q => map.set(q.id, q));
  return Array.from(map.values());
}

/**
 * Delete all questions from Firestore & local storage (clears dummy or imported data)
 */
export async function deleteAllQuestions(): Promise<number> {
  const local = getStoredLocalQuestions();
  setStoredLocalQuestions([]);
  try {
    const snap = await getDocs(collection(db, 'questions'));
    if (!snap.empty) {
      const docs = snap.docs;
      const CHUNK_SIZE = 450;
      for (let i = 0; i < docs.length; i += CHUNK_SIZE) {
        const chunk = docs.slice(i, i + CHUNK_SIZE);
        const batch = writeBatch(db);
        chunk.forEach(d => {
          batch.delete(d.ref);
        });
        await batch.commit();
      }
      return docs.length;
    }
  } catch (error) {
    console.warn('Error deleting all questions from Firestore (cleared locally):', error);
  }
  return local.length;
}

/**
 * Clears all dummy data and resets question bank & logs
 */
export async function clearAllDummyData(): Promise<{ questionsDeleted: number }> {
  localStorage.removeItem(LOCAL_QUESTIONS_KEY);
  localStorage.removeItem(LOCAL_HISTORY_KEY);
  const qCount = await deleteAllQuestions();
  try {
    const histSnap = await getDocs(collection(db, 'import_history'));
    if (!histSnap.empty) {
      const batch = writeBatch(db);
      histSnap.docs.forEach(d => batch.delete(d.ref));
      await batch.commit();
    }
  } catch (err) {
    console.warn('Error clearing history:', err);
  }
  return { questionsDeleted: qCount };
}

/**
 * Optional: seeds demo sample questions if the admin specifically requests sample data
 */
export async function seedDemoQuestions(): Promise<number> {
  const batch = writeBatch(db);
  DEMO_SAMPLE_QUESTIONS.forEach(q => {
    const qRef = doc(db, 'questions', q.id);
    batch.set(qRef, q);
  });
  await batch.commit();
  return DEMO_SAMPLE_QUESTIONS.length;
}

export async function seedInitialDatabase(): Promise<void> {
  try {
    // Only seed subjects if subjects collection is empty
    const subjSnap = await getDocs(collection(db, 'subjects'));
    if (subjSnap.empty) {
      const batch = writeBatch(db);
      INITIAL_SUBJECTS.forEach(s => {
        const sRef = doc(db, 'subjects', s.id);
        batch.set(sRef, s);
      });
      await batch.commit();
    }
  } catch (err) {
    console.warn('Subject seeding bypassed:', err);
  }
}

export async function fetchSubjects(): Promise<SubjectItem[]> {
  const path = 'subjects';
  try {
    const snap = await getDocs(collection(db, path));
    if (snap.empty) {
      return INITIAL_SUBJECTS;
    }
    const subjects: SubjectItem[] = [];
    snap.forEach(docSnap => {
      subjects.push(docSnap.data() as SubjectItem);
    });
    return subjects;
  } catch {
    return INITIAL_SUBJECTS;
  }
}

export async function saveQuestion(question: Question): Promise<void> {
  // Always update local cache
  const local = getStoredLocalQuestions();
  const existingIdx = local.findIndex(q => q.id === question.id);
  if (existingIdx !== -1) {
    local[existingIdx] = question;
  } else {
    local.unshift(question);
  }
  setStoredLocalQuestions(local);

  try {
    await setDoc(doc(db, 'questions', question.id), {
      ...question,
      createdAt: question.createdAt || new Date().toISOString()
    });
  } catch (error) {
    console.warn('Could not write question to Firestore (saved locally):', error);
  }
}

export async function deleteQuestion(questionId: string): Promise<void> {
  const local = getStoredLocalQuestions().filter(q => q.id !== questionId);
  setStoredLocalQuestions(local);

  try {
    await deleteDoc(doc(db, 'questions', questionId));
  } catch (error) {
    console.warn('Could not delete question from Firestore (removed locally):', error);
  }
}

export async function batchImportQuestions(
  questions: Question[],
  fileName: string,
  adminUid: string,
  onProgress?: (processed: number, total: number) => void
): Promise<{ success: boolean; mode: 'cloud' | 'local'; count: number; message?: string }> {
  // Always update local cache so user never loses data
  const existingLocal = getStoredLocalQuestions();
  const map = new Map<string, Question>();
  existingLocal.forEach(q => map.set(q.id, q));
  questions.forEach(q => map.set(q.id, q));
  setStoredLocalQuestions(Array.from(map.values()));

  // Record import history locally
  const importId = `imp_${Date.now()}`;
  const importRecord: ImportHistoryItem = {
    id: importId,
    fileName,
    totalQuestions: questions.length,
    validCount: questions.length,
    invalidCount: 0,
    duplicateCount: 0,
    importedAt: new Date().toISOString(),
    importedBy: adminUid
  };
  appendStoredLocalHistory(importRecord);

  // Try committing to Cloud Firestore
  try {
    const CHUNK_SIZE = 250;
    let processed = 0;

    for (let i = 0; i < questions.length; i += CHUNK_SIZE) {
      const chunk = questions.slice(i, i + CHUNK_SIZE);
      const batch = writeBatch(db);
      chunk.forEach(q => {
        const qRef = doc(db, 'questions', q.id);
        batch.set(qRef, q);
      });
      await batch.commit();
      processed += chunk.length;
      if (onProgress) onProgress(processed, questions.length);
    }

    try {
      await setDoc(doc(db, 'import_history', importId), importRecord);
    } catch {}

    return { success: true, mode: 'cloud', count: questions.length };
  } catch (err: any) {
    console.warn('Firestore cloud write failed (permission or offline), data saved locally:', err);
    if (onProgress) onProgress(questions.length, questions.length);
    return {
      success: true,
      mode: 'local',
      count: questions.length,
      message: err?.message || 'Saved locally in browser storage'
    };
  }
}

export async function fetchImportHistory(): Promise<ImportHistoryItem[]> {
  const localHist = getStoredLocalHistory();
  try {
    const snap = await getDocs(query(collection(db, 'import_history'), orderBy('importedAt', 'desc'), limit(20)));
    const history: ImportHistoryItem[] = [];
    snap.forEach(d => history.push(d.data() as ImportHistoryItem));
    const map = new Map<string, ImportHistoryItem>();
    history.forEach(h => map.set(h.id, h));
    localHist.forEach(h => map.set(h.id, h));
    return Array.from(map.values()).sort((a, b) => new Date(b.importedAt).getTime() - new Date(a.importedAt).getTime());
  } catch {
    return localHist;
  }
}

// User attempts & tracking
export async function saveUserAttempt(userId: string, attempt: UserAttempt): Promise<void> {
  const path = `users/${userId}/attempts/${attempt.id}`;
  try {
    await setDoc(doc(db, 'users', userId, 'attempts', attempt.id), attempt);
  } catch (error) {
    console.warn('Could not save user attempt:', error);
  }
}

export async function fetchUserAttempts(userId: string): Promise<UserAttempt[]> {
  const path = `users/${userId}/attempts`;
  try {
    const snap = await getDocs(collection(db, 'users', userId, 'attempts'));
    const attempts: UserAttempt[] = [];
    snap.forEach(d => attempts.push(d.data() as UserAttempt));
    return attempts;
  } catch {
    return [];
  }
}

export async function saveQuizResult(userId: string, result: QuizResult): Promise<void> {
  const path = `users/${userId}/quizzes/${result.id}`;
  try {
    await setDoc(doc(db, 'users', userId, 'quizzes', result.id), result);
  } catch (error) {
    console.warn('Could not save quiz result:', error);
  }
}

export async function fetchUserQuizzes(userId: string): Promise<QuizResult[]> {
  const path = `users/${userId}/quizzes`;
  try {
    const snap = await getDocs(collection(db, 'users', userId, 'quizzes'));
    const results: QuizResult[] = [];
    snap.forEach(d => results.push(d.data() as QuizResult));
    return results.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  } catch {
    return [];
  }
}

export async function toggleUserBookmark(userId: string, questionId: string, isCurrentlyBookmarked: boolean): Promise<void> {
  const path = `users/${userId}/bookmarks/${questionId}`;
  try {
    if (isCurrentlyBookmarked) {
      await deleteDoc(doc(db, 'users', userId, 'bookmarks', questionId));
    } else {
      await setDoc(doc(db, 'users', userId, 'bookmarks', questionId), {
        id: questionId,
        userId,
        questionId,
        addedAt: new Date().toISOString()
      });
    }
  } catch (error) {
    console.warn('Could not toggle bookmark:', error);
  }
}

export async function fetchUserBookmarks(userId: string): Promise<string[]> {
  try {
    const snap = await getDocs(collection(db, 'users', userId, 'bookmarks'));
    const ids: string[] = [];
    snap.forEach(d => ids.push(d.id));
    return ids;
  } catch {
    return [];
  }
}

export async function saveFlashcardRating(userId: string, questionId: string, rating: 'easy' | 'medium' | 'hard'): Promise<void> {
  try {
    await setDoc(doc(db, 'users', userId, 'flashcards', questionId), {
      id: questionId,
      userId,
      questionId,
      rating,
      reviewedAt: new Date().toISOString()
    });
  } catch (error) {
    console.warn('Could not save flashcard review:', error);
  }
}

export async function fetchUserFlashcardRatings(userId: string): Promise<Record<string, 'easy' | 'medium' | 'hard'>> {
  try {
    const snap = await getDocs(collection(db, 'users', userId, 'flashcards'));
    const map: Record<string, 'easy' | 'medium' | 'hard'> = {};
    snap.forEach(d => {
      const data = d.data() as FlashcardRatingItem;
      map[data.questionId] = data.rating;
    });
    return map;
  } catch {
    return {};
  }
}

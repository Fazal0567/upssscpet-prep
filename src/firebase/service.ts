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

const ADMIN_EMAIL = 'mohdfazalali1@gmail.com';

export async function checkIsAdmin(userId: string, email?: string | null): Promise<boolean> {
  if (email && email.toLowerCase() === ADMIN_EMAIL.toLowerCase()) {
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

export async function fetchAllQuestions(): Promise<Question[]> {
  const path = 'questions';
  try {
    const snap = await getDocs(collection(db, path));
    if (snap.empty) {
      return [];
    }
    const questions: Question[] = [];
    snap.forEach(docSnap => {
      questions.push(docSnap.data() as Question);
    });
    return questions;
  } catch (error) {
    console.warn('Failed to load questions from Firestore:', error);
    return [];
  }
}

/**
 * Delete all questions from Firestore (clears dummy or imported data)
 */
export async function deleteAllQuestions(): Promise<number> {
  const path = 'questions';
  try {
    const snap = await getDocs(collection(db, path));
    if (snap.empty) return 0;
    
    let deletedCount = 0;
    const docs = snap.docs;
    const CHUNK_SIZE = 450;
    for (let i = 0; i < docs.length; i += CHUNK_SIZE) {
      const chunk = docs.slice(i, i + CHUNK_SIZE);
      const batch = writeBatch(db);
      chunk.forEach(d => {
        batch.delete(d.ref);
      });
      await batch.commit();
      deletedCount += chunk.length;
    }
    return deletedCount;
  } catch (error) {
    console.warn('Error deleting all questions from Firestore:', error);
    return 0;
  }
}

/**
 * Clears all dummy data and resets question bank & logs
 */
export async function clearAllDummyData(): Promise<{ questionsDeleted: number }> {
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
  const path = `questions/${question.id}`;
  try {
    await setDoc(doc(db, 'questions', question.id), {
      ...question,
      createdAt: question.createdAt || new Date().toISOString()
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function deleteQuestion(questionId: string): Promise<void> {
  const path = `questions/${questionId}`;
  try {
    await deleteDoc(doc(db, 'questions', questionId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

export async function batchImportQuestions(
  questions: Question[],
  fileName: string,
  adminUid: string,
  onProgress?: (processed: number, total: number) => void
): Promise<void> {
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

  // Record import history
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
  try {
    await setDoc(doc(db, 'import_history', importId), importRecord);
  } catch (err) {
    console.warn('Could not record import history:', err);
  }
}

export async function fetchImportHistory(): Promise<ImportHistoryItem[]> {
  const path = 'import_history';
  try {
    const snap = await getDocs(query(collection(db, path), orderBy('importedAt', 'desc'), limit(20)));
    const history: ImportHistoryItem[] = [];
    snap.forEach(d => history.push(d.data() as ImportHistoryItem));
    return history;
  } catch {
    return [];
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

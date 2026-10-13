export type DifficultyLevel = 'easy' | 'medium' | 'hard';
export type AppLanguage = 'en' | 'hi' | 'bilingual';

export interface Question {
  id: string;
  subject: string;
  topic: string;
  question_hi: string;
  question_en: string;
  options_hi: string[];
  options_en: string[];
  correct_option: number; // 0, 1, 2, 3
  answer_hi?: string;
  answer_en?: string;
  explanation_hi?: string;
  explanation_en?: string;
  difficulty: DifficultyLevel;
  createdAt?: string;
  createdBy?: string;
}

export interface SubjectItem {
  id: string;
  name_en: string;
  name_hi: string;
  icon: string;
  color: string;
  description: string;
  topics: string[];
  questionCount?: number;
}

export interface UserProfile {
  userId: string;
  email: string;
  displayName?: string;
  role: 'admin' | 'user';
  createdAt: string;
  lastLoginAt: string;
}

export interface UserProgressSummary {
  userId: string;
  attemptedCount: number;
  correctCount: number;
  incorrectCount: number;
  accuracy: number;
  lastActive: string;
}

export interface UserAttempt {
  id: string;
  userId: string;
  questionId: string;
  selectedOption: number;
  isCorrect: boolean;
  subject: string;
  topic: string;
  difficulty: DifficultyLevel;
  timeSpentSeconds: number;
  timestamp: string;
}

export interface QuizQuestionSummary {
  questionId: string;
  selectedOption: number | null; // null if unattempted
  correctOption: number;
  isCorrect: boolean;
  markedForReview: boolean;
  timeSpentSeconds: number;
}

export interface QuizResult {
  id: string;
  userId: string;
  title: string;
  subject?: string;
  totalQuestions: number;
  attemptedCount: number;
  correctCount: number;
  incorrectCount: number;
  skippedCount: number;
  score: number;
  maxScore: number;
  accuracy: number;
  positiveMarking: number;
  negativeMarking: number;
  timeSpentSeconds: number;
  timestamp: string;
  questionsSummary?: QuizQuestionSummary[];
}

export interface BookmarkItem {
  id: string;
  userId: string;
  questionId: string;
  addedAt: string;
}

export interface FlashcardRatingItem {
  id: string;
  userId: string;
  questionId: string;
  rating: 'easy' | 'medium' | 'hard';
  reviewedAt: string;
}

export interface ImportHistoryItem {
  id: string;
  fileName: string;
  totalQuestions: number;
  validCount: number;
  invalidCount: number;
  duplicateCount: number;
  importedAt: string;
  importedBy: string;
}

export interface ValidationIssue {
  index: number;
  id?: string;
  field: string;
  message: string;
  rawItem?: any;
}

export interface NormalizedImportResult {
  validQuestions: Question[];
  invalidRecords: ValidationIssue[];
  duplicateCount: number;
  totalParsed: number;
}

import { Question, NormalizedImportResult, ValidationIssue, DifficultyLevel } from '../types';

export function normalizeAndValidateQuestions(
  rawJson: any,
  existingQuestions: Question[] = []
): NormalizedImportResult {
  const existingIdSet = new Set(existingQuestions.map(q => q.id));
  const existingTextSet = new Set(
    existingQuestions.map(q => (q.question_en || q.question_hi || '').trim().toLowerCase())
  );

  let rawList: any[] = [];
  if (Array.isArray(rawJson)) {
    rawList = rawJson;
  } else if (rawJson && typeof rawJson === 'object') {
    if (Array.isArray(rawJson.questions)) {
      rawList = rawJson.questions;
    } else if (Array.isArray(rawJson.data)) {
      rawList = rawJson.data;
    } else {
      // Maybe an object whose values are questions
      rawList = Object.values(rawJson);
    }
  }

  const validQuestions: Question[] = [];
  const invalidRecords: ValidationIssue[] = [];
  let duplicateCount = 0;
  const currentBatchIdSet = new Set<string>();
  const currentBatchTextSet = new Set<string>();

  rawList.forEach((item, index) => {
    if (!item || typeof item !== 'object') {
      invalidRecords.push({
        index,
        field: 'root',
        message: 'Record is not a valid JSON object.',
        rawItem: item
      });
      return;
    }

    // Question texts
    const qHi = String(item.question_hi || item.question_hindi || item.hindi_question || '').trim();
    const qEn = String(item.question_en || item.question_english || item.english_question || item.question || '').trim();

    if (!qHi && !qEn) {
      invalidRecords.push({
        index,
        field: 'question',
        message: 'Missing both question_hi and question_en.',
        rawItem: item
      });
      return;
    }

    // Deduplication check
    const primaryText = (qEn || qHi).toLowerCase();
    if (existingTextSet.has(primaryText) || currentBatchTextSet.has(primaryText)) {
      duplicateCount++;
      invalidRecords.push({
        index,
        field: 'duplicate',
        message: `Duplicate question text found: "${(qEn || qHi).slice(0, 50)}..."`,
        rawItem: item
      });
      return;
    }

    // Parse options
    let rawOptionsHi: any[] = [];
    let rawOptionsEn: any[] = [];

    if (Array.isArray(item.options_hi)) {
      rawOptionsHi = item.options_hi;
    }
    if (Array.isArray(item.options_en)) {
      rawOptionsEn = item.options_en;
    }
    if (Array.isArray(item.options)) {
      if (rawOptionsEn.length === 0) rawOptionsEn = item.options;
      if (rawOptionsHi.length === 0) rawOptionsHi = item.options;
    } else if (item.options && typeof item.options === 'object') {
      // e.g. { A: "...", B: "..." }
      const optKeys = Object.keys(item.options).sort();
      const extracted = optKeys.map(k => String(item.options[k]));
      if (rawOptionsEn.length === 0) rawOptionsEn = extracted;
      if (rawOptionsHi.length === 0) rawOptionsHi = extracted;
    }

    const options_en = rawOptionsEn.map(o => String(o).trim()).filter(Boolean);
    const options_hi = rawOptionsHi.map(o => String(o).trim()).filter(Boolean);

    const effectiveOptions = options_en.length >= 2 ? options_en : options_hi;
    if (effectiveOptions.length < 2) {
      invalidRecords.push({
        index,
        field: 'options',
        message: 'A question must provide at least 2 options (standard is 4).',
        rawItem: item
      });
      return;
    }

    // Determine correct option index (0..N-1)
    let correctIdx: number | null = null;
    const rawCorrect = item.correct_option ?? item.correct_answer ?? item.answer ?? item.correct;

    if (typeof rawCorrect === 'number') {
      if (rawCorrect >= 0 && rawCorrect < effectiveOptions.length) {
        correctIdx = rawCorrect;
      } else if (rawCorrect >= 1 && rawCorrect <= effectiveOptions.length) {
        // 1-based index
        correctIdx = rawCorrect - 1;
      }
    } else if (typeof rawCorrect === 'string') {
      const trimmed = rawCorrect.trim();
      const upper = trimmed.toUpperCase();
      // Handle 'A', 'B', 'C', 'D'
      if (['A', 'B', 'C', 'D'].includes(upper)) {
        correctIdx = ['A', 'B', 'C', 'D'].indexOf(upper);
      } else if (['1', '2', '3', '4'].includes(trimmed)) {
        correctIdx = parseInt(trimmed, 10) - 1;
      } else {
        // Match string against options
        const matchIdxEn = options_en.findIndex(o => o.toLowerCase() === trimmed.toLowerCase());
        const matchIdxHi = options_hi.findIndex(o => o.trim() === trimmed);
        if (matchIdxEn !== -1) {
          correctIdx = matchIdxEn;
        } else if (matchIdxHi !== -1) {
          correctIdx = matchIdxHi;
        }
      }
    }

    if (correctIdx === null || correctIdx < 0 || correctIdx >= effectiveOptions.length) {
      invalidRecords.push({
        index,
        field: 'correct_option',
        message: `Invalid or unresolvable correct_option: "${String(rawCorrect)}". Must be 0..3, A..D, or match option text.`,
        rawItem: item
      });
      return;
    }

    // ID resolution
    let qId = String(item.id || item._id || '').trim();
    if (!qId || !/^[a-zA-Z0-9_\-]+$/.test(qId)) {
      qId = `pet_${Date.now()}_${index}_${Math.random().toString(36).substring(2, 6)}`;
    }

    if (existingIdSet.has(qId) || currentBatchIdSet.has(qId)) {
      // Modify duplicate ID safely
      qId = `${qId}_dup_${Date.now()}_${index}`;
    }

    // Difficulty normalization
    let diff: DifficultyLevel = 'medium';
    const rawDiff = String(item.difficulty || '').toLowerCase();
    if (rawDiff === 'easy' || rawDiff === 'hard' || rawDiff === 'medium') {
      diff = rawDiff as DifficultyLevel;
    }

    // Subject & Topic
    const subject = String(item.subject || 'General Awareness').trim();
    const topic = String(item.topic || 'General Practice').trim();

    // Answer text fallbacks
    const ansEn = String(item.answer_en || item.answer || options_en[correctIdx] || '').trim();
    const ansHi = String(item.answer_hi || options_hi[correctIdx] || ansEn).trim();

    const expEn = String(item.explanation_en || item.explanation || '').trim();
    const expHi = String(item.explanation_hi || expEn).trim();

    const finalQuestion: Question = {
      id: qId,
      subject,
      topic,
      question_hi: qHi || qEn,
      question_en: qEn || qHi,
      options_hi: options_hi.length ? options_hi : options_en,
      options_en: options_en.length ? options_en : options_hi,
      correct_option: correctIdx,
      answer_hi: ansHi,
      answer_en: ansEn,
      explanation_hi: expHi,
      explanation_en: expEn,
      difficulty: diff,
      createdAt: new Date().toISOString()
    };

    validQuestions.push(finalQuestion);
    currentBatchIdSet.add(qId);
    currentBatchTextSet.add(primaryText);
  });

  return {
    validQuestions,
    invalidRecords,
    duplicateCount,
    totalParsed: rawList.length
  };
}

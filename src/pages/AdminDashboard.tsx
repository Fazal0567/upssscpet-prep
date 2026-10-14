import React, { useState, useRef } from 'react';
import {
  ShieldAlert,
  Upload,
  Download,
  Plus,
  Trash2,
  Edit,
  Search,
  CheckCircle2,
  AlertTriangle,
  FileText,
  Database,
  Layers,
  ArrowRight,
  Eye,
  EyeOff,
  RefreshCw,
  X,
  Sparkles,
  Lock,
  KeyRound,
  ShieldCheck,
  Mail,
  LogOut
} from 'lucide-react';
import { Question, SubjectItem, ImportHistoryItem, NormalizedImportResult, DifficultyLevel } from '../types';
import { normalizeAndValidateQuestions } from '../utils/jsonNormalizer';
import { useAuth } from '../context/AuthContext';

interface AdminDashboardProps {
  questions: Question[];
  subjects: SubjectItem[];
  importHistory: ImportHistoryItem[];
  onSaveQuestion: (q: Question) => Promise<void>;
  onDeleteQuestion: (qId: string) => Promise<void>;
  onDeleteAllQuestions?: () => Promise<void>;
  onClearAllDummyData?: () => Promise<void>;
  onSeedDemoQuestions?: () => Promise<void>;
  onBatchImport: (validQuestions: Question[], fileName: string, onProgress: (p: number, t: number) => void) => Promise<any>;
  onRefreshData: () => Promise<void>;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  questions,
  subjects,
  importHistory,
  onSaveQuestion,
  onDeleteQuestion,
  onDeleteAllQuestions,
  onClearAllDummyData,
  onSeedDemoQuestions,
  onBatchImport,
  onRefreshData
}) => {
  const {
    user,
    profile,
    isAdmin,
    loginWithGoogle,
    unlockAdminWithKey,
    lockAdmin,
    logout,
    activeAdminPasskey,
    isCustomPasskeyActive,
    changeAdminPasskey,
    resetAdminPasskeyToDefault
  } = useAuth();
  const [passkeyInput, setPasskeyInput] = useState('');
  const [passkeyError, setPasskeyError] = useState<string | null>(null);

  // Active Admin Sub-tab
  const [activeAdminTab, setActiveAdminTab] = useState<'import' | 'questions' | 'subjects' | 'history' | 'passkey'>('import');

  // Change Passkey State
  const [changeKeyModalOpen, setChangeKeyModalOpen] = useState(false);
  const [currentPasskeyField, setCurrentPasskeyField] = useState('');
  const [newPasskeyField, setNewPasskeyField] = useState('');
  const [confirmPasskeyField, setConfirmPasskeyField] = useState('');
  const [passkeyStatusMsg, setPasskeyStatusMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [showCurrentKey, setShowCurrentKey] = useState(false);
  const [showNewKey, setShowNewKey] = useState(false);
  const [showActiveKey, setShowActiveKey] = useState(false);

  // Passkey change handlers
  const handlePasskeyChangeAction = (e: React.FormEvent) => {
    e.preventDefault();
    setPasskeyStatusMsg(null);
    if (!currentPasskeyField.trim()) {
      setPasskeyStatusMsg({ type: 'error', text: 'Please enter your current passkey.' });
      return;
    }
    if (!newPasskeyField.trim() || newPasskeyField.trim().length < 5) {
      setPasskeyStatusMsg({ type: 'error', text: 'New passkey must be at least 5 characters long.' });
      return;
    }
    if (newPasskeyField.trim() !== confirmPasskeyField.trim()) {
      setPasskeyStatusMsg({ type: 'error', text: 'New passkey and confirmation passkey do not match.' });
      return;
    }
    const res = changeAdminPasskey(currentPasskeyField, newPasskeyField);
    if (res.success) {
      setPasskeyStatusMsg({ type: 'success', text: res.message });
      setCurrentPasskeyField('');
      setNewPasskeyField('');
      setConfirmPasskeyField('');
    } else {
      setPasskeyStatusMsg({ type: 'error', text: res.message });
    }
  };

  const handleResetToDefaultAction = () => {
    if (window.confirm('Reset the admin passkey to the default passkey (PET-ADMIN-2026)?')) {
      const res = resetAdminPasskeyToDefault();
      setPasskeyStatusMsg({ type: 'success', text: res.message });
      setCurrentPasskeyField('');
      setNewPasskeyField('');
      setConfirmPasskeyField('');
    }
  };

  // JSON Import State
  const [importResult, setImportResult] = useState<NormalizedImportResult | null>(null);
  const [fileName, setFileName] = useState<string>('');
  const [importing, setImporting] = useState<boolean>(false);
  const [progress, setProgress] = useState<{ current: number; total: number }>({ current: 0, total: 0 });
  const [importSuccess, setImportSuccess] = useState<string | null>(null);
  const [previewTab, setPreviewTab] = useState<'valid' | 'invalid'>('valid');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Question Management State
  const [searchQuery, setSearchQuery] = useState('');
  const [filterSubject, setFilterSubject] = useState('all');
  const [filterDifficulty, setFilterDifficulty] = useState('all');

  // Add / Edit Modal
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<Partial<Question> | null>(null);

  // Delete All / Dummy Data Modal State
  const [deleteConfirmModalOpen, setDeleteConfirmModalOpen] = useState(false);
  const [isDeletingData, setIsDeletingData] = useState(false);
  const [dataWipeSuccess, setDataWipeSuccess] = useState<string | null>(null);

  const handleDeleteAllQuestionsAction = async () => {
    setIsDeletingData(true);
    setDataWipeSuccess(null);
    try {
      if (onDeleteAllQuestions) {
        await onDeleteAllQuestions();
      }
      setDataWipeSuccess('All questions and dummy data have been successfully deleted. The question bank is now completely clean!');
      setDeleteConfirmModalOpen(false);
    } catch (err) {
      console.error('Error deleting data:', err);
    } finally {
      setIsDeletingData(false);
    }
  };

  const handleSeedDemoAction = async () => {
    setIsDeletingData(true);
    setDataWipeSuccess(null);
    try {
      if (onSeedDemoQuestions) {
        await onSeedDemoQuestions();
      }
      setDataWipeSuccess('Sample demo questions loaded successfully into question bank.');
    } catch (err) {
      console.error('Error loading sample questions:', err);
    } finally {
      setIsDeletingData(false);
    }
  };

  // File Upload Handler
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    setImportSuccess(null);

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        const result = normalizeAndValidateQuestions(parsed, questions);
        setImportResult(result);
        if (result.validQuestions.length === 0 && result.invalidRecords.length > 0) {
          setPreviewTab('invalid');
        } else {
          setPreviewTab('valid');
        }
      } catch (err: any) {
        alert('Invalid JSON file. Please ensure the file contains valid JSON syntax.');
      }
    };
    reader.readAsText(file);
  };

  // Commit Import
  const handleCommitImport = async () => {
    if (!importResult || importResult.validQuestions.length === 0) return;
    setImporting(true);
    try {
      const res = await onBatchImport(
        importResult.validQuestions,
        fileName || 'questions_import.json',
        (curr, tot) => setProgress({ current: curr, total: tot })
      );
      if (res?.mode === 'local') {
        setImportSuccess(`Successfully imported ${importResult.validQuestions.length} questions! (Saved in local browser storage). Click 'Sync All to Cloud' to push to Cloud Firestore.`);
      } else {
        setImportSuccess(`🎉 Successfully imported and synced ${importResult.validQuestions.length} questions to Cloud Firestore! All students on all devices can now view and practice them.`);
      }
      setImportResult(null);
      setFileName('');
      await onRefreshData();
    } catch (err: any) {
      alert(`Import error: ${err.message || 'Please check the file syntax'}`);
    } finally {
      setImporting(false);
    }
  };

  // Sync all current bank questions to Cloud Firestore
  const [syncingCloud, setSyncingCloud] = useState(false);
  const [syncNotice, setSyncNotice] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);

  const handleSyncAllToCloud = async () => {
    if (questions.length === 0) {
      alert('No questions to sync. Please import or add questions first.');
      return;
    }
    setSyncingCloud(true);
    setSyncNotice(null);
    try {
      const res = await onBatchImport(questions, 'cloud_sync_manual.json', () => {});
      if (res?.mode === 'cloud') {
        setSyncNotice({
          type: 'success',
          msg: `🎉 Successfully synced all ${questions.length} questions to Cloud Firestore! All users on all devices can now view them.`
        });
      } else {
        setSyncNotice({
          type: 'error',
          msg: `⚠️ Cloud write permission denied: ${res?.message || 'Check Firestore Rules'}. Please check that your email is authorized in Firestore Rules in Firebase Console.`
        });
      }
      await onRefreshData();
    } catch (e: any) {
      setSyncNotice({
        type: 'error',
        msg: `Sync failed: ${e?.message || 'Network error'}`
      });
    } finally {
      setSyncingCloud(false);
    }
  };

  // Export questions
  const handleExportJSON = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(questions, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `upsssc_pet_questions_${Date.now()}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  // Filtered Questions for Management table
  const filteredQuestionList = questions.filter(q => {
    const matchesSearch =
      q.question_en.toLowerCase().includes(searchQuery.toLowerCase()) ||
      q.question_hi.toLowerCase().includes(searchQuery.toLowerCase()) ||
      q.topic.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesSubject = filterSubject === 'all' || q.subject.toLowerCase() === filterSubject.toLowerCase();
    const matchesDiff = filterDifficulty === 'all' || q.difficulty === filterDifficulty;
    return matchesSearch && matchesSubject && matchesDiff;
  });

  // Save Modal submission
  const handleSaveModal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingQuestion?.question_en && !editingQuestion?.question_hi) {
      alert('Question text is required');
      return;
    }
    const finalQ: Question = {
      id: editingQuestion.id || `pet_${Date.now()}`,
      subject: editingQuestion.subject || 'General Awareness',
      topic: editingQuestion.topic || 'General Practice',
      question_hi: editingQuestion.question_hi || editingQuestion.question_en || '',
      question_en: editingQuestion.question_en || editingQuestion.question_hi || '',
      options_hi: editingQuestion.options_hi || ['Option A', 'Option B', 'Option C', 'Option D'],
      options_en: editingQuestion.options_en || ['Option A', 'Option B', 'Option C', 'Option D'],
      correct_option: editingQuestion.correct_option !== undefined ? editingQuestion.correct_option : 0,
      answer_hi: editingQuestion.answer_hi || '',
      answer_en: editingQuestion.answer_en || '',
      explanation_hi: editingQuestion.explanation_hi || '',
      explanation_en: editingQuestion.explanation_en || '',
      difficulty: (editingQuestion.difficulty as DifficultyLevel) || 'medium',
      createdAt: new Date().toISOString()
    };

    await onSaveQuestion(finalQ);
    setEditModalOpen(false);
    setEditingQuestion(null);
  };

  const renderChangeKeyModal = () => {
    if (!changeKeyModalOpen) return null;
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-sm animate-fade-in">
        <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden text-left">
          <div className="bg-gradient-to-r from-amber-600 to-slate-900 text-white px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <KeyRound className="w-5 h-5 text-amber-300" />
              <h3 className="text-sm font-bold">Change Admin Passkey</h3>
            </div>
            <button
              type="button"
              onClick={() => {
                setChangeKeyModalOpen(false);
                setPasskeyStatusMsg(null);
              }}
              className="p-1 rounded-full hover:bg-white/10 text-white"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="p-6 space-y-4 text-xs">
            {passkeyStatusMsg && (
              <div className={`p-3.5 rounded-2xl text-xs flex items-center gap-2 animate-fade-in ${
                passkeyStatusMsg.type === 'success'
                  ? 'bg-emerald-50 border border-emerald-200 text-emerald-800'
                  : 'bg-rose-50 border border-rose-200 text-rose-800'
              }`}>
                {passkeyStatusMsg.type === 'success' ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                ) : (
                  <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                )}
                <span className="font-semibold">{passkeyStatusMsg.text}</span>
              </div>
            )}

            <form onSubmit={handlePasskeyChangeAction} className="space-y-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Current Admin Passkey
                </label>
                <div className="relative">
                  <input
                    type={showCurrentKey ? 'text' : 'password'}
                    required
                    value={currentPasskeyField}
                    onChange={(e) => setCurrentPasskeyField(e.target.value)}
                    placeholder="Enter current passkey"
                    className="w-full pl-3 pr-10 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrentKey(!showCurrentKey)}
                    className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600"
                  >
                    {showCurrentKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  New Admin Passkey
                </label>
                <div className="relative">
                  <input
                    type={showNewKey ? 'text' : 'password'}
                    required
                    value={newPasskeyField}
                    onChange={(e) => setNewPasskeyField(e.target.value)}
                    placeholder="Enter new passkey (min. 5 chars)"
                    className="w-full pl-3 pr-10 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewKey(!showNewKey)}
                    className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600"
                  >
                    {showNewKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Confirm New Admin Passkey
                </label>
                <input
                  type={showNewKey ? 'text' : 'password'}
                  required
                  value={confirmPasskeyField}
                  onChange={(e) => setConfirmPasskeyField(e.target.value)}
                  placeholder="Re-enter new passkey"
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                />
              </div>

              <div className="pt-2 flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setChangeKeyModalOpen(false);
                    setPasskeyStatusMsg(null);
                  }}
                  className="flex-1 py-2.5 px-3 rounded-xl border border-slate-200 text-slate-700 font-semibold hover:bg-slate-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 px-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold transition shadow-md flex items-center justify-center gap-1.5"
                >
                  <KeyRound className="w-4 h-4" />
                  <span>Update Passkey</span>
                </button>
              </div>
            </form>

            {isCustomPasskeyActive && (
              <div className="pt-2 border-t border-slate-100 flex justify-center">
                <button
                  type="button"
                  onClick={handleResetToDefaultAction}
                  className="text-[11px] text-amber-700 hover:text-amber-800 font-medium flex items-center gap-1"
                >
                  <RefreshCw className="w-3 h-3" />
                  <span>Reset to default factory passkey</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  const renderDeleteConfirmModal = () => {
    if (!deleteConfirmModalOpen) return null;
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-sm animate-fade-in text-left">
        <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden p-6 space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
            <Trash2 className="w-6 h-6" />
          </div>

          <div className="text-center space-y-1">
            <h3 className="text-base font-bold text-slate-900">
              Delete All Dummy Data & Questions?
            </h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              This will permanently delete all <strong>{questions.length}</strong> questions currently in the question bank. This completely wipes pre-seeded dummy questions so you can import your official JSON exam data.
            </p>
          </div>

          <div className="bg-amber-50 rounded-2xl p-3 border border-amber-200 text-[11px] text-amber-800 flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <span>You can always upload your custom JSON questions anytime, or reload sample questions if needed.</span>
          </div>

          <div className="pt-2 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => setDeleteConfirmModalOpen(false)}
              disabled={isDeletingData}
              className="px-4 py-2 rounded-xl border border-slate-200 text-slate-700 font-semibold text-xs hover:bg-slate-50 transition"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleDeleteAllQuestionsAction}
              disabled={isDeletingData}
              className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs transition shadow-md flex items-center gap-1.5"
            >
              {isDeletingData ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Deleting Data...</span>
                </>
              ) : (
                <>
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Yes, Delete All Dummy Data</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    );
  };

  // ACCESS GATE: If not verified admin, show security authentication prompt
  if (!isAdmin) {
    const handlePasskeySubmit = (e: React.FormEvent) => {
      e.preventDefault();
      setPasskeyError(null);
      const ok = unlockAdminWithKey(passkeyInput);
      if (!ok) {
        setPasskeyError('❌ Invalid Admin Passkey! Please enter the authorized administrator passkey.');
      }
    };

    return (
      <div className="max-w-md mx-auto my-8 p-6 sm:p-8 bg-white rounded-3xl shadow-xl border border-slate-200 text-center space-y-5 animate-fade-in">
        <div className="w-16 h-16 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center mx-auto shadow-inner">
          <ShieldAlert className="w-8 h-8" />
        </div>

        <div>
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 uppercase tracking-wider">
            Restricted Admin Area
          </span>
          <h2 className="text-xl font-extrabold text-slate-900 mt-2">Admin Passkey Required</h2>
          <p className="text-xs text-slate-500 mt-1 leading-relaxed">
            Please enter the secure administrator passkey to manage question banks, import JSON datasets, and edit exams.
          </p>
        </div>

        {/* Current User Notice if logged in as regular student */}
        {user && !isAdmin && (
          <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-left text-xs space-y-1">
            <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">Current Active Session:</div>
            <div className="font-bold text-slate-800 flex items-center justify-between">
              <span className="truncate">{profile?.displayName || 'Candidate Account'}</span>
              <span className="text-[10px] px-2 py-0.5 rounded bg-blue-100 text-blue-700 font-bold shrink-0">Candidate</span>
            </div>
            <p className="text-[11px] text-amber-700 font-medium pt-1">
              ⚠️ This candidate account does not have administrator privileges. Please enter the administrator passkey below to unlock admin controls.
            </p>
            <button
              onClick={() => logout()}
              className="mt-1 text-[11px] text-slate-600 hover:text-rose-600 flex items-center gap-1 font-semibold"
            >
              <LogOut className="w-3 h-3" />
              <span>Sign out of candidate account</span>
            </button>
          </div>
        )}

        {passkeyError && (
          <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs text-left font-medium leading-relaxed animate-fade-in">
            {passkeyError}
          </div>
        )}

        {/* Exclusive Passkey Authentication Form */}
        <form onSubmit={handlePasskeySubmit} className="space-y-4 pt-1 text-left">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Administrator Passkey</label>
            <div className="relative">
              <KeyRound className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="password"
                required
                placeholder="Enter Admin Passkey"
                value={passkeyInput}
                onChange={(e) => setPasskeyInput(e.target.value)}
                className="w-full pl-9 pr-3 py-2.5 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-amber-500 text-slate-900 font-mono shadow-xs"
              />
            </div>
            <p className="text-[10px] text-slate-400 mt-1">Confidential security passkey reserved for administrator.</p>
          </div>

          <button
            type="submit"
            className="w-full py-2.5 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs transition shadow-md flex items-center justify-center gap-2"
          >
            <ShieldAlert className="w-4 h-4 text-amber-400" />
            <span>Verify Passkey & Unlock Portal</span>
          </button>
        </form>

        <div className="pt-2 text-center border-t border-slate-100">
          <button
            type="button"
            onClick={() => {
              setChangeKeyModalOpen(true);
              setPasskeyStatusMsg(null);
            }}
            className="text-xs text-amber-700 hover:text-amber-800 font-semibold inline-flex items-center gap-1.5 hover:underline"
          >
            <KeyRound className="w-3.5 h-3.5" />
            <span>Change Admin Passkey</span>
          </button>
        </div>

        {renderChangeKeyModal()}
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-16 animate-fade-in">
      {/* Admin Header */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 rounded-3xl p-6 sm:p-8 text-white shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6 border border-slate-700">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40">
              Admin Control Center
            </span>
            <span className="text-xs text-slate-400">Authenticated: Administrator (Verified)</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">Question Bank & Syllabus Management</h1>
          <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-xl">
            Import, validate, deduplicate, and curate UPSSSC PET questions with Cloud Firestore database synchronization.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={() => {
              setChangeKeyModalOpen(true);
              setPasskeyStatusMsg(null);
            }}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 font-semibold text-xs border border-amber-500/30 transition shadow-sm"
            title="Change master admin passkey"
          >
            <KeyRound className="w-3.5 h-3.5 text-amber-400" />
            <span>Change Passkey</span>
          </button>
          <button
            onClick={lockAdmin}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 font-semibold text-xs border border-rose-500/30 transition"
            title="Lock and end admin session"
          >
            <Lock className="w-3.5 h-3.5 text-rose-400" />
            <span>Lock Admin</span>
          </button>
          <button
            onClick={handleExportJSON}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs border border-slate-600 transition"
          >
            <Download className="w-4 h-4 text-blue-400" />
            <span>Export Bank JSON ({questions.length})</span>
          </button>
          <button
            onClick={handleSyncAllToCloud}
            disabled={syncingCloud}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold text-xs transition shadow-lg shadow-emerald-600/30"
            title="Sync all current questions to Cloud Firestore so all students see them"
          >
            <Database className={`w-4 h-4 ${syncingCloud ? 'animate-spin' : ''}`} />
            <span>{syncingCloud ? 'Syncing...' : `Sync All to Cloud (${questions.length})`}</span>
          </button>
          <button
            onClick={() => {
              setEditingQuestion({
                options_hi: ['', '', '', ''],
                options_en: ['', '', '', ''],
                correct_option: 0,
                difficulty: 'medium',
                subject: subjects[0]?.name_en || 'Uttar Pradesh GK'
              });
              setEditModalOpen(true);
            }}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs transition shadow-lg shadow-blue-600/30"
          >
            <Plus className="w-4 h-4" />
            <span>Add Question</span>
          </button>
        </div>
      </div>

      {/* Storage & Sync Status Banner */}
      {(!user && !profile?.email) ? (
        <div className="p-4 rounded-2xl bg-amber-50 border border-amber-300 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-amber-950 animate-fade-in shadow-sm">
          <div className="flex items-start sm:items-center gap-2.5">
            <KeyRound className="w-5 h-5 text-amber-600 shrink-0 mt-0.5 sm:mt-0" />
            <div>
              <span className="font-bold text-amber-900">Admin Passkey Mode Active:</span> Questions you import or add work immediately across Mock Tests, Flashcards, and Practice.
              <span className="block sm:inline sm:ml-1 text-[11px] text-amber-800">To sync directly to Cloud Firestore, sign in with your Google Admin account.</span>
            </div>
          </div>
          <button
            type="button"
            onClick={async () => {
              try {
                await loginWithGoogle();
              } catch (e: any) {
                console.warn('Sign-in notice:', e);
              }
            }}
            className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shrink-0 flex items-center justify-center gap-1.5 shadow-sm transition"
          >
            <span>Sign in with Google to Sync Cloud</span>
          </button>
        </div>
      ) : (
        <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-300 flex items-center justify-between text-xs text-emerald-950 animate-fade-in shadow-sm">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span><strong className="text-emerald-900">Admin Session Active:</strong> Logged in as {user?.email || profile?.email || profile?.displayName}</span>
          </div>
        </div>
      )}

      {/* Sync Notice Alert */}
      {syncNotice && (
        <div className={`p-4 rounded-2xl text-xs flex items-start gap-2.5 animate-fade-in shadow-sm ${
          syncNotice.type === 'success'
            ? 'bg-emerald-50 border border-emerald-300 text-emerald-950'
            : 'bg-amber-50 border border-amber-300 text-amber-950'
        }`}>
          {syncNotice.type === 'success' ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
          ) : (
            <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          )}
          <div className="flex-1">
            <p className="font-semibold">{syncNotice.msg}</p>
          </div>
          <button
            onClick={() => setSyncNotice(null)}
            className="p-1 rounded-lg hover:bg-black/5 text-slate-500"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Metrics Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-sm">
          <span className="text-xs font-semibold text-slate-500 uppercase">Total Questions</span>
          <div className="text-2xl font-extrabold text-slate-900 mt-1">{questions.length}</div>
          <span className="text-[11px] text-blue-600 font-medium">In active Firestore collection</span>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-sm">
          <span className="text-xs font-semibold text-slate-500 uppercase">Subjects</span>
          <div className="text-2xl font-extrabold text-slate-900 mt-1">{subjects.length}</div>
          <span className="text-[11px] text-slate-500">Official syllabus categories</span>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-sm">
          <span className="text-xs font-semibold text-slate-500 uppercase">Import Batches</span>
          <div className="text-2xl font-extrabold text-slate-900 mt-1">{importHistory.length}</div>
          <span className="text-[11px] text-emerald-600 font-medium">Logged in history</span>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-sm">
          <span className="text-xs font-semibold text-slate-500 uppercase">DB Mode</span>
          <div className="text-2xl font-extrabold text-slate-900 mt-1 flex items-center gap-2">
            <span>Live Firestore</span>
          </div>
          <span className="text-[11px] text-slate-500">Zero-trust ABAC rules enabled</span>
        </div>
      </div>

      {/* Admin Nav Tabs */}
      <div className="flex border-b border-slate-200 bg-white rounded-2xl px-3 shadow-sm text-xs font-bold text-slate-600 overflow-x-auto no-scrollbar">
        {[
          { id: 'import', label: 'JSON Import & Validation', icon: Upload },
          { id: 'questions', label: `Manage Questions (${questions.length})`, icon: Database },
          { id: 'subjects', label: 'Subjects & Topics', icon: Layers },
          { id: 'history', label: 'Import History Logs', icon: FileText },
          { id: 'passkey', label: 'Admin Passkey Settings', icon: KeyRound }
        ].map(tab => {
          const Icon = tab.icon;
          const isActive = activeAdminTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveAdminTab(tab.id as any)}
              className={`flex items-center gap-2 py-4 px-4 border-b-2 transition shrink-0 ${
                isActive ? 'border-blue-600 text-blue-600' : 'border-transparent hover:text-slate-900'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* 1. JSON Import & Validation Tab */}
      {activeAdminTab === 'import' && (
        <div className="space-y-6">
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/90 shadow-sm space-y-6">
            <div>
              <h2 className="text-lg font-bold text-slate-900">High-Scale Question JSON Import</h2>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                Upload your 100-question or 1,000+ question JSON files. The engine automatically normalizes diverse schemas (e.g., <code>question_hi</code>, <code>options_hi</code>, <code>options</code>, <code>correct_answer</code>), identifies duplicate questions and IDs, and validates records before batch committing to Firestore.
              </p>
            </div>

            {importSuccess && (
              <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2 animate-fade-in">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                <span className="font-semibold">{importSuccess}</span>
              </div>
            )}

            {/* Dropzone */}
            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-slate-300 hover:border-blue-500 rounded-3xl p-8 sm:p-12 text-center cursor-pointer bg-slate-50/50 hover:bg-blue-50/20 transition space-y-3"
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".json"
                onChange={handleFileUpload}
                className="hidden"
              />
              <div className="w-14 h-14 rounded-2xl bg-blue-100 text-blue-600 flex items-center justify-center mx-auto shadow-inner">
                <Upload className="w-7 h-7" />
              </div>
              <div className="space-y-1">
                <h4 className="text-sm font-bold text-slate-900">
                  {fileName ? `Selected: ${fileName}` : 'Click or Drag JSON file to Upload'}
                </h4>
                <p className="text-xs text-slate-500">Supports .json file with up to 2,000 questions per batch</p>
              </div>
            </div>

            {/* Sample schema template snippet */}
            <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200 text-xs space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-700 flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-blue-600" />
                  <span>Supported JSON Schema Formats:</span>
                </span>
                <span className="text-[10px] text-slate-500 font-mono">Auto-Normalized</span>
              </div>
              <pre className="text-[11px] font-mono bg-slate-900 text-slate-200 p-3 rounded-xl overflow-x-auto">
{`[
  {
    "id": "pet_sample_01",
    "subject": "Uttar Pradesh GK",
    "topic": "UP Geography",
    "question_hi": "उत्तर प्रदेश का राजकीय पक्षी कौन सा है?",
    "question_en": "Which is the state bird of Uttar Pradesh?",
    "options_hi": ["सारस (क्रौंच)", "मोर", "तोता", "कोयल"],
    "options_en": ["Sarus Crane", "Peacock", "Parrot", "Cuckoo"],
    "correct_option": 0, // or "correct_answer": "सारस" or "A"
    "explanation_hi": "सारस क्रेन उत्तर प्रदेश का राजकीय पक्षी है।",
    "difficulty": "easy"
  }
]`}
              </pre>
            </div>
          </div>

          {/* Validation Report & Preview */}
          {importResult && (
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/90 shadow-sm space-y-6 animate-fade-in">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-4">
                <div>
                  <h3 className="text-base font-bold text-slate-900">Validation & Analysis Summary</h3>
                  <div className="flex items-center gap-4 text-xs mt-1">
                    <span className="font-semibold text-slate-700">Total in file: {importResult.totalParsed}</span>
                    <span className="font-semibold text-emerald-600">Valid: {importResult.validQuestions.length}</span>
                    <span className="font-semibold text-amber-600">Duplicates: {importResult.duplicateCount}</span>
                    <span className="font-semibold text-rose-600">Errors: {importResult.invalidRecords.length}</span>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    onClick={() => { setImportResult(null); setFileName(''); }}
                    className="px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                  >
                    Cancel
                  </button>

                  <button
                    onClick={handleCommitImport}
                    disabled={importing || importResult.validQuestions.length === 0}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold text-xs transition shadow-md shadow-emerald-600/30"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>
                      {importing
                        ? `Importing (${progress.current}/${progress.total})...`
                        : `Commit ${importResult.validQuestions.length} Questions to Firestore`}
                    </span>
                  </button>
                </div>
              </div>

              {/* Preview Mode Switcher */}
              <div className="flex gap-2">
                <button
                  onClick={() => setPreviewTab('valid')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                    previewTab === 'valid'
                      ? 'bg-blue-600 text-white'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  Valid Questions Preview ({importResult.validQuestions.length})
                </button>
                <button
                  onClick={() => setPreviewTab('invalid')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                    previewTab === 'invalid'
                      ? 'bg-rose-600 text-white'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  Invalid Records & Errors ({importResult.invalidRecords.length})
                </button>
              </div>

              {/* Valid Preview Table */}
              {previewTab === 'valid' && (
                <div className="overflow-x-auto rounded-xl border border-slate-200 no-scrollbar">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 text-slate-600 uppercase font-semibold border-b">
                      <tr>
                        <th className="p-3">#</th>
                        <th className="p-3">Subject & Topic</th>
                        <th className="p-3">Question Text (Hindi / English)</th>
                        <th className="p-3">Correct Option</th>
                        <th className="p-3">Difficulty</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {importResult.validQuestions.slice(0, 15).map((q, idx) => (
                        <tr key={q.id} className="hover:bg-slate-50/70">
                          <td className="p-3 font-mono font-bold text-slate-400">{idx + 1}</td>
                          <td className="p-3">
                            <span className="font-semibold text-slate-800 block">{q.subject}</span>
                            <span className="text-[11px] text-slate-500">{q.topic}</span>
                          </td>
                          <td className="p-3 max-w-md">
                            <div className="font-medium text-slate-900 line-clamp-1">{q.question_hi || q.question_en}</div>
                            {q.question_en && q.question_en !== q.question_hi && (
                              <div className="text-[11px] text-slate-500 italic line-clamp-1">{q.question_en}</div>
                            )}
                          </td>
                          <td className="p-3">
                            <span className="font-bold text-emerald-700">
                              Option {['A', 'B', 'C', 'D'][q.correct_option]}
                            </span>
                          </td>
                          <td className="p-3 capitalize font-semibold">{q.difficulty}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {importResult.validQuestions.length > 15 && (
                    <div className="p-3 bg-slate-50 text-center text-xs text-slate-500 font-medium">
                      Showing first 15 records of {importResult.validQuestions.length} total valid questions
                    </div>
                  )}
                </div>
              )}

              {/* Invalid Records Error Report */}
              {previewTab === 'invalid' && (
                <div className="space-y-3">
                  {importResult.invalidRecords.length === 0 ? (
                    <div className="p-6 text-center text-xs text-emerald-600 bg-emerald-50 rounded-xl">
                      No errors detected in this batch! All records passed validation.
                    </div>
                  ) : (
                    <div className="space-y-2 max-h-96 overflow-y-auto">
                      {importResult.invalidRecords.map((err, i) => (
                        <div key={i} className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs space-y-1">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-rose-800">
                              Record #{err.index + 1} • Issue in field: <code>{err.field}</code>
                            </span>
                            <span className="text-[10px] text-rose-600 uppercase font-mono">Invalid</span>
                          </div>
                          <p className="text-rose-700">{err.message}</p>
                          {err.rawItem && (
                            <pre className="text-[10px] font-mono bg-white p-2 rounded border border-rose-200 overflow-x-auto text-slate-700">
                              {JSON.stringify(err.rawItem, null, 2)}
                            </pre>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* 2. Question Bank Management Tab */}
      {activeAdminTab === 'questions' && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/90 shadow-sm space-y-6">
          {/* Top Bar for Question Management */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-100">
            <div>
              <h2 className="text-lg font-bold text-slate-900">Active Question Bank ({questions.length})</h2>
              <p className="text-xs text-slate-500 mt-0.5">
                {questions.length === 0
                  ? 'No questions currently in the bank. Upload your official JSON file or add questions below.'
                  : 'Manage, search, edit, or purge all questions and dummy data.'}
              </p>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              {questions.length > 0 ? (
                <button
                  type="button"
                  onClick={() => setDeleteConfirmModalOpen(true)}
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs border border-rose-200 transition"
                  title="Delete all dummy/sample questions"
                >
                  <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                  <span>Delete Dummy / All Data</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleSeedDemoAction}
                  disabled={isDeletingData}
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold text-xs border border-blue-200 transition"
                >
                  <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                  <span>Load Sample Demo Questions</span>
                </button>
              )}
            </div>
          </div>

          {dataWipeSuccess && (
            <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2 animate-fade-in">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              <span className="font-semibold">{dataWipeSuccess}</span>
            </div>
          )}

          {/* Search & Filters */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="text"
                placeholder="Search questions by text or topic..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <select
              value={filterSubject}
              onChange={(e) => setFilterSubject(e.target.value)}
              className="text-xs font-medium bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800"
            >
              <option value="all">All Subjects ({questions.length})</option>
              {subjects.map(s => (
                <option key={s.id} value={s.name_en}>{s.name_en}</option>
              ))}
            </select>

            <select
              value={filterDifficulty}
              onChange={(e) => setFilterDifficulty(e.target.value)}
              className="text-xs font-medium bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 capitalize"
            >
              <option value="all">All Difficulties</option>
              <option value="easy">Easy</option>
              <option value="medium">Medium</option>
              <option value="hard">Hard</option>
            </select>
          </div>

          {/* Table / Empty State */}
          {filteredQuestionList.length === 0 ? (
            <div className="p-12 text-center space-y-3 bg-slate-50/50 rounded-2xl border border-slate-200">
              <Database className="w-12 h-12 text-slate-300 mx-auto" />
              <h3 className="text-sm font-bold text-slate-800">
                {questions.length === 0 ? 'Question Bank is Empty' : 'No Questions Found'}
              </h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                {questions.length === 0
                  ? 'Dummy data has been deleted. Go to "JSON Import & Validation" to import your real UPSSSC PET exam questions, or click "Add Question" to create one.'
                  : 'No questions match the current filter and search criteria.'}
              </p>
              {questions.length === 0 && (
                <div className="flex items-center justify-center gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setActiveAdminTab('import')}
                    className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition shadow-sm inline-flex items-center gap-1.5"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>Go to JSON Import</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleSeedDemoAction}
                    disabled={isDeletingData}
                    className="px-4 py-2 rounded-xl bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 text-xs font-semibold transition inline-flex items-center gap-1.5"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                    <span>Load Demo Questions</span>
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto rounded-2xl border border-slate-200 no-scrollbar">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-600 uppercase font-semibold border-b">
                  <tr>
                    <th className="p-3">#</th>
                    <th className="p-3">Subject / Topic</th>
                    <th className="p-3">Question</th>
                    <th className="p-3">Difficulty</th>
                    <th className="p-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredQuestionList.map((q, idx) => (
                    <tr key={q.id} className="hover:bg-slate-50/70">
                      <td className="p-3 font-mono font-bold text-slate-400">{idx + 1}</td>
                      <td className="p-3">
                        <span className="font-semibold text-slate-800 block">{q.subject}</span>
                        <span className="text-[11px] text-slate-500">{q.topic}</span>
                      </td>
                      <td className="p-3 max-w-lg">
                        <div className="font-medium text-slate-900 line-clamp-2">{q.question_hi || q.question_en}</div>
                        {q.question_en && q.question_en !== q.question_hi && (
                          <div className="text-[11px] text-slate-500 italic line-clamp-1">{q.question_en}</div>
                        )}
                      </td>
                      <td className="p-3">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                          q.difficulty === 'easy' ? 'bg-emerald-100 text-emerald-700' :
                          q.difficulty === 'hard' ? 'bg-rose-100 text-rose-700' : 'bg-amber-100 text-amber-700'
                        }`}>
                          {q.difficulty}
                        </span>
                      </td>
                      <td className="p-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => {
                              setEditingQuestion(q);
                              setEditModalOpen(true);
                            }}
                            className="p-1.5 rounded-lg text-slate-600 hover:bg-slate-100 hover:text-blue-600 transition"
                            title="Edit"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={async () => {
                              await onDeleteQuestion(q.id);
                            }}
                            className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-50 transition"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* 3. Subjects & Syllabus Tab */}
      {activeAdminTab === 'subjects' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {subjects.map(s => {
            const count = questions.filter(q => q.subject.toLowerCase() === s.name_en.toLowerCase()).length;
            return (
              <div key={s.id} className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-sm space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-slate-900 text-sm">{s.name_en}</h3>
                  <span className="px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 text-xs font-bold">
                    {count} Questions
                  </span>
                </div>
                <p className="text-xs text-slate-500">{s.name_hi}</p>
                <div className="space-y-1 pt-2 border-t border-slate-100">
                  <span className="text-[10px] font-bold uppercase text-slate-400">Syllabus Topics:</span>
                  <div className="flex flex-wrap gap-1.5">
                    {s.topics.map(t => (
                      <span key={t} className="px-2 py-0.5 rounded-md bg-slate-100 text-[11px] text-slate-700">
                        {t}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 4. Import History Tab */}
      {activeAdminTab === 'history' && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/90 shadow-sm space-y-4">
          <h2 className="text-base font-bold text-slate-900">Import Batch Logs</h2>
          <div className="overflow-x-auto rounded-xl border border-slate-200 no-scrollbar">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 uppercase font-semibold border-b">
                <tr>
                  <th className="p-3">File Name</th>
                  <th className="p-3">Total Questions</th>
                  <th className="p-3">Import Date</th>
                  <th className="p-3">Imported By</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {importHistory.map(h => (
                  <tr key={h.id}>
                    <td className="p-3 font-semibold text-slate-800">{h.fileName}</td>
                    <td className="p-3 font-bold text-emerald-600">{h.totalQuestions} Questions</td>
                    <td className="p-3 text-slate-500">{new Date(h.importedAt).toLocaleString()}</td>
                    <td className="p-3 font-mono text-[11px] text-slate-500">{h.importedBy}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 5. Admin Passkey Settings Tab */}
      {activeAdminTab === 'passkey' && (
        <div className="space-y-6 animate-fade-in">
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/90 shadow-sm space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-5">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-600 flex items-center justify-center shrink-0 shadow-inner">
                  <KeyRound className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-slate-900">Admin Passkey Management</h2>
                  <p className="text-xs text-slate-500">
                    Control security credentials for unlocking the administrative management portal.
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className={`px-3 py-1 rounded-full text-xs font-bold border ${
                  isCustomPasskeyActive
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                    : 'bg-blue-50 text-blue-700 border-blue-200'
                }`}>
                  {isCustomPasskeyActive ? '● Custom Passkey Active' : '● Default Passkey (PET-ADMIN-2026)'}
                </span>
              </div>
            </div>

            {/* Status alerts */}
            {passkeyStatusMsg && (
              <div className={`p-4 rounded-2xl text-xs flex items-center gap-2.5 animate-fade-in ${
                passkeyStatusMsg.type === 'success'
                  ? 'bg-emerald-50 border border-emerald-200 text-emerald-800'
                  : 'bg-rose-50 border border-rose-200 text-rose-800'
              }`}>
                {passkeyStatusMsg.type === 'success' ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                ) : (
                  <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0" />
                )}
                <span className="font-semibold">{passkeyStatusMsg.text}</span>
              </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Change Passkey Form Card */}
              <div className="bg-slate-50/70 rounded-2xl p-6 border border-slate-200 space-y-4">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-blue-600" />
                  <h3 className="text-sm font-bold text-slate-900">Change Admin Passkey</h3>
                </div>
                <p className="text-xs text-slate-500">
                  Update your master key to any custom alphanumeric passkey of your choice.
                </p>

                <form onSubmit={handlePasskeyChangeAction} className="space-y-3 pt-1">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Current Admin Passkey
                    </label>
                    <div className="relative">
                      <input
                        type={showCurrentKey ? 'text' : 'password'}
                        required
                        value={currentPasskeyField}
                        onChange={(e) => setCurrentPasskeyField(e.target.value)}
                        placeholder="Enter your current passkey"
                        className="w-full pl-3 pr-10 py-2.5 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono bg-white"
                      />
                      <button
                        type="button"
                        onClick={() => setShowCurrentKey(!showCurrentKey)}
                        className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600"
                      >
                        {showCurrentKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      New Admin Passkey
                    </label>
                    <div className="relative">
                      <input
                        type={showNewKey ? 'text' : 'password'}
                        required
                        value={newPasskeyField}
                        onChange={(e) => setNewPasskeyField(e.target.value)}
                        placeholder="Enter new passkey (min. 5 chars)"
                        className="w-full pl-3 pr-10 py-2.5 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono bg-white"
                      />
                      <button
                        type="button"
                        onClick={() => setShowNewKey(!showNewKey)}
                        className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600"
                      >
                        {showNewKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                    <span className="text-[10px] text-slate-400">At least 5 characters (letters, numbers, or symbols).</span>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Confirm New Admin Passkey
                    </label>
                    <input
                      type={showNewKey ? 'text' : 'password'}
                      required
                      value={confirmPasskeyField}
                      onChange={(e) => setConfirmPasskeyField(e.target.value)}
                      placeholder="Re-enter new passkey"
                      className="w-full px-3 py-2.5 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono bg-white"
                    />
                  </div>

                  <div className="pt-2">
                    <button
                      type="submit"
                      className="w-full py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs transition shadow-md flex items-center justify-center gap-2"
                    >
                      <KeyRound className="w-4 h-4" />
                      <span>Save & Apply New Passkey</span>
                    </button>
                  </div>
                </form>
              </div>

              {/* Passkey Details & Reset Card */}
              <div className="space-y-4">
                {/* Active Key Info Box */}
                <div className="bg-slate-50/70 rounded-2xl p-6 border border-slate-200 space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-amber-500" />
                      <h3 className="text-sm font-bold text-slate-900">Current Security Key Status</h3>
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowActiveKey(!showActiveKey)}
                      className="text-xs text-blue-600 hover:text-blue-800 font-semibold flex items-center gap-1"
                    >
                      {showActiveKey ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      <span>{showActiveKey ? 'Hide' : 'Reveal'}</span>
                    </button>
                  </div>

                  <div className="p-4 rounded-xl bg-slate-900 text-white font-mono text-sm flex items-center justify-between shadow-inner">
                    <span className="tracking-widest">
                      {showActiveKey ? activeAdminPasskey : '••••••••••••'}
                    </span>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-300 uppercase">
                      {isCustomPasskeyActive ? 'Custom Key' : 'Default'}
                    </span>
                  </div>

                  <div className="text-xs text-slate-600 space-y-2">
                    <div className="flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                      <span>Passkey authentication secures the portal without exposing any email IDs.</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                      <span>Case-flexible support: standard casing or uppercase are accepted automatically.</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                      <span>Master recovery: The emergency fallback passkey <code>PET-ADMIN-2026</code> is always recognized.</span>
                    </div>
                  </div>
                </div>

                {/* Reset to Default */}
                {isCustomPasskeyActive && (
                  <div className="p-5 rounded-2xl bg-amber-50/80 border border-amber-200 space-y-2">
                    <h4 className="text-xs font-bold text-amber-900 flex items-center gap-1.5">
                      <RefreshCw className="w-4 h-4 text-amber-600" />
                      <span>Reset to Original Default Passkey</span>
                    </h4>
                    <p className="text-[11px] text-amber-800 leading-relaxed">
                      If you want to revert your custom passkey, you can restore the factory default <code>PET-ADMIN-2026</code> anytime.
                    </p>
                    <button
                      type="button"
                      onClick={handleResetToDefaultAction}
                      className="px-3.5 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold transition shadow-xs flex items-center gap-1.5"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      <span>Reset to Default (PET-ADMIN-2026)</span>
                    </button>
                  </div>
                )}

                {/* Database & Dummy Data Reset Card */}
                <div className="p-5 rounded-2xl bg-rose-50/70 border border-rose-200 space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold text-rose-900 flex items-center gap-1.5">
                      <Trash2 className="w-4 h-4 text-rose-600" />
                      <span>Database & Dummy Data Reset</span>
                    </h4>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-rose-200 text-rose-800">
                      {questions.length} Questions in DB
                    </span>
                  </div>
                  <p className="text-[11px] text-rose-800 leading-relaxed">
                    Permanently delete all sample/dummy questions from the database so you can start with a fresh, clean question bank for your custom JSON imports.
                  </p>
                  <div className="flex flex-wrap items-center gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => setDeleteConfirmModalOpen(true)}
                      className="px-3.5 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition shadow-xs flex items-center gap-1.5"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Delete All Dummy Data ({questions.length})</span>
                    </button>
                    {questions.length === 0 && (
                      <button
                        type="button"
                        onClick={handleSeedDemoAction}
                        disabled={isDeletingData}
                        className="px-3.5 py-1.5 rounded-xl bg-white border border-rose-300 hover:bg-rose-100 text-rose-800 text-xs font-bold transition shadow-xs flex items-center gap-1.5"
                      >
                        <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                        <span>Load Sample Demo Questions</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add / Edit Question Modal */}
      {editModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-sm animate-fade-in">
          <div className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden max-h-[90vh] flex flex-col">
            <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between">
              <h3 className="text-sm font-bold">
                {editingQuestion?.id ? 'Edit Question' : 'Add New Question'}
              </h3>
              <button
                onClick={() => setEditModalOpen(false)}
                className="p-1 rounded-full hover:bg-white/10"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveModal} className="p-4 sm:p-6 space-y-4 overflow-y-auto no-scrollbar flex-1 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Subject</label>
                  <select
                    value={editingQuestion?.subject || ''}
                    onChange={(e) => setEditingQuestion(prev => ({ ...prev, subject: e.target.value }))}
                    className="w-full p-2 rounded-xl border border-slate-300"
                  >
                    {subjects.map(s => (
                      <option key={s.id} value={s.name_en}>{s.name_en}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Topic</label>
                  <input
                    type="text"
                    value={editingQuestion?.topic || ''}
                    onChange={(e) => setEditingQuestion(prev => ({ ...prev, topic: e.target.value }))}
                    placeholder="e.g. UP Geography & Rivers"
                    className="w-full p-2 rounded-xl border border-slate-300"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Question (Hindi)</label>
                <textarea
                  rows={2}
                  value={editingQuestion?.question_hi || ''}
                  onChange={(e) => setEditingQuestion(prev => ({ ...prev, question_hi: e.target.value }))}
                  placeholder="प्रश्न हिंदी में दर्ज करें..."
                  className="w-full p-2 rounded-xl border border-slate-300 font-sans"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Question (English)</label>
                <textarea
                  rows={2}
                  value={editingQuestion?.question_en || ''}
                  onChange={(e) => setEditingQuestion(prev => ({ ...prev, question_en: e.target.value }))}
                  placeholder="Enter question in English..."
                  className="w-full p-2 rounded-xl border border-slate-300"
                />
              </div>

              {/* Options */}
              <div className="space-y-2">
                <label className="block font-semibold text-slate-700">Options (A, B, C, D)</label>
                {['A', 'B', 'C', 'D'].map((letter, optIdx) => (
                  <div key={letter} className="flex items-center gap-2">
                    <span className="w-6 font-bold text-center">{letter}.</span>
                    <input
                      type="text"
                      placeholder={`Option ${letter} (Hindi)`}
                      value={editingQuestion?.options_hi?.[optIdx] || ''}
                      onChange={(e) => {
                        const copy = [...(editingQuestion?.options_hi || ['', '', '', ''])];
                        copy[optIdx] = e.target.value;
                        setEditingQuestion(prev => ({ ...prev, options_hi: copy }));
                      }}
                      className="flex-1 p-2 rounded-xl border border-slate-300"
                    />
                    <input
                      type="text"
                      placeholder={`Option ${letter} (English)`}
                      value={editingQuestion?.options_en?.[optIdx] || ''}
                      onChange={(e) => {
                        const copy = [...(editingQuestion?.options_en || ['', '', '', ''])];
                        copy[optIdx] = e.target.value;
                        setEditingQuestion(prev => ({ ...prev, options_en: copy }));
                      }}
                      className="flex-1 p-2 rounded-xl border border-slate-300"
                    />
                    <label className="flex items-center gap-1 cursor-pointer">
                      <input
                        type="radio"
                        name="correct_option"
                        checked={editingQuestion?.correct_option === optIdx}
                        onChange={() => setEditingQuestion(prev => ({ ...prev, correct_option: optIdx }))}
                      />
                      <span className="text-[10px] text-emerald-700 font-bold">Correct</span>
                    </label>
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Difficulty</label>
                  <select
                    value={editingQuestion?.difficulty || 'medium'}
                    onChange={(e) => setEditingQuestion(prev => ({ ...prev, difficulty: e.target.value as any }))}
                    className="w-full p-2 rounded-xl border border-slate-300 capitalize"
                  >
                    <option value="easy">Easy</option>
                    <option value="medium">Medium</option>
                    <option value="hard">Hard</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Detailed Explanation (व्याख्या)</label>
                <textarea
                  rows={2}
                  value={editingQuestion?.explanation_hi || editingQuestion?.explanation_en || ''}
                  onChange={(e) => setEditingQuestion(prev => ({ ...prev, explanation_hi: e.target.value, explanation_en: e.target.value }))}
                  placeholder="Explain why the answer is correct..."
                  className="w-full p-2 rounded-xl border border-slate-300"
                />
              </div>

              <div className="pt-3 flex justify-end gap-2 border-t">
                <button
                  type="button"
                  onClick={() => setEditModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-700 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold"
                >
                  Save Question
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Change Passkey Quick Modal */}
      {renderChangeKeyModal()}

      {/* Delete All / Dummy Data Confirmation Modal */}
      {renderDeleteConfirmModal()}
    </div>
  );
};

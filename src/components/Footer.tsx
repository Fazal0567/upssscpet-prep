import React from 'react';
import { BookOpen, ShieldCheck, Award, HelpCircle } from 'lucide-react';

interface FooterProps {
  setActiveTab: (tab: string) => void;
}

export const Footer: React.FC<FooterProps> = ({ setActiveTab }) => {
  return (
    <footer className="bg-slate-900 border-t border-slate-800 text-slate-400 text-xs pb-20 lg:pb-0">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand Info */}
          <div className="md:col-span-1 space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white font-bold">
                <BookOpen className="w-4 h-4" />
              </div>
              <span className="text-white font-bold text-base">PET Prep</span>
            </div>
            <p className="text-slate-400 text-xs leading-relaxed">
              Smart Exam Practice portal engineered for Uttar Pradesh Subordinate Services Selection Commission (UPSSSC) PET aspirants.
            </p>
            <div className="flex items-center gap-2 text-[11px] text-blue-400 font-medium">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Bilingual Hindi & English Question Bank</span>
            </div>
          </div>

          {/* Exam Structure */}
          <div className="space-y-2">
            <h4 className="text-white font-semibold text-xs tracking-wider uppercase">Exam Pattern (PET)</h4>
            <ul className="space-y-1.5 text-[11px] text-slate-300">
              <li className="flex justify-between border-b border-slate-800 pb-1">
                <span>Total Questions:</span>
                <span className="font-semibold text-white">100 MCQs</span>
              </li>
              <li className="flex justify-between border-b border-slate-800 pb-1">
                <span>Maximum Marks:</span>
                <span className="font-semibold text-white">100 Marks</span>
              </li>
              <li className="flex justify-between border-b border-slate-800 pb-1">
                <span>Exam Duration:</span>
                <span className="font-semibold text-white">120 Minutes</span>
              </li>
              <li className="flex justify-between border-b border-slate-800 pb-1 text-amber-400">
                <span>Negative Marking:</span>
                <span className="font-semibold">-0.25 (1/4th)</span>
              </li>
            </ul>
          </div>

          {/* Practice Modules */}
          <div className="space-y-2">
            <h4 className="text-white font-semibold text-xs tracking-wider uppercase">Study Modules</h4>
            <ul className="space-y-1.5 text-slate-300">
              <li>
                <button onClick={() => setActiveTab('practice')} className="hover:text-blue-400 transition">
                  • Topic-Wise MCQ Practice
                </button>
              </li>
              <li>
                <button onClick={() => setActiveTab('mocktest')} className="hover:text-blue-400 transition">
                  • Real Exam Mock Test (Timed)
                </button>
              </li>
              <li>
                <button onClick={() => setActiveTab('flashcards')} className="hover:text-blue-400 transition">
                  • Interactive 3D Flashcards
                </button>
              </li>
              <li>
                <button onClick={() => setActiveTab('bookmarks')} className="hover:text-blue-400 transition">
                  • Saved Bookmarks & Revisions
                </button>
              </li>
              <li>
                <button onClick={() => setActiveTab('analytics')} className="hover:text-blue-400 transition">
                  • Performance & Accuracy Insights
                </button>
              </li>
            </ul>
          </div>

          {/* Admin & Integrity */}
          <div className="space-y-2">
            <h4 className="text-white font-semibold text-xs tracking-wider uppercase">Question Bank Engine</h4>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Equipped with high-scale JSON import system capable of validating, deduplicating, and storing 1,000+ questions securely on Cloud Firestore.
            </p>
            <div className="pt-2">
              <button
                onClick={() => setActiveTab('admin')}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-750 text-amber-400 border border-slate-700 text-xs font-medium"
              >
                <Award className="w-3.5 h-3.5" />
                <span>Admin JSON Import Portal</span>
              </button>
            </div>
          </div>
        </div>

        <div className="mt-8 pt-6 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between text-[11px] text-slate-500 gap-2">
          <p>© {new Date().getFullYear()} PET Prep – Smart Exam Practice. Designed for UPSSSC Aspirants.</p>
          <div className="flex items-center gap-4">
            <span>UP GK • History • Polity • Geography • Science</span>
          </div>
        </div>
      </div>
    </footer>
  );
};

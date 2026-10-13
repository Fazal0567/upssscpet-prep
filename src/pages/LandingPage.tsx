import React from 'react';
import {
  BookOpen,
  Timer,
  CheckCircle2,
  Layers,
  Award,
  ArrowRight,
  Sparkles,
  ShieldCheck,
  TrendingUp,
  RotateCcw,
  Languages,
  ChevronRight
} from 'lucide-react';
import { SubjectItem } from '../types';

interface LandingPageProps {
  subjects: SubjectItem[];
  onStart: (tab: string, meta?: any) => void;
  openAuthModal: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ subjects, onStart, openAuthModal }) => {
  return (
    <div className="space-y-16 pb-16 animate-fade-in">
      {/* Hero Section */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-950 via-blue-950 to-indigo-950 text-white p-8 sm:p-14 shadow-2xl border border-blue-900/50">
        <div className="absolute top-0 right-0 -mt-20 -mr-20 w-96 h-96 bg-blue-500/15 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 max-w-3xl space-y-5">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-500/20 text-blue-300 text-xs font-bold border border-blue-400/30">
            <Sparkles className="w-3.5 h-3.5 text-blue-400" />
            <span>Target 85+ Percentile in UPSSSC PET 2026</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight leading-tight text-white">
            Smart, Bilingual Exam Practice for <span className="bg-gradient-to-r from-blue-400 via-indigo-300 to-amber-300 bg-clip-text text-transparent">UPSSSC PET</span>
          </h1>

          <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
            Master the official Preliminary Eligibility Test syllabus with instant Hindi & English explanations, timed mock tests with authentic -0.25 negative marking, and 3D spaced repetition flashcards.
          </p>

          <div className="flex flex-wrap items-center gap-4 pt-2">
            <button
              onClick={() => onStart('dashboard')}
              className="flex items-center gap-2 px-6 py-3.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm transition shadow-xl shadow-blue-600/30 transform hover:-translate-y-0.5"
            >
              <span>Explore Dashboard</span>
              <ArrowRight className="w-4 h-4" />
            </button>
            <button
              onClick={() => onStart('mocktest')}
              className="flex items-center gap-2 px-6 py-3.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-sm border border-white/20 transition backdrop-blur"
            >
              <Timer className="w-4 h-4 text-amber-400" />
              <span>Take Live Mock Test</span>
            </button>
          </div>

          {/* Quick trust metrics */}
          <div className="pt-6 border-t border-white/10 flex flex-wrap items-center gap-6 text-xs text-slate-300">
            <div className="flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>100% Official Syllabus Aligned</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Languages className="w-4 h-4 text-blue-400" />
              <span>Full Hindi & English Bilingual Text</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Timer className="w-4 h-4 text-amber-400" />
              <span>Official 0.25 Negative Marking Logic</span>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Highlights Grid */}
      <section className="space-y-6">
        <div className="text-center max-w-xl mx-auto space-y-2">
          <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">Everything You Need to Clear PET</h2>
          <p className="text-xs text-slate-500">Engineered with high pedagogical standards for serious government job aspirants.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-2xl p-6 border border-slate-200/90 shadow-sm hover:shadow-md transition space-y-3">
            <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-900">Topic-by-Topic MCQ Practice</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Drill down into specific chapters like UP Geography, Freedom Movement, and Indian Polity. Get immediate solutions with detailed conceptual explanations.
            </p>
            <button
              onClick={() => onStart('practice')}
              className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1 pt-2"
            >
              <span>Start Practice</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="bg-white rounded-2xl p-6 border border-slate-200/90 shadow-sm hover:shadow-md transition space-y-3">
            <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Timer className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-900">Real Exam Mock Test Engine</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Simulate actual UPSSSC PET conditions with custom timers, question navigation palette, mark-for-review, and auto-computed negative scoring.
            </p>
            <button
              onClick={() => onStart('mocktest')}
              className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1 pt-2"
            >
              <span>Launch Mock Exam</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="bg-white rounded-2xl p-6 border border-slate-200/90 shadow-sm hover:shadow-md transition space-y-3">
            <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <Layers className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-900">Spaced Repetition Flashcards</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Quickly memorize dates, dynasties, districts, and constitutional articles using interactive 3D flip cards with easy, medium, and hard recall ratings.
            </p>
            <button
              onClick={() => onStart('flashcards')}
              className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1 pt-2"
            >
              <span>Review Flashcards</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </section>

      {/* Official Syllabus Subjects Grid */}
      <section className="bg-white rounded-3xl p-8 border border-slate-200/90 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b pb-4">
          <div>
            <h2 className="text-lg font-bold text-slate-900">UPSSSC PET Official Syllabus Sections</h2>
            <p className="text-xs text-slate-500">Pick any subject to begin targeted practice instantly</p>
          </div>
          <button
            onClick={() => onStart('practice')}
            className="text-xs font-bold text-blue-600 hover:underline"
          >
            Practice All Subjects →
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {subjects.map((sub) => (
            <div
              key={sub.id}
              onClick={() => onStart('practice', { subject: sub.name_en })}
              className="group p-5 rounded-2xl border border-slate-200 hover:border-blue-400 bg-slate-50/60 hover:bg-white transition cursor-pointer flex flex-col justify-between"
            >
              <div>
                <span className="text-xs font-bold text-slate-900 group-hover:text-blue-600 transition block mb-1">
                  {sub.name_en}
                </span>
                <span className="text-[11px] text-slate-500 block mb-2">{sub.name_hi}</span>
                <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">{sub.description}</p>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-200/60 flex items-center justify-between text-[11px] font-semibold text-blue-600">
                <span>Start Practice</span>
                <ChevronRight className="w-3.5 h-3.5 transform group-hover:translate-x-1 transition" />
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};

import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  CartesianGrid,
  Legend
} from 'recharts';
import { BarChart3, TrendingUp, Award, Target, BookOpen, AlertTriangle } from 'lucide-react';
import { Question, SubjectItem, UserAttempt, QuizResult } from '../types';

interface AnalyticsProps {
  questions: Question[];
  subjects: SubjectItem[];
  userAttempts: UserAttempt[];
  quizResults: QuizResult[];
}

export const Analytics: React.FC<AnalyticsProps> = ({
  questions,
  subjects,
  userAttempts,
  quizResults
}) => {
  // 1. Subject-Wise Data
  const subjectChartData = subjects.map(s => {
    const sAttempts = userAttempts.filter(a => a.subject.toLowerCase() === s.name_en.toLowerCase());
    const correct = sAttempts.filter(a => a.isCorrect).length;
    const accuracy = sAttempts.length > 0 ? Math.round((correct / sAttempts.length) * 100) : 0;
    return {
      name: s.name_en.replace('Indian ', '').replace('Uttar Pradesh ', 'UP '),
      fullName: s.name_en,
      attempts: sAttempts.length,
      correct,
      accuracy
    };
  });

  // 2. Score Trend (from quizResults, chronological order)
  const scoreTrendData = [...quizResults]
    .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
    .slice(-8)
    .map((q, idx) => ({
      testName: `Test ${idx + 1}`,
      score: q.score,
      maxScore: q.maxScore,
      accuracy: q.accuracy
    }));

  // 3. Overall Pie Chart Data
  const correctCount = userAttempts.filter(a => a.isCorrect).length;
  const incorrectCount = userAttempts.filter(a => !a.isCorrect).length;

  const pieData = [
    { name: 'Correct Answers', value: correctCount, color: '#10B981' },
    { name: 'Incorrect Answers', value: incorrectCount, color: '#F43F5E' }
  ];

  // 4. Difficulty Breakdown
  const diffData = (['easy', 'medium', 'hard'] as const).map(diff => {
    const dAttempts = userAttempts.filter(a => a.difficulty === diff);
    const dCorrect = dAttempts.filter(a => a.isCorrect).length;
    const acc = dAttempts.length > 0 ? Math.round((dCorrect / dAttempts.length) * 100) : 0;
    return {
      difficulty: diff.toUpperCase(),
      total: dAttempts.length,
      accuracy: acc
    };
  });

  // Find lowest accuracy subject for targeted advice
  const subjectsWithAttempts = subjectChartData.filter(s => s.attempts >= 2);
  const weakestSubject = subjectsWithAttempts.length > 0
    ? [...subjectsWithAttempts].sort((a, b) => a.accuracy - b.accuracy)[0]
    : null;

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-12 animate-fade-in">
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/90 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-blue-600" />
            <h1 className="text-xl font-extrabold text-slate-900">Performance Analytics</h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">Deep visual insights across all attempts, accuracy rates, and syllabus subjects</p>
        </div>

        {weakestSubject && (
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-3 flex items-center gap-2.5 max-w-sm">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
            <div className="text-xs text-amber-900">
              <span className="font-bold">Focus Needed: </span>
              Your accuracy in <b>{weakestSubject.fullName}</b> is {weakestSubject.accuracy}%. Consider focused revision.
            </div>
          </div>
        )}
      </div>

      {/* Main Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Subject-Wise Accuracy Bar Chart */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200/90 shadow-sm space-y-4">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Subject-Wise Accuracy (%)</h3>
            <p className="text-xs text-slate-500">Percentage of questions answered correctly per subject</p>
          </div>

          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={subjectChartData} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#64748B' }} angle={-25} textAnchor="end" />
                <YAxis domain={[0, 100]} tick={{ fontSize: 10, fill: '#64748B' }} />
                <Tooltip
                  formatter={(val: any) => [`${val}%`, 'Accuracy']}
                  contentStyle={{ borderRadius: '12px', border: '1px solid #CBD5E1', fontSize: '12px' }}
                />
                <Bar dataKey="accuracy" fill="#3B82F6" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Mock Test Score Trend Line Chart */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200/90 shadow-sm space-y-4">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Mock Test Score Trend</h3>
            <p className="text-xs text-slate-500">Progression across your latest timed tests</p>
          </div>

          <div className="h-64">
            {scoreTrendData.length === 0 ? (
              <div className="h-full flex items-center justify-center text-xs text-slate-400">
                Complete at least one mock test to see your score trajectory.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={scoreTrendData} margin={{ top: 10, right: 10, left: -20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                  <XAxis dataKey="testName" tick={{ fontSize: 11, fill: '#64748B' }} />
                  <YAxis tick={{ fontSize: 11, fill: '#64748B' }} />
                  <Tooltip
                    contentStyle={{ borderRadius: '12px', border: '1px solid #CBD5E1', fontSize: '12px' }}
                  />
                  <Line type="monotone" dataKey="score" stroke="#2563EB" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} name="Score" />
                  <Line type="monotone" dataKey="accuracy" stroke="#10B981" strokeWidth={2} strokeDasharray="4 4" name="Accuracy %" />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Correct vs Incorrect Ratio */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200/90 shadow-sm space-y-4">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Total Attempts Accuracy Breakdown</h3>
            <p className="text-xs text-slate-500">Overall ratio of correct to incorrect answers</p>
          </div>

          <div className="h-64 flex flex-col sm:flex-row items-center justify-center gap-6">
            {userAttempts.length === 0 ? (
              <div className="text-xs text-slate-400">No question attempts recorded yet.</div>
            ) : (
              <>
                <div className="w-48 h-48">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={pieData}
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={80}
                        paddingAngle={4}
                        dataKey="value"
                      >
                        {pieData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip contentStyle={{ borderRadius: '12px', fontSize: '12px' }} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>

                <div className="space-y-2 text-xs">
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-emerald-500" />
                    <span className="font-medium text-slate-700">Correct: {correctCount} ({userAttempts.length ? Math.round((correctCount / userAttempts.length) * 100) : 0}%)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-rose-500" />
                    <span className="font-medium text-slate-700">Incorrect: {incorrectCount} ({userAttempts.length ? Math.round((incorrectCount / userAttempts.length) * 100) : 0}%)</span>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Difficulty Level Breakdown */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200/90 shadow-sm space-y-4">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Difficulty Level Performance</h3>
            <p className="text-xs text-slate-500">Accuracy separated by question difficulty</p>
          </div>

          <div className="space-y-4 pt-2">
            {diffData.map(item => (
              <div key={item.difficulty} className="space-y-1.5">
                <div className="flex items-center justify-between text-xs font-semibold">
                  <span className="text-slate-800">{item.difficulty} ({item.total} Qs Attempted)</span>
                  <span className="text-blue-600">{item.accuracy}%</span>
                </div>
                <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      item.accuracy >= 70 ? 'bg-emerald-500' : item.accuracy >= 40 ? 'bg-amber-500' : 'bg-rose-500'
                    }`}
                    style={{ width: `${item.accuracy}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

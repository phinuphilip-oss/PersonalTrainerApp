import React, { useMemo, useState } from 'react';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { Plus } from 'lucide-react';
import { BodyWeightEntry, CompletedWorkoutLog, UserProfile } from '../types';
import { displayToKg, formatDateShort, formatVolume, getTodayISO, kgToDisplay } from '../utils/calculations';

interface ProgressViewProps {
  profile: UserProfile;
  workoutLogs: CompletedWorkoutLog[];
  weightHistory: BodyWeightEntry[];
  onLogWeight: (weightKg: number, date: string) => void;
}

export const ProgressView: React.FC<ProgressViewProps> = ({
  profile,
  workoutLogs,
  weightHistory,
  onLogWeight,
}) => {
  const [newWeight, setNewWeight] = useState(String(kgToDisplay(profile.weightKg, profile.unit)));

  const sortedLogs = useMemo(
    () => [...workoutLogs].sort((a, b) => a.date.localeCompare(b.date)),
    [workoutLogs]
  );

  const sortedWeights = useMemo(
    () => [...weightHistory].sort((a, b) => a.date.localeCompare(b.date)),
    [weightHistory]
  );

  const volumeChartData = useMemo(
    () =>
      sortedLogs.map((log) => ({
        dateLabel: formatDateShort(log.date),
        volume: Math.round(kgToDisplay(log.totalVolumeKg, profile.unit)),
        dayTitle: log.dayTitle,
      })),
    [sortedLogs, profile.unit]
  );

  const weightChartData = useMemo(
    () =>
      sortedWeights.map((entry) => ({
        dateLabel: formatDateShort(entry.date),
        weight: kgToDisplay(entry.weightKg, profile.unit),
      })),
    [sortedWeights, profile.unit]
  );

  const totalVolumeKg = useMemo(
    () => workoutLogs.reduce((sum, l) => sum + l.totalVolumeKg, 0),
    [workoutLogs]
  );

  const avgDuration = useMemo(() => {
    if (workoutLogs.length === 0) return 0;
    return Math.round(
      workoutLogs.reduce((sum, l) => sum + l.durationMinutes, 0) / workoutLogs.length
    );
  }, [workoutLogs]);

  const weightDelta = useMemo(() => {
    if (sortedWeights.length < 2) return 0;
    const first = kgToDisplay(sortedWeights[0].weightKg, profile.unit);
    const last = kgToDisplay(sortedWeights[sortedWeights.length - 1].weightKg, profile.unit);
    return Math.round((last - first) * 10) / 10;
  }, [sortedWeights, profile.unit]);

  const handleWeightSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = parseFloat(newWeight);
    if (Number.isNaN(parsed) || parsed <= 0) return;
    onLogWeight(displayToKg(parsed, profile.unit), getTodayISO());
  };

  return (
    <div className="space-y-6">
      <header>
        <p className="text-xs text-slate-400">
          Training Analytics · Persisted locally across sessions
        </p>
        <h1 className="font-display text-3xl sm:text-4xl font-bold tracking-tight text-white mt-0.5">
          Progress & Analytics
        </h1>
      </header>

      {/* Top KPI Strip */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-xl bg-[#11161D] border border-white/[0.08] p-4 sm:p-5">
          <p className="text-xs text-slate-400">Workouts Completed</p>
          <p className="font-mono text-2xl sm:text-3xl font-semibold text-white tabular-nums mt-1">
            {workoutLogs.length}
          </p>
          <p className="text-xs text-slate-500 mt-1">Avg {avgDuration} min / session</p>
        </div>

        <div className="rounded-xl bg-[#11161D] border border-white/[0.08] p-4 sm:p-5">
          <p className="text-xs text-slate-400">Total Volume Lifted</p>
          <p className="font-mono text-2xl sm:text-3xl font-semibold text-[#B8FF2C] tabular-nums mt-1">
            {formatVolume(totalVolumeKg, profile.unit)}
          </p>
          <p className="text-xs text-slate-500 mt-1">Cumulative tonnage logged</p>
        </div>

        <div className="rounded-xl bg-[#11161D] border border-white/[0.08] p-4 sm:p-5">
          <p className="text-xs text-slate-400">Current Body Weight</p>
          <p className="font-mono text-2xl sm:text-3xl font-semibold text-white tabular-nums mt-1">
            {kgToDisplay(profile.weightKg, profile.unit)}{' '}
            <span className="text-sm font-normal text-slate-500">{profile.unit}</span>
          </p>
          <p className="text-xs text-slate-500 mt-1 font-mono tabular-nums">
            {weightDelta >= 0 ? `+${weightDelta}` : weightDelta} {profile.unit} vs. baseline
          </p>
        </div>

        <div className="rounded-xl bg-[#11161D] border border-white/[0.08] p-4 sm:p-5">
          <p className="text-xs text-slate-400">Active Goal</p>
          <p className="font-display text-2xl sm:text-3xl font-bold text-white mt-1">
            {profile.goal}
          </p>
          <p className="text-xs text-slate-500 mt-1">
            {profile.daysPerWeek} days/week · {profile.fitnessLevel}
          </p>
        </div>
      </section>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Volume Lifted Chart */}
        <section className="rounded-xl bg-[#11161D] border border-white/[0.08] p-5 space-y-4">
          <div className="flex items-baseline justify-between gap-2">
            <div>
              <h2 className="font-display text-2xl font-bold tracking-wide text-white">
                Session Volume Lifted
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Total working tonnage ({profile.unit}) per completed workout
              </p>
            </div>
          </div>

          {volumeChartData.length === 0 ? (
            <div className="h-64 flex items-center justify-center text-sm text-slate-500">
              Complete your first workout to populate volume trends.
            </div>
          ) : (
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={volumeChartData} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" vertical={false} />
                  <XAxis
                    dataKey="dateLabel"
                    stroke="#64748B"
                    fontSize={11}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    stroke="#64748B"
                    fontSize={11}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(v) => `${Math.round(v / 1000)}k`}
                  />
                  <Tooltip
                    cursor={{ fill: 'rgba(255,255,255,0.04)' }}
                    contentStyle={{
                      backgroundColor: '#090C10',
                      border: '1px solid rgba(255,255,255,0.12)',
                      borderRadius: '10px',
                      fontSize: '12px',
                      color: '#F1F5F9',
                    }}
                    formatter={(value: unknown) => [`${Number(value).toLocaleString()} ${profile.unit}`, 'Volume']}
                  />
                  <Bar dataKey="volume" fill="#B8FF2C" radius={[6, 6, 0, 0]} maxBarSize={36} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </section>

        {/* Body Weight Trend Chart + Quick Log */}
        <section className="rounded-xl bg-[#11161D] border border-white/[0.08] p-5 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="font-display text-2xl font-bold tracking-wide text-white">
                Body Weight Trend
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Log morning weigh-ins ({profile.unit})
              </p>
            </div>

            <form onSubmit={handleWeightSubmit} className="flex items-center gap-2 shrink-0">
              <input
                type="number"
                step="0.1"
                min={30}
                max={450}
                aria-label={`Today's weight in ${profile.unit}`}
                value={newWeight}
                onChange={(e) => setNewWeight(e.target.value)}
                className="h-10 w-24 rounded-lg bg-[#090C10] border border-white/[0.10] px-3 font-mono text-xs text-white tabular-nums focus:border-[#38BDF8] focus:outline-none"
              />
              <button
                type="submit"
                className="h-10 px-3 rounded-lg bg-white/[0.08] hover:bg-white/[0.14] text-white text-xs font-semibold inline-flex items-center gap-1 transition-colors whitespace-nowrap shrink-0"
              >
                <Plus className="h-3.5 w-3.5 text-[#38BDF8]" />
                Log
              </button>
            </form>
          </div>

          {weightChartData.length === 0 ? (
            <div className="h-64 flex items-center justify-center text-sm text-slate-500">
              Log your first weigh-in above to track body weight trends.
            </div>
          ) : (
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={weightChartData} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
                  <defs>
                    <linearGradient id="weightAreaGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#38BDF8" stopOpacity={0.28} />
                      <stop offset="95%" stopColor="#38BDF8" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" vertical={false} />
                  <XAxis
                    dataKey="dateLabel"
                    stroke="#64748B"
                    fontSize={11}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    stroke="#64748B"
                    fontSize={11}
                    tickLine={false}
                    axisLine={false}
                    domain={['dataMin - 1', 'dataMax + 1']}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#090C10',
                      border: '1px solid rgba(255,255,255,0.12)',
                      borderRadius: '10px',
                      fontSize: '12px',
                      color: '#F1F5F9',
                    }}
                    formatter={(value: unknown) => [`${value} ${profile.unit}`, 'Weight']}
                  />
                  <Area
                    type="monotone"
                    dataKey="weight"
                    stroke="#38BDF8"
                    strokeWidth={2}
                    fill="url(#weightAreaGrad)"
                    dot={{ r: 3, fill: '#38BDF8', strokeWidth: 0 }}
                    activeDot={{ r: 5, fill: '#38BDF8' }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}
        </section>
      </div>

      {/* Recent Workout History Table */}
      <section className="rounded-xl bg-[#11161D] border border-white/[0.08] overflow-hidden">
        <div className="px-5 py-4 border-b border-white/[0.06]">
          <h2 className="font-display text-2xl font-bold tracking-wide text-white">
            Completed Session History
          </h2>
        </div>

        {sortedLogs.length === 0 ? (
          <div className="p-8 text-center text-sm text-slate-500">
            No completed sessions logged yet. Finish a workout in Today&apos;s Workout to record it here.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-white/[0.06] text-[11px] font-medium text-slate-500">
                  <th className="py-3 px-5">Date</th>
                  <th className="py-3 px-5">Session</th>
                  <th className="py-3 px-5 text-right">Sets</th>
                  <th className="py-3 px-5 text-right">Duration</th>
                  <th className="py-3 px-5 text-right">Volume</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.05] text-sm">
                {[...sortedLogs].reverse().map((log) => (
                  <tr key={log.id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="py-3.5 px-5 font-mono text-xs text-slate-400 tabular-nums whitespace-nowrap">
                      {formatDateShort(log.date)}
                    </td>
                    <td className="py-3.5 px-5">
                      <p className="font-medium text-white">{log.dayTitle}</p>
                      <p className="text-xs text-slate-500">{log.focus}</p>
                    </td>
                    <td className="py-3.5 px-5 text-right font-mono text-xs text-slate-300 tabular-nums whitespace-nowrap">
                      {log.completedSets}/{log.totalSets}
                    </td>
                    <td className="py-3.5 px-5 text-right font-mono text-xs text-slate-300 tabular-nums whitespace-nowrap">
                      {log.durationMinutes} min
                    </td>
                    <td className="py-3.5 px-5 text-right font-mono text-xs font-semibold text-[#B8FF2C] tabular-nums whitespace-nowrap">
                      {formatVolume(log.totalVolumeKg, profile.unit)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
};

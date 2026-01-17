import { useMemo } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
} from 'recharts';
import { useProjectStore } from '../store/projectStore';
import type { Project } from '../types';

/**
 * Format bytes to human readable string
 */
function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * Calculate BPM distribution from projects
 */
function calculateBpmDistribution(projects: Project[]): { bpm: string; count: number }[] {
  const buckets: Record<string, number> = {};

  // Create buckets for BPM ranges (60-70, 70-80, ..., 170-180, 180+)
  for (let i = 60; i <= 180; i += 10) {
    buckets[`${i}-${i + 10}`] = 0;
  }

  projects.forEach((project) => {
    if (project.bpm !== null) {
      const bpm = Math.floor(project.bpm / 10) * 10;
      if (bpm < 60) {
        buckets['60-70'] = (buckets['60-70'] || 0) + 1;
      } else if (bpm >= 180) {
        buckets['180-190'] = (buckets['180-190'] || 0) + 1;
      } else {
        const key = `${bpm}-${bpm + 10}`;
        buckets[key] = (buckets[key] || 0) + 1;
      }
    }
  });

  return Object.entries(buckets)
    .map(([bpm, count]) => ({ bpm, count }))
    .filter((item) => item.count > 0);
}

/**
 * Calculate track count distribution from projects
 */
function calculateTrackDistribution(projects: Project[]): { tracks: string; count: number }[] {
  const buckets: Record<string, number> = {
    '1-5': 0,
    '6-10': 0,
    '11-20': 0,
    '21-30': 0,
    '31-50': 0,
    '50+': 0,
  };

  projects.forEach((project) => {
    const tracks = project.trackCount;
    if (tracks <= 5) buckets['1-5']++;
    else if (tracks <= 10) buckets['6-10']++;
    else if (tracks <= 20) buckets['11-20']++;
    else if (tracks <= 30) buckets['21-30']++;
    else if (tracks <= 50) buckets['31-50']++;
    else buckets['50+']++;
  });

  return Object.entries(buckets)
    .map(([tracks, count]) => ({ tracks, count }))
    .filter((item) => item.count > 0);
}

/**
 * Calculate most used plugins from projects (top 10)
 */
function calculatePluginUsage(projects: Project[]): { plugin: string; count: number }[] {
  const pluginCounts: Record<string, number> = {};

  projects.forEach((project) => {
    project.plugins.forEach((plugin) => {
      pluginCounts[plugin] = (pluginCounts[plugin] || 0) + 1;
    });
  });

  return Object.entries(pluginCounts)
    .map(([plugin, count]) => ({ plugin, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);
}

/**
 * Calculate projects over time (by creation month)
 */
function calculateProjectsOverTime(projects: Project[]): { month: string; count: number }[] {
  const monthCounts: Record<string, number> = {};

  projects.forEach((project) => {
    const date = new Date(project.createdAt);
    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    monthCounts[monthKey] = (monthCounts[monthKey] || 0) + 1;
  });

  return Object.entries(monthCounts)
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([month, count]) => ({ month, count }));
}

/**
 * Dashboard component displaying analytics and statistics
 */
export function Dashboard() {
  const projects = useProjectStore((state) => state.projects);

  const stats = useMemo(() => {
    const totalProjects = projects.length;
    const totalSize = projects.reduce((sum, p) => sum + p.fileSize, 0);
    const bpmDistribution = calculateBpmDistribution(projects);
    const trackDistribution = calculateTrackDistribution(projects);
    const pluginUsage = calculatePluginUsage(projects);
    const projectsOverTime = calculateProjectsOverTime(projects);

    return {
      totalProjects,
      totalSize,
      bpmDistribution,
      trackDistribution,
      pluginUsage,
      projectsOverTime,
    };
  }, [projects]);

  // Empty state
  if (projects.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full py-16 px-4">
        <div className="text-gray-400 text-center">
          <svg
            className="w-16 h-16 mx-auto mb-4 text-gray-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
            />
          </svg>
          <h3 className="text-xl font-semibold mb-2">No Projects Yet</h3>
          <p className="text-gray-500 max-w-sm">
            Add a folder containing Ableton projects to see analytics and statistics about your library.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 overflow-auto">
      {/* Summary Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-gray-800 rounded-lg p-4">
          <h3 className="text-gray-400 text-sm font-medium uppercase tracking-wider">
            Total Projects
          </h3>
          <p className="text-3xl font-bold text-white mt-1">
            {stats.totalProjects}
          </p>
        </div>
        <div className="bg-gray-800 rounded-lg p-4">
          <h3 className="text-gray-400 text-sm font-medium uppercase tracking-wider">
            Total Size
          </h3>
          <p className="text-3xl font-bold text-white mt-1">
            {formatBytes(stats.totalSize)}
          </p>
        </div>
        <div className="bg-gray-800 rounded-lg p-4">
          <h3 className="text-gray-400 text-sm font-medium uppercase tracking-wider">
            Avg BPM
          </h3>
          <p className="text-3xl font-bold text-white mt-1">
            {projects.filter((p) => p.bpm !== null).length > 0
              ? Math.round(
                  projects
                    .filter((p) => p.bpm !== null)
                    .reduce((sum, p) => sum + (p.bpm || 0), 0) /
                    projects.filter((p) => p.bpm !== null).length
                )
              : '-'}
          </p>
        </div>
        <div className="bg-gray-800 rounded-lg p-4">
          <h3 className="text-gray-400 text-sm font-medium uppercase tracking-wider">
            Unique Plugins
          </h3>
          <p className="text-3xl font-bold text-white mt-1">
            {new Set(projects.flatMap((p) => p.plugins)).size}
          </p>
        </div>
      </div>

      {/* BPM Distribution */}
      <div className="bg-gray-800 rounded-lg p-4">
        <h3 className="text-white text-lg font-semibold mb-4">BPM Distribution</h3>
        {stats.bpmDistribution.length > 0 ? (
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={stats.bpmDistribution}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis
                dataKey="bpm"
                stroke="#9ca3af"
                tick={{ fill: '#9ca3af', fontSize: 12 }}
              />
              <YAxis stroke="#9ca3af" tick={{ fill: '#9ca3af', fontSize: 12 }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#1f2937',
                  border: '1px solid #374151',
                  borderRadius: '8px',
                }}
                labelStyle={{ color: '#f3f4f6' }}
                itemStyle={{ color: '#60a5fa' }}
              />
              <Bar dataKey="count" fill="#3b82f6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <p className="text-gray-500 text-center py-8">No BPM data available</p>
        )}
      </div>

      {/* Track Count Distribution */}
      <div className="bg-gray-800 rounded-lg p-4">
        <h3 className="text-white text-lg font-semibold mb-4">Track Count Distribution</h3>
        {stats.trackDistribution.length > 0 ? (
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={stats.trackDistribution}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis
                dataKey="tracks"
                stroke="#9ca3af"
                tick={{ fill: '#9ca3af', fontSize: 12 }}
              />
              <YAxis stroke="#9ca3af" tick={{ fill: '#9ca3af', fontSize: 12 }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#1f2937',
                  border: '1px solid #374151',
                  borderRadius: '8px',
                }}
                labelStyle={{ color: '#f3f4f6' }}
                itemStyle={{ color: '#10b981' }}
              />
              <Bar dataKey="count" fill="#10b981" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <p className="text-gray-500 text-center py-8">No track count data available</p>
        )}
      </div>

      {/* Most Used Plugins */}
      <div className="bg-gray-800 rounded-lg p-4">
        <h3 className="text-white text-lg font-semibold mb-4">Most Used Plugins (Top 10)</h3>
        {stats.pluginUsage.length > 0 ? (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={stats.pluginUsage} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis
                type="number"
                stroke="#9ca3af"
                tick={{ fill: '#9ca3af', fontSize: 12 }}
              />
              <YAxis
                type="category"
                dataKey="plugin"
                stroke="#9ca3af"
                tick={{ fill: '#9ca3af', fontSize: 12 }}
                width={150}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#1f2937',
                  border: '1px solid #374151',
                  borderRadius: '8px',
                }}
                labelStyle={{ color: '#f3f4f6' }}
                itemStyle={{ color: '#f59e0b' }}
              />
              <Bar dataKey="count" fill="#f59e0b" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <p className="text-gray-500 text-center py-8">No plugin data available</p>
        )}
      </div>

      {/* Projects Over Time */}
      <div className="bg-gray-800 rounded-lg p-4">
        <h3 className="text-white text-lg font-semibold mb-4">Projects Over Time</h3>
        {stats.projectsOverTime.length > 0 ? (
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={stats.projectsOverTime}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis
                dataKey="month"
                stroke="#9ca3af"
                tick={{ fill: '#9ca3af', fontSize: 12 }}
              />
              <YAxis stroke="#9ca3af" tick={{ fill: '#9ca3af', fontSize: 12 }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#1f2937',
                  border: '1px solid #374151',
                  borderRadius: '8px',
                }}
                labelStyle={{ color: '#f3f4f6' }}
                itemStyle={{ color: '#ec4899' }}
              />
              <Line
                type="monotone"
                dataKey="count"
                stroke="#ec4899"
                strokeWidth={2}
                dot={{ fill: '#ec4899', strokeWidth: 2 }}
                activeDot={{ r: 6, fill: '#ec4899' }}
              />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <p className="text-gray-500 text-center py-8">No timeline data available</p>
        )}
      </div>
    </div>
  );
}

export default Dashboard;

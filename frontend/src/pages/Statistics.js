import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, CartesianGrid } from "recharts";
import AppLayout from "./AppLayout";
import { API, fetchWithAuth, MOOD_TYPES, TRIGGER_TYPES } from "@/lib/api";

const PIE_COLORS = ["#769F78", "#E8C170", "#7CA5B8", "#8A9999", "#B8A07C", "#7CA5B8", "#D66A6A", "#D66A6A"];

export default function Statistics({ user }) {
  const [stats, setStats] = useState(null);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const res = await fetchWithAuth(`${API}/moods/stats`);
      if (res.ok) setStats(await res.json());
    } catch (err) {
      console.error(err);
    }
  };

  const distributionData = stats?.mood_distribution
    ? Object.entries(stats.mood_distribution).map(([key, count]) => ({
        name: MOOD_TYPES[key]?.label || key,
        emoji: MOOD_TYPES[key]?.emoji || "",
        value: count,
        color: MOOD_TYPES[key]?.color || "#8A9999",
      }))
    : [];

  const weeklyData = stats?.weekly_avg || [];

  return (
    <AppLayout user={user}>
      <div data-testid="statistics-page" className="space-y-8">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="font-heading text-3xl md:text-4xl font-light text-[#2D3A3A] mb-2">
            Tvoja <span className="font-bold text-[#4A6C6F]">Statistika</span>
          </h1>
          <p className="text-[#5C6B6B]">Uvid u tvoje emocionalne obrasce</p>
        </motion.div>

        {/* Summary cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "Ukupno unosa", value: stats?.total || 0 },
            { label: "Trenutni niz", value: `${stats?.streak || 0} dana` },
            { label: "Najduži niz", value: `${stats?.longest_streak || 0} dana` },
            { label: "Prosečna ocena", value: stats?.avg_score || 0 },
          ].map((item, i) => (
            <motion.div
              key={item.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="card-soft p-6 text-center"
              data-testid={`stat-card-${i}`}
            >
              <p className="text-2xl font-heading font-bold text-[#2D3A3A]">{item.value}</p>
              <p className="text-xs text-[#8A9999] mt-1">{item.label}</p>
            </motion.div>
          ))}
        </div>

        {/* Weekly trend */}
        {weeklyData.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="card-soft p-6 md:p-8"
            data-testid="weekly-trend-chart"
          >
            <h2 className="font-heading text-xl font-medium text-[#2D3A3A] mb-6">Nedeljni Trend</h2>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={weeklyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#EBEBE8" />
                <XAxis
                  dataKey="date"
                  tick={{ fill: '#8A9999', fontSize: 12 }}
                  tickFormatter={(d) => new Date(d).toLocaleDateString('sr-Latn-RS', { day: 'numeric', month: 'short' })}
                />
                <YAxis domain={[0, 5]} tick={{ fill: '#8A9999', fontSize: 12 }} />
                <Tooltip
                  contentStyle={{ background: 'white', border: '1px solid #EBEBE8', borderRadius: '1rem', boxShadow: '0 4px 15px rgba(0,0,0,0.05)' }}
                  formatter={(value, name) => [value, "Ocena"]}
                  labelFormatter={(label) => new Date(label).toLocaleDateString('sr-Latn-RS', { weekday: 'long', day: 'numeric', month: 'long' })}
                />
                <Line
                  type="monotone"
                  dataKey="score"
                  stroke="#4A6C6F"
                  strokeWidth={3}
                  dot={{ fill: '#4A6C6F', r: 5 }}
                  activeDot={{ r: 7, fill: '#E09F7D' }}
                />
              </LineChart>
            </ResponsiveContainer>
          </motion.div>
        )}

        {/* Distribution */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {distributionData.length > 0 && (
            <>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="card-soft p-6 md:p-8"
                data-testid="mood-distribution-chart"
              >
                <h2 className="font-heading text-xl font-medium text-[#2D3A3A] mb-6">Distribucija Raspoloženja</h2>
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie
                      data={distributionData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={90}
                      innerRadius={50}
                    >
                      {distributionData.map((entry, index) => (
                        <Cell key={index} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{ background: 'white', border: '1px solid #EBEBE8', borderRadius: '1rem' }}
                      formatter={(value, name) => [value, name]}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="card-soft p-6 md:p-8"
                data-testid="mood-bar-chart"
              >
                <h2 className="font-heading text-xl font-medium text-[#2D3A3A] mb-6">Raspoloženja po Broju</h2>
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={distributionData}>
                    <XAxis dataKey="emoji" tick={{ fontSize: 18 }} />
                    <YAxis tick={{ fill: '#8A9999', fontSize: 12 }} />
                    <Tooltip
                      contentStyle={{ background: 'white', border: '1px solid #EBEBE8', borderRadius: '1rem' }}
                      formatter={(value, name) => [value, "Unosa"]}
                    />
                    <Bar dataKey="value" radius={[8, 8, 0, 0]}>
                      {distributionData.map((entry, index) => (
                        <Cell key={index} fill={entry.color} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </motion.div>
            </>
          )}
        </div>

        {/* Trigger Insights */}
        {stats?.trigger_insights?.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="card-soft p-6 md:p-8"
            data-testid="trigger-insights"
          >
            <h2 className="font-heading text-xl font-medium text-[#2D3A3A] mb-2">Šta Utiče na Tvoje Raspoloženje</h2>
            <p className="text-sm text-[#8A9999] mb-6">Prosečna ocena raspoloženja po faktoru</p>
            <div className="space-y-3">
              {stats.trigger_insights.map((insight, i) => {
                const pct = (insight.avg_score / 5) * 100;
                const barColor = insight.avg_score >= 4 ? "#769F78" : insight.avg_score >= 3 ? "#E8C170" : insight.avg_score >= 2 ? "#B8A07C" : "#D66A6A";
                return (
                  <div key={insight.trigger} data-testid={`trigger-insight-${insight.trigger}`} className="flex items-center gap-4">
                    <span className="text-sm text-[#2D3A3A] font-medium w-28 shrink-0">{insight.label}</span>
                    <div className="flex-1 h-8 bg-[#F2F4F0] rounded-full overflow-hidden relative">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${pct}%` }}
                        transition={{ delay: 0.8 + i * 0.1, duration: 0.6 }}
                        className="h-full rounded-full"
                        style={{ backgroundColor: barColor }}
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-medium text-[#2D3A3A]">
                        {insight.avg_score}/5
                      </span>
                    </div>
                    <span className="text-xs text-[#8A9999] w-12 text-right">{insight.count}x</span>
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}

        {!stats || stats.total === 0 ? (
          <div className="card-soft p-12 text-center">
            <div className="text-5xl mb-4">📊</div>
            <h3 className="font-heading text-lg text-[#2D3A3A] mb-2">Nema podataka</h3>
            <p className="text-sm text-[#8A9999]">Počni da beležiš raspoloženja da bi video statistiku</p>
          </div>
        ) : null}
      </div>
    </AppLayout>
  );
}

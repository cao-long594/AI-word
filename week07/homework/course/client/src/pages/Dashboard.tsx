import { useEffect, useMemo, useState } from 'react';
import { Card, Empty, Spin } from 'antd';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { getDashboard } from '../api/dashboard';
import type { DashboardData } from '../types/api';
import { toPercent } from '../utils/format';

const colors = ['#b9d8f4', '#ffd0d2', '#ffe6ad', '#d9f1d2', '#efe0ff', '#d2eff2'];
const categoryColors = ['#b9d8f4', '#ffe6ad', '#d9f1d2', '#efe0ff'];
const categoryGroups = [
  { name: '前端', keywords: ['前端', 'React', 'Vue', 'TypeScript', 'Webpack'] },
  { name: '后端', keywords: ['后端', 'Node', '服务端'] },
  { name: '数据库', keywords: ['数据库', 'MySQL', 'Redis', 'MongoDB'] },
];

function EmptyChart() {
  return (
    <div className="empty-chart">
      <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} />
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
  sub,
}: {
  icon: string;
  label: string;
  value: number | string;
  sub?: string;
}) {
  return (
    <Card className="stat-card">
      <div className="stat-label">
        <span aria-hidden="true">{icon}</span>
        <span>{label}</span>
      </div>
      <div className="stat-value">{value}</div>
      <div className="stat-sub" aria-hidden={!sub}>
        {sub || '\u00a0'}
      </div>
    </Card>
  );
}

function normalizeCategoryDist(items: DashboardData['charts']['categoryDist']) {
  const grouped = categoryGroups.map((group) => ({
    name: group.name,
    value: items
      .filter((item) => group.keywords.some((keyword) => item.name.includes(keyword)))
      .reduce((sum, item) => sum + item.value, 0),
  }));
  const groupedValue = grouped.reduce((sum, item) => sum + item.value, 0);
  const total = items.reduce((sum, item) => sum + item.value, 0);

  return [...grouped, { name: '其他', value: Math.max(total - groupedValue, 0) }]
    .filter((item) => item.value > 0);
}

export default function Dashboard() {
  const [data, setData] = useState<DashboardData>();
  const [loading, setLoading] = useState(false);

  const publishRate = useMemo(() => {
    if (!data?.stats.totalCourses) return 0;
    return (data.stats.publishedCourses / data.stats.totalCourses) * 100;
  }, [data]);

  const activeRate = useMemo(() => {
    if (!data?.stats.totalStudents) return 0;
    return (data.stats.activeStudents / data.stats.totalStudents) * 100;
  }, [data]);

  const categoryDist = useMemo(() => {
    return normalizeCategoryDist(data?.charts.categoryDist || []);
  }, [data]);

  useEffect(() => {
    setLoading(true);
    getDashboard()
      .then(setData)
      .finally(() => setLoading(false));
  }, []);

  return (
    <Spin spinning={loading}>
      <h1 className="page-title">工作台</h1>
      <section className="dashboard-stats" aria-label="关键数据">
        <StatCard
          icon="📚"
          label="课程总数"
          value={data?.stats.totalCourses || 0}
          sub={`/ 已发布 ${data?.stats.publishedCourses || 0}`}
        />
        <StatCard
          icon="👥"
          label="学生总数"
          value={data?.stats.totalStudents || 0}
          sub={`/ 活跃 ${data?.stats.activeStudents || 0}`}
        />
        <StatCard icon="📈" label="课程发布率" value={toPercent(publishRate)} />
        <StatCard icon="🔥" label="学生活跃率" value={toPercent(activeRate)} />
      </section>

      <section className="chart-grid" aria-label="统计图表">
        <Card className="chart-card" title="课程选课人数 TOP 8">
          <div className="chart-box">
            {data?.charts.enrollment.length ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.charts.enrollment}>
                  <CartesianGrid vertical={false} strokeDasharray="4 4" stroke="#d7d7d7" />
                  <XAxis dataKey="name" tick={false} axisLine={{ stroke: '#252525', strokeWidth: 3 }} tickLine={false} height={8} />
                  <YAxis hide />
                  <Tooltip
                    labelFormatter={(label) => `课程：${label}`}
                    formatter={(value) => [value, '选课人数']}
                  />
                  <Bar dataKey="value" name="选课人数" fill="#b9d8f4" stroke="#252525" strokeWidth={3} radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <EmptyChart />
            )}
          </div>
        </Card>
        <Card className="chart-card" title="近 7 天学习活跃度">
          <div className="chart-box chart-box-with-note">
            {data?.charts.activity.length ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data.charts.activity}>
                  <CartesianGrid vertical={false} strokeDasharray="4 4" stroke="#e0e0e0" />
                  <XAxis dataKey="label" tick={false} axisLine={{ stroke: '#252525', strokeWidth: 3 }} tickLine={false} height={8} />
                  <YAxis hide />
                  <Tooltip
                    labelFormatter={(label) => label}
                    formatter={(value, name) => [value, name]}
                  />
                  <Line type="monotone" dataKey="students" name="学习人数" stroke="#4a90e2" strokeWidth={4} dot={false} />
                  <Line type="monotone" dataKey="duration" name="学习时长" stroke="#52c41a" strokeWidth={4} strokeDasharray="8 4" dot={false} />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <EmptyChart />
            )}
            {data?.charts.activity.length ? (
              <div className="activity-legend" aria-label="学习活跃度图例">
                <span className="activity-legend-item">
                  <span className="activity-legend-line activity-legend-line-students" aria-hidden="true" />
                  学习人数
                </span>
                <span className="activity-legend-item">
                  <span className="activity-legend-line activity-legend-line-duration" aria-hidden="true" />
                  学习时长
                </span>
              </div>
            ) : null}
          </div>
        </Card>
        <Card className="chart-card" title="学生状态分布">
          <div className="chart-box">
            {data?.charts.statusDist.length ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={data.charts.statusDist} dataKey="value" nameKey="name" outerRadius={82} stroke="#252525" strokeWidth={3}>
                    {data.charts.statusDist.map((_, index) => (
                      <Cell key={index} fill={colors[index % colors.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <EmptyChart />
            )}
          </div>
        </Card>
        <Card className="chart-card" title="课程分类分布">
          <div className="chart-box">
            {categoryDist.length ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={categoryDist}
                    dataKey="value"
                    nameKey="name"
                    innerRadius={58}
                    outerRadius={86}
                    stroke="#252525"
                    strokeWidth={3}
                  >
                    {categoryDist.map((_, index) => (
                      <Cell key={index} fill={categoryColors[index % categoryColors.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <EmptyChart />
            )}
          </div>
        </Card>
      </section>
    </Spin>
  );
}

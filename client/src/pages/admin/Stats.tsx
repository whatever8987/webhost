import { useState, useEffect } from 'react';
import { 
  Users, 
  Activity, 
  TrendingUp, 
  DollarSign,
  Calendar,
  Clock
} from 'lucide-react';

interface Stats {
  total_users: number;
  active_users: number;
  total_revenue: number;
  monthly_revenue: number;
  daily_active_users: number;
  average_session_duration: number;
}

const Stats = () => {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('week');

  useEffect(() => {
    fetchStats();
  }, [timeRange]);

  const fetchStats = async () => {
    try {
      const response = await fetch(`/api/admin/stats/?time_range=${timeRange}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      const data = await response.json();
      setStats(data);
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="text-center text-gray-500">
        No statistics available
      </div>
    );
  }

  const statCards = [
    {
      title: 'Total Users',
      value: stats.total_users,
      icon: <Users className="w-6 h-6" />,
      color: 'bg-blue-500',
    },
    {
      title: 'Active Users',
      value: stats.active_users,
      icon: <Activity className="w-6 h-6" />,
      color: 'bg-green-500',
    },
    {
      title: 'Total Revenue',
      value: `$${stats.total_revenue.toLocaleString()}`,
      icon: <DollarSign className="w-6 h-6" />,
      color: 'bg-purple-500',
    },
    {
      title: 'Monthly Revenue',
      value: `$${stats.monthly_revenue.toLocaleString()}`,
      icon: <TrendingUp className="w-6 h-6" />,
      color: 'bg-yellow-500',
    },
    {
      title: 'Daily Active Users',
      value: stats.daily_active_users,
      icon: <Calendar className="w-6 h-6" />,
      color: 'bg-red-500',
    },
    {
      title: 'Avg. Session Duration',
      value: `${Math.round(stats.average_session_duration)} min`,
      icon: <Clock className="w-6 h-6" />,
      color: 'bg-indigo-500',
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Statistics</h1>
        <div className="flex space-x-2">
          {['day', 'week', 'month', 'year'].map((range) => (
            <button
              key={range}
              onClick={() => setTimeRange(range)}
              className={`px-4 py-2 rounded-md ${
                timeRange === range
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {range.charAt(0).toUpperCase() + range.slice(1)}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {statCards.map((stat, index) => (
          <div
            key={index}
            className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                <p className="text-2xl font-semibold text-gray-900 mt-1">
                  {stat.value}
                </p>
              </div>
              <div className={`p-3 rounded-full ${stat.color} text-white`}>
                {stat.icon}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Charts would go here */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            User Growth
          </h2>
          {/* Add your chart component here */}
          <div className="h-64 bg-gray-50 rounded flex items-center justify-center">
            Chart placeholder
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Revenue Overview
          </h2>
          {/* Add your chart component here */}
          <div className="h-64 bg-gray-50 rounded flex items-center justify-center">
            Chart placeholder
          </div>
        </div>
      </div>
    </div>
  );
};

export default Stats; 
import React, { useState, useEffect } from 'react';
import { Search, Filter, SortDesc, Layers, Users, MapPin, Activity, TrendingUp, Loader2 } from 'lucide-react';
import { getAdminAnalytics } from '../api/admin.api';

const AdminDashboardPage = () => {
  const [activeTab, setActiveTab] = useState('ANALYTICS');
  const [searchQuery, setSearchQuery] = useState('');
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const tabs = [
    { id: 'USERS', label: 'Manage Users', icon: Users },
    { id: 'CITIES', label: 'Popular cities', icon: MapPin },
    { id: 'ACTIVITIES', label: 'Popular Activities', icon: Activity },
    { id: 'ANALYTICS', label: 'User Trends and Analytics', icon: TrendingUp },
  ];

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const res = await getAdminAnalytics();
      setAnalytics(res.data || res);
      setError(null);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch admin analytics');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-full flex items-center justify-center" style={{ backgroundColor: '#F5F0E8' }}>
        <Loader2 className="animate-spin text-[#1A1A1A]" size={48} />
      </div>
    );
  }

  return (
    <div className="min-h-full px-8 md:px-14 py-8" style={{ backgroundColor: '#F5F0E8' }}>
      
      {/* Search and Filters Row */}
      <div className="flex flex-col md:flex-row items-center gap-4 mb-8 w-full max-w-5xl mx-auto">
        <div className="relative flex-1 w-full">
          <Search size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#1A1A1A]" />
          <input
            type="text"
            placeholder="Search users, cities, or activities..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-white border-2 border-[#1A1A1A] rounded-full py-3.5 pl-12 pr-6 text-sm font-bold
                     text-[#1A1A1A] placeholder-[#9CA3AF] focus:outline-none focus:ring-0"
            style={{ boxShadow: '4px 4px 0px #1A1A1A' }}
          />
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto overflow-x-auto pb-2 md:pb-0 hide-scrollbar">
          <button className="flex items-center gap-2 bg-white border-2 border-[#1A1A1A] rounded-full px-6 py-3.5 text-sm font-bold text-[#1A1A1A] hover:bg-[#F5F0E8] transition-colors whitespace-nowrap" style={{ boxShadow: '4px 4px 0px #1A1A1A' }}>
            <Layers size={16} /> Group by
          </button>
          <button className="flex items-center gap-2 bg-white border-2 border-[#1A1A1A] rounded-full px-6 py-3.5 text-sm font-bold text-[#1A1A1A] hover:bg-[#F5F0E8] transition-colors whitespace-nowrap" style={{ boxShadow: '4px 4px 0px #1A1A1A' }}>
            <Filter size={16} /> Filter
          </button>
          <button className="flex items-center gap-2 bg-white border-2 border-[#1A1A1A] rounded-full px-6 py-3.5 text-sm font-bold text-[#1A1A1A] hover:bg-[#F5F0E8] transition-colors whitespace-nowrap" style={{ boxShadow: '4px 4px 0px #1A1A1A' }}>
            <SortDesc size={16} /> Sort by...
          </button>
        </div>
      </div>

      <div className="max-w-5xl mx-auto">
        
        {/* Navigation Tabs */}
        <div className="flex overflow-x-auto hide-scrollbar gap-4 mb-10 pb-2">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-6 py-3 rounded-2xl text-sm font-black border-2 transition-transform duration-200 whitespace-nowrap
                           ${isActive ? 'bg-[#1A1A1A] text-white border-[#1A1A1A] -translate-y-1' : 'bg-white text-[#1A1A1A] border-[#1A1A1A] hover:-translate-y-1'}`}
                style={{ boxShadow: isActive ? '4px 4px 0px #F5C142' : '4px 4px 0px #1A1A1A' }}
              >
                <tab.icon size={16} className={isActive ? 'text-[#F5C142]' : 'text-[#1A1A1A]'} />
                {tab.label}
              </button>
            );
          })}
        </div>

        {error && (
          <div className="mb-6 rounded-2xl border-2 border-[#EF4444] bg-red-50 px-4 py-3 text-sm font-medium text-[#EF4444]">
            {error}
          </div>
        )}

        {/* Tab Content */}
        {activeTab === 'ANALYTICS' && analytics && (
          <div className="bg-white rounded-[40px] border-2 border-[#1A1A1A] p-10 md:p-14" style={{ boxShadow: '8px 8px 0px #1A1A1A' }}>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-12">
              <div className="p-6 border-2 border-[#1A1A1A] rounded-3xl" style={{ boxShadow: '4px 4px 0px #1A1A1A' }}>
                <div className="text-sm font-bold text-[#6B7280] mb-1">Total Users</div>
                <div className="text-3xl font-black text-[#1A1A1A]">{analytics.stats?.totalUsers || 0}</div>
              </div>
              <div className="p-6 border-2 border-[#1A1A1A] rounded-3xl" style={{ boxShadow: '4px 4px 0px #1A1A1A' }}>
                <div className="text-sm font-bold text-[#6B7280] mb-1">Total Trips</div>
                <div className="text-3xl font-black text-[#1A1A1A]">{analytics.stats?.totalTrips || 0}</div>
              </div>
              <div className="p-6 border-2 border-[#1A1A1A] rounded-3xl" style={{ boxShadow: '4px 4px 0px #1A1A1A' }}>
                <div className="text-sm font-bold text-[#6B7280] mb-1">Expenses Logged</div>
                <div className="text-3xl font-black text-[#1A1A1A]">{analytics.stats?.totalExpenses || 0}</div>
              </div>
              <div className="p-6 border-2 border-[#1A1A1A] rounded-3xl" style={{ boxShadow: '4px 4px 0px #1A1A1A' }}>
                <div className="text-sm font-bold text-[#6B7280] mb-1">Community Posts</div>
                <div className="text-3xl font-black text-[#1A1A1A]">{analytics.stats?.totalCommunities || 0}</div>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-12 mb-12">
              
              {/* Legend Side */}
              <div className="flex flex-col justify-center space-y-6">
                {[
                  { color: 'bg-[#4B5563]', w: 'w-3/4' },
                  { color: 'bg-[#6B7280]', w: 'w-5/6' },
                  { color: 'bg-[#9CA3AF]', w: 'w-4/5' },
                  { color: 'bg-[#D1D5DB]', w: 'w-2/3' }
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-4">
                    <div className={`w-8 h-8 rounded-full ${item.color}`}></div>
                    <div className={`h-4 ${item.color} rounded-full opacity-50 ${item.w}`}></div>
                  </div>
                ))}
              </div>

              {/* Pie Chart Mock (CSS based) */}
              <div className="flex justify-center items-center relative h-64">
                {/* A simple CSS representation of a pie chart broken into segments */}
                <svg viewBox="0 0 100 100" className="w-56 h-56 transform -rotate-90">
                  {/* Large blue segment */}
                  <circle cx="50" cy="50" r="40" fill="transparent" stroke="#3B82F6" strokeWidth="20" strokeDasharray="180 251.2" />
                  {/* Green segment pulled out */}
                  <circle cx="50" cy="50" r="40" fill="transparent" stroke="#22C55E" strokeWidth="20" strokeDasharray="60 251.2" strokeDashoffset="-185" className="transform translate-x-2 -translate-y-2 origin-center" />
                </svg>
              </div>

            </div>

            {/* Line Chart Mock */}
            <div className="w-full mb-12 h-48 relative border-b-4 border-l-4 border-[#D1D5DB] pb-4 pl-4 pt-8">
              {/* Lines */}
              <svg className="absolute inset-0 h-full w-full" preserveAspectRatio="none" viewBox="0 0 100 100">
                <polyline points="10,70 30,50 50,60 70,30 90,40" fill="none" stroke="#4B5563" strokeWidth="3" />
              </svg>
              {/* Dots */}
              <div className="absolute bottom-[25%] left-[8%] w-6 h-6 rounded-full bg-[#EF4444] border-2 border-white shadow-md"></div>
              <div className="absolute bottom-[45%] left-[28%] w-6 h-6 rounded-full bg-[#EF4444] border-2 border-white shadow-md"></div>
              <div className="absolute bottom-[35%] left-[48%] w-6 h-6 rounded-full bg-[#EF4444] border-2 border-white shadow-md"></div>
              <div className="absolute bottom-[65%] left-[68%] w-6 h-6 rounded-full bg-[#EF4444] border-2 border-white shadow-md"></div>
              <div className="absolute bottom-[55%] left-[88%] w-6 h-6 rounded-full bg-[#EF4444] border-2 border-white shadow-md"></div>
            </div>

          </div>
        )}

        {/* Other Tabs Empty State */}
        {activeTab !== 'ANALYTICS' && (
          <div className="bg-white rounded-[40px] border-2 border-[#1A1A1A] p-16 text-center" style={{ boxShadow: '8px 8px 0px #1A1A1A' }}>
            <div className="w-20 h-20 bg-[#F5F0E8] rounded-full border-2 border-[#1A1A1A] flex items-center justify-center mx-auto mb-6" style={{ boxShadow: '4px 4px 0px #1A1A1A' }}>
              {activeTab === 'USERS' && <Users size={32} className="text-[#1A1A1A]" />}
              {activeTab === 'CITIES' && <MapPin size={32} className="text-[#1A1A1A]" />}
              {activeTab === 'ACTIVITIES' && <Activity size={32} className="text-[#1A1A1A]" />}
            </div>
            
            {activeTab === 'USERS' && analytics?.recentUsers && (
              <div className="text-left mt-8 max-w-2xl mx-auto">
                <h3 className="text-xl font-bold mb-4">Recent Users</h3>
                <div className="space-y-4">
                  {analytics.recentUsers.map(u => (
                    <div key={u.id} className="p-4 border-2 border-[#1A1A1A] rounded-xl flex justify-between items-center" style={{ boxShadow: '4px 4px 0px #1A1A1A' }}>
                      <div>
                        <div className="font-bold">{u.name}</div>
                        <div className="text-sm text-gray-600">{u.email}</div>
                      </div>
                      <div className="px-3 py-1 bg-gray-200 rounded-full text-xs font-bold">{u.role}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {activeTab !== 'USERS' && (
              <>
                <h2 className="text-2xl font-black text-[#1A1A1A] mb-2">
                  {tabs.find(t => t.id === activeTab)?.label} Data
                </h2>
                <p className="text-[#6B7280] max-w-md mx-auto">
                  This section is responsible for managing {activeTab.toLowerCase()} data based on current user trends. Additional functionalities will be populated here.
                </p>
              </>
            )}
          </div>
        )}

      </div>
    </div>
  );
};

export default AdminDashboardPage;

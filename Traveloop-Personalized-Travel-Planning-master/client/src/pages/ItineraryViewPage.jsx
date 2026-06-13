import React, { useState } from 'react';
import { Search, Filter, SortDesc, Layers, ArrowDown, Clock, MapPin, DollarSign } from 'lucide-react';
import { useParams } from 'react-router-dom';

const MOCK_ITINERARY = [
  {
    day: 1,
    date: 'Oct 12, 2026',
    activities: [
      {
        id: 'a1',
        title: 'Arrive & Transfer',
        description: 'Transfer to the hotel via pre-booked taxi from the central station.',
        time: '10:00 AM',
        location: 'Central Station',
        expense: { amount: 45, label: 'Taxi Fare' }
      },
      {
        id: 'a2',
        title: 'Paragliding Session',
        description: 'Tandem paragliding over the beautiful valley. Briefing included.',
        time: '02:00 PM',
        location: 'Alpine Peak Base',
        expense: { amount: 150, label: 'Activity Fee' }
      },
      {
        id: 'a3',
        title: 'Dinner at Local Tavern',
        description: 'Enjoy local specialties and craft beverages.',
        time: '07:30 PM',
        location: 'Old Town Square',
        expense: { amount: 65, label: 'Food & Drinks' }
      }
    ]
  },
  {
    day: 2,
    date: 'Oct 13, 2026',
    activities: [
      {
        id: 'a4',
        title: 'Mountain Hike',
        description: 'Guided hike up to the summit lake. Wear sturdy shoes.',
        time: '08:00 AM',
        location: 'National Park Trailhead',
        expense: { amount: 20, label: 'Park Entry' }
      },
      {
        id: 'a5',
        title: 'Lunch at Summit Cafe',
        description: 'Quick bite with a panoramic view of the mountains.',
        time: '01:00 PM',
        location: 'Summit Cafe',
        expense: { amount: 35, label: 'Food & Drinks' }
      }
    ]
  }
];

const ItineraryViewPage = () => {
  const { id } = useParams();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('ALL');
  const [sortBy, setSortBy] = useState('NONE');
  const [groupByType, setGroupByType] = useState(false);

  // In a real app, we'd filter the itinerary based on the search query.
  // For the UI demonstration, we'll just show the mock data directly.

  return (
    <div className="min-h-full px-8 md:px-14 py-8" style={{ backgroundColor: '#F5F0E8' }}>
      
      {/* Top Controls Row (Similar to Search Page) */}
      <div className="flex flex-col md:flex-row items-center gap-4 mb-10 w-full">
        {/* Search Bar */}
        <div className="relative flex-1 w-full">
          <Search size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#1A1A1A]" />
          <input
            type="text"
            placeholder="Search activities, expenses..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-white border-2 border-[#1A1A1A] rounded-full py-3.5 pl-12 pr-6 text-sm font-bold
                     text-[#1A1A1A] placeholder-[#9CA3AF] focus:outline-none focus:ring-0"
            style={{ boxShadow: '4px 4px 0px #1A1A1A' }}
          />
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-3 w-full md:w-auto overflow-x-auto pb-2 md:pb-0 hide-scrollbar">
          <button 
            onClick={() => setGroupByType(!groupByType)}
            className={`flex items-center gap-2 border-2 border-[#1A1A1A] rounded-full px-6 py-3.5 text-sm font-bold transition-colors whitespace-nowrap ${groupByType ? 'bg-[#F5C142] text-[#1A1A1A]' : 'bg-white text-[#1A1A1A] hover:bg-[#F5F0E8]'}`} 
            style={{ boxShadow: '4px 4px 0px #1A1A1A' }}
          >
            <Layers size={16} />
            {groupByType ? 'Ungroup' : 'Group by'}
          </button>
          <button 
            onClick={() => {
              setFilterType(prev => prev === 'ALL' ? 'EXPENSE' : 'ALL');
            }}
            className={`flex items-center gap-2 border-2 border-[#1A1A1A] rounded-full px-6 py-3.5 text-sm font-bold transition-colors whitespace-nowrap ${filterType !== 'ALL' ? 'bg-[#F5C142] text-[#1A1A1A]' : 'bg-white text-[#1A1A1A] hover:bg-[#F5F0E8]'}`} 
            style={{ boxShadow: '4px 4px 0px #1A1A1A' }}
          >
            <Filter size={16} />
            Filter
          </button>
          <button 
            onClick={() => {
              setSortBy(prev => prev === 'NONE' ? 'TIME' : 'NONE');
            }}
            className={`flex items-center gap-2 border-2 border-[#1A1A1A] rounded-full px-6 py-3.5 text-sm font-bold transition-colors whitespace-nowrap ${sortBy !== 'NONE' ? 'bg-[#F5C142] text-[#1A1A1A]' : 'bg-white text-[#1A1A1A] hover:bg-[#F5F0E8]'}`} 
            style={{ boxShadow: '4px 4px 0px #1A1A1A' }}
          >
            <SortDesc size={16} />
            Sort by...
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="max-w-5xl mx-auto">
        <h1 className="text-3xl font-black text-[#1A1A1A] text-center mb-8">Itinerary for a selected place</h1>
        
        {/* Table Headers */}
        <div className="flex w-full mb-6">
          <div className="w-24 shrink-0"></div> {/* Spacer for Day label */}
          <div className="flex-1 text-center">
            <h2 className="text-xl font-black text-[#1A1A1A]">Physical Activity</h2>
          </div>
          <div className="w-64 shrink-0 text-center">
            <h2 className="text-xl font-black text-[#1A1A1A]">Expense</h2>
          </div>
        </div>

        {/* Timeline */}
        <div className="space-y-12">
          {MOCK_ITINERARY.map((dayData) => (
            <div key={dayData.day} className="flex gap-6">
              
              {/* Left Column: Day Label */}
              <div className="w-24 shrink-0 pt-4">
                <div className="bg-white border-2 border-[#1A1A1A] rounded-2xl p-3 text-center" style={{ boxShadow: '4px 4px 0px #1A1A1A' }}>
                  <div className="text-sm font-black text-[#1A1A1A]">Day {dayData.day}</div>
                </div>
              </div>

              {/* Right Column: Activities and Expenses */}
              <div className="flex-1 flex flex-col items-center">
                {dayData.activities.map((activity, index) => (
                  <React.Fragment key={activity.id}>
                    
                    {/* Row for one activity */}
                    <div className="flex w-full gap-6">
                      
                      {/* Physical Activity Box */}
                      <div className="flex-1 bg-white border-2 border-[#1A1A1A] rounded-3xl p-5 hover:-translate-y-1 transition-transform duration-200" style={{ boxShadow: '6px 6px 0px #1A1A1A' }}>
                        <div className="flex justify-between items-start mb-2">
                          <h3 className="text-lg font-black text-[#1A1A1A]">{activity.title}</h3>
                          <div className="flex items-center gap-1.5 text-xs font-bold text-[#6B7280] bg-[#F5F0E8] px-2 py-1 rounded-lg">
                            <Clock size={12} /> {activity.time}
                          </div>
                        </div>
                        <p className="text-sm text-[#6B7280] mb-3">{activity.description}</p>
                        <div className="flex items-center gap-1.5 text-xs font-bold text-[#1A1A1A]">
                          <MapPin size={14} className="text-[#F5C142]" /> {activity.location}
                        </div>
                      </div>

                      {/* Expense Box */}
                      <div className="w-64 shrink-0 bg-white border-2 border-[#1A1A1A] rounded-3xl p-5 flex flex-col justify-center items-center hover:-translate-y-1 transition-transform duration-200" style={{ boxShadow: '6px 6px 0px #1A1A1A' }}>
                        <div className="flex items-center justify-center w-10 h-10 rounded-full bg-[#E8F5F0] mb-2">
                          <DollarSign size={20} className="text-[#10B981]" />
                        </div>
                        <span className="text-2xl font-black text-[#1A1A1A]">${activity.expense.amount}</span>
                        <span className="text-xs font-bold text-[#6B7280] mt-1 text-center">{activity.expense.label}</span>
                      </div>

                    </div>

                    {/* Arrow down (if not the last activity) */}
                    {index < dayData.activities.length - 1 && (
                      <div className="flex w-full">
                        <div className="flex-1 flex justify-center py-3">
                          <ArrowDown size={24} className="text-[#1A1A1A]" />
                        </div>
                        <div className="w-64 shrink-0"></div> {/* Empty space under expense */}
                      </div>
                    )}
                  </React.Fragment>
                ))}
              </div>

            </div>
          ))}
        </div>

      </div>
    </div>
  );
};

export default ItineraryViewPage;

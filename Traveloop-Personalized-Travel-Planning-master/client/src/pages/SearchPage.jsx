import React, { useState, useEffect } from 'react';
import { Search, Filter, SortDesc, Layers, MapPin, Map, Loader2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { searchEntities } from '../api/search.api';

const SearchPage = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('ALL');
  const [sortBy, setSortBy] = useState('NONE');
  const [groupByType, setGroupByType] = useState(false);
  
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Debounced search
  useEffect(() => {
    const fetchSearch = async () => {
      setLoading(true);
      setError(null);
      try {
        const typeParam = filterType === 'ALL' ? undefined : filterType.toLowerCase();
        const res = await searchEntities(searchQuery, typeParam);
        const data = res.data || res;
        
        let combined = [];
        if (data.cities) {
          combined = [...combined, ...data.cities.map(c => ({
            id: `city-${c.id}`,
            type: 'CITY',
            title: c.name,
            location: c.country,
            description: c.description || `Explore ${c.name}, ${c.country}.`,
            rating: 4.8, // Mock
            price: '$$', // Mock
            raw: c
          }))];
        }
        if (data.activities) {
          combined = [...combined, ...data.activities.map(a => ({
            id: `activity-${a.id}`,
            type: 'ACTIVITY',
            title: a.name,
            location: a.city?.name || 'Various Locations',
            description: a.description || 'Enjoy this wonderful activity.',
            rating: 4.9, // Mock
            price: `$${a.price || 100}/person`, // Mock
            raw: a
          }))];
        }
        setResults(combined);
      } catch (err) {
        setError('Failed to fetch search results.');
        setResults([]);
      } finally {
        setLoading(false);
      }
    };

    const timeout = setTimeout(fetchSearch, 400);
    return () => clearTimeout(timeout);
  }, [searchQuery, filterType]);

  const filteredResults = [...results].sort((a, b) => {
    if (sortBy === 'PRICE_ASC') {
      const priceA = parseInt(a.price.replace(/[^0-9]/g, '')) || 0;
      const priceB = parseInt(b.price.replace(/[^0-9]/g, '')) || 0;
      return priceA - priceB;
    }
    if (sortBy === 'PRICE_DESC') {
      const priceA = parseInt(a.price.replace(/[^0-9]/g, '')) || 0;
      const priceB = parseInt(b.price.replace(/[^0-9]/g, '')) || 0;
      return priceB - priceA;
    }
    if (sortBy === 'RATING_DESC') {
      return b.rating - a.rating;
    }
    return 0;
  });

  const renderCard = (item) => (
    <div 
      key={item.id}
      className="bg-white rounded-3xl border-2 border-[#1A1A1A] p-6 hover:-translate-y-1 transition-transform duration-200"
      style={{ boxShadow: '6px 6px 0px #1A1A1A' }}
    >
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <span className={`px-3 py-1 rounded-full text-[10px] font-black tracking-widest uppercase border-2 border-[#1A1A1A] ${item.type === 'CITY' ? 'bg-[#F5C142]' : 'bg-[#E8F5F0]'}`}>
              {item.type}
            </span>
            <div className="flex items-center gap-1.5 text-xs font-bold text-[#6B7280]">
              {item.type === 'CITY' ? <Map size={14} /> : <MapPin size={14} />}
              {item.location}
            </div>
          </div>
          
          <h3 className="text-xl font-black text-[#1A1A1A] mb-2">{item.title}</h3>
          <p className="text-sm text-[#6B7280] line-clamp-2 max-w-3xl">
            {item.description}
          </p>
        </div>
        
        <div className="flex flex-col items-end shrink-0 pt-1">
          <div className="text-sm font-black text-[#1A1A1A] mb-1">
            {item.price}
          </div>
          <div className="text-xs font-bold text-[#F5C142] flex items-center gap-1 bg-[#1A1A1A] px-2 py-1 rounded-lg">
            ★ {item.rating}
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-full px-8 md:px-14 py-8" style={{ backgroundColor: '#F5F0E8' }}>
      
      {/* Search and Filters Row */}
      <div className="flex flex-col md:flex-row items-center gap-4 mb-10 w-full">
        {/* Search Bar */}
        <div className="relative flex-1 w-full">
          <Search size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#1A1A1A]" />
          <input
            type="text"
            placeholder="Search for cities, activities, or places..."
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
            {groupByType ? 'Ungroup' : 'Group by Type'}
          </button>
          <button 
            onClick={() => {
              if (filterType === 'ALL') setFilterType('ACTIVITY');
              else if (filterType === 'ACTIVITY') setFilterType('CITY');
              else setFilterType('ALL');
            }}
            className={`flex items-center gap-2 border-2 border-[#1A1A1A] rounded-full px-6 py-3.5 text-sm font-bold transition-colors whitespace-nowrap ${filterType !== 'ALL' ? 'bg-[#F5C142] text-[#1A1A1A]' : 'bg-white text-[#1A1A1A] hover:bg-[#F5F0E8]'}`} 
            style={{ boxShadow: '4px 4px 0px #1A1A1A' }}
          >
            <Filter size={16} />
            Filter: {filterType}
          </button>
          <button 
            onClick={() => {
              if (sortBy === 'NONE') setSortBy('PRICE_ASC');
              else if (sortBy === 'PRICE_ASC') setSortBy('PRICE_DESC');
              else if (sortBy === 'PRICE_DESC') setSortBy('RATING_DESC');
              else setSortBy('NONE');
            }}
            className={`flex items-center gap-2 border-2 border-[#1A1A1A] rounded-full px-6 py-3.5 text-sm font-bold transition-colors whitespace-nowrap ${sortBy !== 'NONE' ? 'bg-[#F5C142] text-[#1A1A1A]' : 'bg-white text-[#1A1A1A] hover:bg-[#F5F0E8]'}`} 
            style={{ boxShadow: '4px 4px 0px #1A1A1A' }}
          >
            <SortDesc size={16} />
            Sort: {sortBy === 'NONE' ? 'None' : sortBy === 'PRICE_ASC' ? 'Price (Low to High)' : sortBy === 'PRICE_DESC' ? 'Price (High to Low)' : 'Highest Rating'}
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-6 rounded-2xl border-2 border-[#EF4444] bg-red-50 px-4 py-3 text-sm font-medium text-[#EF4444]">
          {error}
        </div>
      )}

      {/* Results Section */}
      <div>
        <h2 className="text-2xl font-black text-[#1A1A1A] mb-6 flex items-center gap-3">
            Results
            {loading && <Loader2 size={18} className="animate-spin text-[#6B7280]" />}
        </h2>
        
        {filteredResults.length > 0 ? (
          <div className="space-y-4">
            {!groupByType ? (
              filteredResults.map(item => renderCard(item))
            ) : (
              <div className="space-y-8">
                {['CITY', 'ACTIVITY'].map(type => {
                  const items = filteredResults.filter(i => i.type === type);
                  if (items.length === 0) return null;
                  return (
                    <div key={type} className="space-y-4">
                      <h3 className="text-xl font-bold text-[#1A1A1A] capitalize pb-2 border-b-2 border-[#1A1A1A] inline-block">{type.toLowerCase()}s</h3>
                      <div className="space-y-4">
                        {items.map(item => renderCard(item))}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        ) : (
          !loading && (
            <div className="bg-white rounded-3xl border-2 border-[#1A1A1A] p-12 text-center" style={{ boxShadow: '6px 6px 0px #1A1A1A' }}>
              <p className="text-lg font-bold text-[#1A1A1A] mb-2">No results found</p>
              <p className="text-[#6B7280] text-sm">Try adjusting your search terms or filters.</p>
            </div>
          )
        )}
      </div>

    </div>
  );
};

export default SearchPage;

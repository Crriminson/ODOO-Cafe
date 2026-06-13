import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Search, Filter, SortDesc, Layers, Loader2, MapPin, Calendar } from 'lucide-react';
import { getTrips } from '../api/trips.api';

const TripListPage = () => {
  const [trips, setTrips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const fetchTrips = async () => {
      try {
        const res = await getTrips();
        // Handle response where data could be nested
        setTrips(Array.isArray(res.data) ? res.data : (res.data?.trips || []));
      } catch (err) {
        setError('Failed to load trips.');
      } finally {
        setLoading(false);
      }
    };
    fetchTrips();
  }, []);

  const filteredTrips = trips.filter(trip => 
    trip.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    (trip.description && trip.description.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const groupedTrips = {
    ongoing: filteredTrips.filter(t => t.status === 'ONGOING'),
    upcoming: filteredTrips.filter(t => t.status === 'PLANNING'),
    completed: filteredTrips.filter(t => t.status === 'COMPLETED'),
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Dates TBD';
    return new Date(dateString).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  if (loading) {
    return (
      <div className="min-h-full flex items-center justify-center p-8" style={{ backgroundColor: '#F5F0E8' }}>
        <Loader2 className="animate-spin text-[#F5C142]" size={40} />
      </div>
    );
  }

  return (
    <div className="min-h-full px-8 md:px-14 py-8" style={{ backgroundColor: '#F5F0E8' }}>
      
      {/* Search and Filters Row */}
      <div className="flex flex-col md:flex-row items-center gap-4 mb-10 w-full">
        {/* Search Bar */}
        <div className="relative flex-1 w-full">
          <Search size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#1A1A1A]" />
          <input
            type="text"
            placeholder="Search bar ......"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-white border-2 border-[#1A1A1A] rounded-full py-3.5 pl-12 pr-6 text-sm font-bold
                     text-[#1A1A1A] placeholder-[#9CA3AF] focus:outline-none focus:ring-0"
            style={{ boxShadow: '4px 4px 0px #1A1A1A' }}
          />
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-3 w-full md:w-auto overflow-x-auto pb-2 md:pb-0 hide-scrollbar">
          <button className="flex items-center gap-2 bg-white border-2 border-[#1A1A1A] rounded-full px-6 py-3.5 text-sm font-bold text-[#1A1A1A] hover:bg-[#F5F0E8] transition-colors whitespace-nowrap" style={{ boxShadow: '4px 4px 0px #1A1A1A' }}>
            <Layers size={16} />
            Group by
          </button>
          <button className="flex items-center gap-2 bg-white border-2 border-[#1A1A1A] rounded-full px-6 py-3.5 text-sm font-bold text-[#1A1A1A] hover:bg-[#F5F0E8] transition-colors whitespace-nowrap" style={{ boxShadow: '4px 4px 0px #1A1A1A' }}>
            <Filter size={16} />
            Filter
          </button>
          <button className="flex items-center gap-2 bg-white border-2 border-[#1A1A1A] rounded-full px-6 py-3.5 text-sm font-bold text-[#1A1A1A] hover:bg-[#F5F0E8] transition-colors whitespace-nowrap" style={{ boxShadow: '4px 4px 0px #1A1A1A' }}>
            <SortDesc size={16} />
            Sort by...
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-6 rounded-2xl border-2 border-[#EF4444] bg-red-50 px-4 py-3 text-sm font-medium text-[#EF4444]">
          {error}
        </div>
      )}

      {/* Trip Lists */}
      <div className="space-y-12">
        {/* Ongoing */}
        {groupedTrips.ongoing.length > 0 && (
          <section>
            <h2 className="text-2xl font-black text-[#1A1A1A] mb-6">Ongoing</h2>
            <div className="space-y-4">
              {groupedTrips.ongoing.map(trip => (
                <TripCard key={trip.id} trip={trip} />
              ))}
            </div>
          </section>
        )}

        {/* Up-coming (Planning) */}
        {(groupedTrips.upcoming.length > 0 || trips.length === 0) && (
          <section>
            <h2 className="text-2xl font-black text-[#1A1A1A] mb-6">Up-coming</h2>
            {groupedTrips.upcoming.length > 0 ? (
              <div className="space-y-4">
                {groupedTrips.upcoming.map(trip => (
                  <TripCard key={trip.id} trip={trip} />
                ))}
              </div>
            ) : (
              !searchQuery && (
                <div className="bg-white rounded-3xl border-2 border-[#1A1A1A] p-8 text-center" style={{ boxShadow: '6px 6px 0px #1A1A1A' }}>
                  <p className="text-[#6B7280] font-medium mb-4">No upcoming trips yet.</p>
                  <Link to="/trips/new" className="inline-flex items-center gap-2 bg-[#F5C142] text-[#1A1A1A] font-black text-sm rounded-full px-6 py-3 border-2 border-[#1A1A1A] hover:bg-[#E0AE30] transition-colors" style={{ boxShadow: '3px 3px 0px #1A1A1A' }}>
                    Create Your First Trip
                  </Link>
                </div>
              )
            )}
          </section>
        )}

        {/* Completed */}
        {groupedTrips.completed.length > 0 && (
          <section>
            <h2 className="text-2xl font-black text-[#1A1A1A] mb-6">Completed</h2>
            <div className="space-y-4">
              {groupedTrips.completed.map(trip => (
                <TripCard key={trip.id} trip={trip} />
              ))}
            </div>
          </section>
        )}
      </div>

    </div>
  );
};

// Extracted Component for the wide card
const TripCard = ({ trip }) => {
  const formatDate = (dateString) => {
    if (!dateString) return 'Dates TBD';
    return new Date(dateString).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  return (
    <Link 
      to={`/trips/${trip.id}`}
      className="block bg-white rounded-3xl border-2 border-[#1A1A1A] p-6 hover:-translate-y-1 hover:bg-slate-50 transition-all duration-200"
      style={{ boxShadow: '6px 6px 0px #1A1A1A' }}
    >
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h3 className="text-xl font-black text-[#1A1A1A] mb-2">{trip.name}</h3>
          <p className="text-sm text-[#6B7280] line-clamp-2 max-w-3xl">
            {trip.description || 'Short Over View of the Trip. Click to see details, manage itinerary, and view notes.'}
          </p>
        </div>
        <div className="flex flex-wrap md:flex-col items-center md:items-end gap-3 text-sm font-bold text-[#1A1A1A]">
          <div className="flex items-center gap-1.5 bg-[#F5F0E8] px-3 py-1.5 rounded-lg border-2 border-[#1A1A1A]">
            <Calendar size={14} />
            <span>{formatDate(trip.startDate)} - {formatDate(trip.endDate)}</span>
          </div>
          {trip.stops?.length > 0 && (
            <div className="flex items-center gap-1.5 bg-[#E8F5F0] px-3 py-1.5 rounded-lg border-2 border-[#1A1A1A]">
              <MapPin size={14} />
              <span>{trip.stops.length} Stops</span>
            </div>
          )}
        </div>
      </div>
    </Link>
  );
};

export default TripListPage;

import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link } from 'react-router-dom';
import { Loader2, Edit3, Check, X, MapPin, Calendar, Camera } from 'lucide-react';
import { getTrips } from '../api/trips.api';
import { getMe, updateMe } from '../api/user.api';
import { useAuthStore } from '../store/authStore';

const ProfilePage = () => {
  const { user: authUser, setUser } = useAuthStore();
  const [profile, setProfile] = useState(null);
  const [trips, setTrips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isEditing, setIsEditing] = useState(false);

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [profileRes, tripsRes] = await Promise.all([
          getMe(),
          getTrips()
        ]);
        
        const userData = profileRes.data?.user || profileRes.data || profileRes.user;
        setProfile(userData);
        
        // Reset form with fetched data
        reset({
          firstName: userData.firstName || '',
          lastName: userData.lastName || '',
          phone: userData.phone || '',
          city: userData.city || '',
          country: userData.country || '',
          bio: userData.bio || '',
        });

        const userTrips = tripsRes.data?.trips || tripsRes.trips || [];
        setTrips(userTrips);

      } catch (err) {
        setError('Failed to load profile data.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [reset]);

  const onUpdateProfile = async (data) => {
    try {
      const res = await updateMe(data);
      const updatedUser = res.data?.user || res.data || res.user;
      setProfile(updatedUser);
      setUser({ ...authUser, ...updatedUser }); // Update zustand store if needed
      setIsEditing(false);
    } catch (err) {
      setError('Failed to update profile.');
    }
  };

  const preplannedTrips = trips.filter(t => t.status === 'ONGOING' || t.status === 'PLANNING');
  const previousTrips = trips.filter(t => t.status === 'COMPLETED' || t.status === 'CANCELLED');

  if (loading) {
    return (
      <div className="min-h-full flex items-center justify-center p-8" style={{ backgroundColor: '#F5F0E8' }}>
        <Loader2 className="animate-spin text-[#F5C142]" size={40} />
      </div>
    );
  }

  const avatarUrl = profile?.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(profile?.name || 'User')}&background=F5C142&color=1A1A1A&size=200`;

  return (
    <div className="min-h-full px-8 md:px-14 py-8" style={{ backgroundColor: '#F5F0E8' }}>
      
      {error && (
        <div className="mb-6 rounded-2xl border-2 border-[#EF4444] bg-red-50 px-4 py-3 text-sm font-medium text-[#EF4444]">
          {error}
        </div>
      )}

      {/* Top Section: Profile Info */}
      <div className="flex flex-col md:flex-row gap-8 mb-12 items-start">
        {/* Avatar */}
        <div className="shrink-0 relative group">
          <div className="w-48 h-48 rounded-full border-4 border-[#1A1A1A] overflow-hidden bg-white" style={{ boxShadow: '6px 6px 0px #1A1A1A' }}>
            <img src={avatarUrl} alt="User Avatar" className="w-full h-full object-cover" />
          </div>
        </div>

        {/* User Details Box */}
        <div className="flex-1 bg-white rounded-3xl border-2 border-[#1A1A1A] p-8 w-full" style={{ boxShadow: '6px 6px 0px #1A1A1A' }}>
          {!isEditing ? (
            <div className="relative">
              <button 
                onClick={() => setIsEditing(true)}
                className="absolute top-0 right-0 p-2 text-[#1A1A1A] hover:bg-[#F5F0E8] rounded-xl transition-colors border-2 border-transparent hover:border-[#1A1A1A]"
                title="Edit Profile"
              >
                <Edit3 size={20} />
              </button>
              
              <h2 className="text-3xl font-black text-[#1A1A1A] mb-1">
                {profile?.firstName && profile?.lastName ? `${profile.firstName} ${profile.lastName}` : profile?.name}
              </h2>
              <p className="text-[#6B7280] font-bold text-sm mb-6">{profile?.email}</p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-y-4 gap-x-8 text-sm">
                <div>
                  <span className="block text-[#9CA3AF] font-bold mb-1 uppercase tracking-wider text-xs">Location</span>
                  <span className="text-[#1A1A1A] font-bold">
                    {(profile?.city || profile?.country) ? `${profile.city || ''}${profile.city && profile.country ? ', ' : ''}${profile.country || ''}` : 'Not set'}
                  </span>
                </div>
                <div>
                  <span className="block text-[#9CA3AF] font-bold mb-1 uppercase tracking-wider text-xs">Phone</span>
                  <span className="text-[#1A1A1A] font-bold">{profile?.phone || 'Not set'}</span>
                </div>
                <div className="md:col-span-2">
                  <span className="block text-[#9CA3AF] font-bold mb-1 uppercase tracking-wider text-xs">Bio</span>
                  <p className="text-[#1A1A1A] max-w-2xl">{profile?.bio || 'No bio provided.'}</p>
                </div>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit(onUpdateProfile)} className="space-y-4">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-black text-[#1A1A1A]">Edit Profile</h2>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-[#1A1A1A] mb-1 uppercase tracking-wider">First Name</label>
                  <input type="text" className="w-full bg-white border-2 border-[#1A1A1A] rounded-xl px-4 py-2.5 text-sm focus:outline-none" {...register('firstName')} />
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#1A1A1A] mb-1 uppercase tracking-wider">Last Name</label>
                  <input type="text" className="w-full bg-white border-2 border-[#1A1A1A] rounded-xl px-4 py-2.5 text-sm focus:outline-none" {...register('lastName')} />
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#1A1A1A] mb-1 uppercase tracking-wider">Phone</label>
                  <input type="tel" className="w-full bg-white border-2 border-[#1A1A1A] rounded-xl px-4 py-2.5 text-sm focus:outline-none" {...register('phone')} />
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#1A1A1A] mb-1 uppercase tracking-wider">City</label>
                  <input type="text" className="w-full bg-white border-2 border-[#1A1A1A] rounded-xl px-4 py-2.5 text-sm focus:outline-none" {...register('city')} />
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#1A1A1A] mb-1 uppercase tracking-wider">Country</label>
                  <input type="text" className="w-full bg-white border-2 border-[#1A1A1A] rounded-xl px-4 py-2.5 text-sm focus:outline-none" {...register('country')} />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-[#1A1A1A] mb-1 uppercase tracking-wider">Bio</label>
                <textarea rows={3} className="w-full bg-white border-2 border-[#1A1A1A] rounded-xl px-4 py-2.5 text-sm focus:outline-none resize-none" {...register('bio')} />
              </div>

              <div className="flex gap-3 pt-2">
                <button type="submit" disabled={isSubmitting} className="flex items-center gap-2 bg-[#F5C142] text-[#1A1A1A] font-black text-sm rounded-xl px-6 py-2.5 border-2 border-[#1A1A1A] hover:bg-[#E0AE30] transition-colors disabled:opacity-50" style={{ boxShadow: '2px 2px 0px #1A1A1A' }}>
                  {isSubmitting ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />} Save
                </button>
                <button type="button" onClick={() => setIsEditing(false)} className="flex items-center gap-2 bg-white text-[#1A1A1A] font-black text-sm rounded-xl px-4 py-2.5 border-2 border-[#1A1A1A] hover:bg-slate-50 transition-colors" style={{ boxShadow: '2px 2px 0px #1A1A1A' }}>
                  <X size={16} /> Cancel
                </button>
              </div>
            </form>
          )}
        </div>
      </div>

      {/* Preplanned Trips Section */}
      <div className="mb-12">
        <h2 className="text-2xl font-black text-[#1A1A1A] mb-6">Preplanned Trips</h2>
        {preplannedTrips.length > 0 ? (
          <div className="flex gap-6 overflow-x-auto pb-4 hide-scrollbar">
            {preplannedTrips.map(trip => (
              <ProfileTripCard key={trip.id} trip={trip} />
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-3xl border-2 border-[#1A1A1A] p-8 text-center max-w-md" style={{ boxShadow: '4px 4px 0px #1A1A1A' }}>
            <p className="text-[#6B7280] font-medium mb-4">No preplanned trips yet.</p>
            <Link to="/trips/new" className="inline-block bg-[#F5C142] text-[#1A1A1A] font-black text-sm rounded-full px-6 py-2.5 border-2 border-[#1A1A1A] hover:bg-[#E0AE30] transition-colors">
              Plan a Trip
            </Link>
          </div>
        )}
      </div>

      {/* Previous Trips Section */}
      <div>
        <h2 className="text-2xl font-black text-[#1A1A1A] mb-6">Previous Trips</h2>
        {previousTrips.length > 0 ? (
          <div className="flex gap-6 overflow-x-auto pb-4 hide-scrollbar">
            {previousTrips.map(trip => (
              <ProfileTripCard key={trip.id} trip={trip} />
            ))}
          </div>
        ) : (
          <p className="text-[#6B7280] font-medium">You don't have any completed trips yet.</p>
        )}
      </div>

    </div>
  );
};

// Mini Card Component for Profile Page
const ProfileTripCard = ({ trip }) => {
  const formatDate = (dateString) => {
    if (!dateString) return 'TBD';
    return new Date(dateString).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  return (
    <div className="bg-white rounded-3xl border-2 border-[#1A1A1A] p-6 w-[280px] shrink-0 flex flex-col h-[280px]" style={{ boxShadow: '6px 6px 0px #1A1A1A' }}>
      <div className="flex-1">
        <h3 className="text-xl font-black text-[#1A1A1A] mb-2 line-clamp-2">{trip.name}</h3>
        <p className="text-xs text-[#6B7280] font-bold mb-4 flex items-center gap-1.5">
          <Calendar size={12} /> {formatDate(trip.startDate)}
        </p>
        {trip.description && (
          <p className="text-sm text-[#1A1A1A] line-clamp-3 leading-relaxed">
            {trip.description}
          </p>
        )}
      </div>
      <div className="pt-4 mt-auto border-t-2 border-[#1A1A1A]/10">
        <Link 
          to={`/trips/${trip.id}`}
          className="block w-full text-center bg-white border-2 border-[#1A1A1A] rounded-xl py-2.5 text-sm font-black text-[#1A1A1A] hover:bg-[#1A1A1A] hover:text-white transition-colors"
        >
          View
        </Link>
      </div>
    </div>
  );
};

export default ProfilePage;

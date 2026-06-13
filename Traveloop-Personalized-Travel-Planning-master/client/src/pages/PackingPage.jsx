import React, { useState, useEffect } from 'react';
import { Search, Filter, SortDesc, Layers, ChevronDown, Check, Plus, RefreshCw, Share2, Loader2, ArrowLeft, Trash2 } from 'lucide-react';
import { Link, useParams } from 'react-router-dom';
import { getPackingItems, createPackingItem, updatePackingItem, deletePackingItem } from '../api/packing.api';
import { getTripById } from '../api/trips.api';
import { useForm } from 'react-hook-form';

const PACKING_CATEGORIES = ['CLOTHING', 'DOCUMENTS', 'ELECTRONICS', 'TOILETRIES', 'MEDICATIONS', 'MISCELLANEOUS'];

const PackingPage = () => {
  const { id } = useParams();
  const [items, setItems] = useState([]);
  const [trip, setTrip] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [groupBy, setGroupBy] = useState('category');
  const [filterBy, setFilterBy] = useState('all');
  const [sortBy, setSortBy] = useState('default');

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm({
    defaultValues: { category: 'CLOTHING' }
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      const tripRes = await getTripById(id);
      setTrip(tripRes.data?.trip || tripRes.data || tripRes.trip);

      const itemsRes = await getPackingItems(id);
      setItems(Array.isArray(itemsRes.data) ? itemsRes.data : (Array.isArray(itemsRes.data?.data) ? itemsRes.data.data : []));
    } catch (err) {
      setError('Failed to load packing items.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) fetchData();
  }, [id]);

  const toggleItem = async (item) => {
    try {
      const updated = { ...item, isPacked: !item.isPacked };
      // Optimistic UI update
      setItems(prev => prev.map(i => i.id === item.id ? updated : i));
      await updatePackingItem(item.id, { isPacked: updated.isPacked });
    } catch (err) {
      // Revert on error
      setItems(prev => prev.map(i => i.id === item.id ? item : i));
      setError('Failed to update item.');
    }
  };

  const onAddItem = async (data) => {
    try {
      setError(null);
      await createPackingItem({
        tripId: id,
        name: data.name,
        category: data.category || 'CLOTHING'
      });
      reset();
      setShowAddForm(false);
      fetchData();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to add item.');
    }
  };

  const handleDelete = async (itemId) => {
    try {
      await deletePackingItem(itemId);
      fetchData();
    } catch (err) {
      setError('Failed to delete item.');
    }
  };

  const resetAll = async () => {
    if (window.confirm('Are you sure you want to uncheck all items?')) {
      try {
        setLoading(true);
        const packedItems = items.filter(i => i.isPacked);
        await Promise.all(packedItems.map(item => updatePackingItem(item.id, { isPacked: false })));
        await fetchData();
      } catch (err) {
        setError('Failed to reset items.');
      } finally {
        setLoading(false);
      }
    }
  };

  // Process items: filter -> sort
  let processedItems = items.filter(item => {
    if (filterBy === 'packed') return item.isPacked;
    if (filterBy === 'unpacked') return !item.isPacked;
    return true;
  });

  if (sortBy === 'name') {
    processedItems.sort((a, b) => a.name.localeCompare(b.name));
  }

  // Group items by category
  const categories = PACKING_CATEGORIES.map(category => ({
    id: category,
    title: category.charAt(0) + category.slice(1).toLowerCase(),
    items: processedItems.filter(item => item.category === category)
  })).filter(cat => cat.items.length > 0 || (searchQuery === '' && filterBy === 'all' && cat.id !== 'MISCELLANEOUS')); // Show empty categories when not searching, except misc if empty

  // Compute progress
  const totalItems = items.length;
  const packedItemsCount = items.filter(i => i.isPacked).length;
  const progressPercentage = totalItems === 0 ? 0 : Math.round((packedItemsCount / totalItems) * 100);

  if (loading) {
    return (
      <div className="min-h-full flex items-center justify-center p-8" style={{ backgroundColor: '#F5F0E8' }}>
        <Loader2 className="animate-spin text-[#F5C142]" size={40} />
      </div>
    );
  }

  if (!trip) {
    return (
      <div className="min-h-full p-8 text-center" style={{ backgroundColor: '#F5F0E8' }}>
        <p className="text-[#1A1A1A] font-bold text-xl">Trip not found.</p>
        <Link to="/trips" className="mt-4 text-[#F5C142] underline">Go back to trips</Link>
      </div>
    );
  }

  return (
    <div className="min-h-full px-8 md:px-14 py-8" style={{ backgroundColor: '#F5F0E8' }}>
      
      {/* Search and Filters Row (Matches other pages) */}
      <div className="flex flex-col md:flex-row items-center gap-4 mb-10 w-full max-w-4xl mx-auto">
        <div className="relative flex-1 w-full">
          <Search size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#1A1A1A]" />
          <input
            type="text"
            placeholder="Search items..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-white border-2 border-[#1A1A1A] rounded-full py-3.5 pl-12 pr-6 text-sm font-bold
                     text-[#1A1A1A] placeholder-[#9CA3AF] focus:outline-none focus:ring-0"
            style={{ boxShadow: '4px 4px 0px #1A1A1A' }}
          />
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto overflow-x-auto pb-2 md:pb-0 hide-scrollbar">
          <select value={groupBy} onChange={e => setGroupBy(e.target.value)} className="cursor-pointer appearance-none flex items-center gap-2 bg-white border-2 border-[#1A1A1A] rounded-full px-6 py-3.5 text-sm font-bold text-[#1A1A1A] hover:bg-[#F5F0E8] transition-colors whitespace-nowrap" style={{ boxShadow: '4px 4px 0px #1A1A1A' }}>
            <option value="category">Group by: Category</option>
            <option value="none">Group by: None</option>
          </select>
          <select value={filterBy} onChange={e => setFilterBy(e.target.value)} className="cursor-pointer appearance-none flex items-center gap-2 bg-white border-2 border-[#1A1A1A] rounded-full px-6 py-3.5 text-sm font-bold text-[#1A1A1A] hover:bg-[#F5F0E8] transition-colors whitespace-nowrap" style={{ boxShadow: '4px 4px 0px #1A1A1A' }}>
            <option value="all">Filter: All</option>
            <option value="packed">Filter: Packed</option>
            <option value="unpacked">Filter: Unpacked</option>
          </select>
          <select value={sortBy} onChange={e => setSortBy(e.target.value)} className="cursor-pointer appearance-none flex items-center gap-2 bg-white border-2 border-[#1A1A1A] rounded-full px-6 py-3.5 text-sm font-bold text-[#1A1A1A] hover:bg-[#F5F0E8] transition-colors whitespace-nowrap" style={{ boxShadow: '4px 4px 0px #1A1A1A' }}>
            <option value="default">Sort by: Default</option>
            <option value="name">Sort by: Name</option>
          </select>
        </div>
      </div>

      <div className="max-w-4xl mx-auto">


        {error && (
          <div className="mb-6 rounded-2xl border-2 border-[#EF4444] bg-red-50 px-4 py-3 text-sm font-medium text-[#EF4444]">
            {error}
          </div>
        )}

        <h1 className="text-3xl font-black text-[#1A1A1A] mb-6">Packing checklist</h1>
        
        {/* Trip Selector & Add Item */}
        <div className="mb-8 flex flex-col md:flex-row justify-between gap-4">
          <button className="flex items-center justify-between w-full md:w-80 bg-white border-2 border-[#1A1A1A] rounded-2xl px-5 py-4 text-left font-bold text-[#1A1A1A] hover:bg-[#F5F0E8] transition-colors" style={{ boxShadow: '4px 4px 0px #1A1A1A' }}>
            <span className="truncate">Trip: {trip.name}</span>
            <ChevronDown size={20} className="shrink-0 ml-3" />
          </button>

          <button 
            onClick={() => setShowAddForm(!showAddForm)}
            className="flex items-center justify-center gap-2 bg-[#F5C142] border-2 border-[#1A1A1A] rounded-2xl px-8 py-4 text-sm font-black text-[#1A1A1A] hover:-translate-y-1 transition-transform" style={{ boxShadow: '4px 4px 0px #1A1A1A' }}
          >
            <Plus size={18} />
            {showAddForm ? 'Cancel' : 'Add item'}
          </button>
        </div>

        {showAddForm && (
          <div className="bg-white border-2 border-[#1A1A1A] rounded-3xl p-6 mb-8" style={{ boxShadow: '6px 6px 0px #1A1A1A' }}>
            <h3 className="text-xl font-black text-[#1A1A1A] mb-4">Add New Item</h3>
            <form onSubmit={handleSubmit(onAddItem)} className="flex flex-col md:flex-row gap-4 items-start md:items-end">
              <div className="flex-1 w-full">
                <label className="block text-xs font-bold text-[#6B7280] mb-1">Item Name</label>
                <input
                  type="text"
                  placeholder="E.g., Passport"
                  className="w-full bg-[#F5F0E8] border-2 border-[#1A1A1A] rounded-xl px-4 py-3 text-sm font-bold text-[#1A1A1A] focus:outline-none"
                  {...register('name', { required: 'Name is required' })}
                />
                {errors.name && <p className="text-xs text-[#EF4444] mt-1">{errors.name.message}</p>}
              </div>
              <div className="w-full md:w-64">
                <label className="block text-xs font-bold text-[#6B7280] mb-1">Category</label>
                <select
                  className="w-full bg-[#F5F0E8] border-2 border-[#1A1A1A] rounded-xl px-4 py-3 text-sm font-bold text-[#1A1A1A] focus:outline-none"
                  {...register('category', { required: 'Category is required' })}
                >
                  <option value="CLOTHING">Clothing</option>
                  <option value="DOCUMENTS">Documents</option>
                  <option value="ELECTRONICS">Electronics</option>
                  <option value="TOILETRIES">Toiletries</option>
                  <option value="MEDICATIONS">Medications</option>
                  <option value="MISCELLANEOUS">Miscellaneous</option>
                </select>
              </div>
              <button 
                type="submit"
                disabled={isSubmitting}
                className="w-full md:w-auto flex items-center justify-center gap-2 bg-[#1A1A1A] text-white font-black text-sm rounded-xl px-8 py-3 border-2 border-[#1A1A1A] hover:bg-gray-800 transition-colors h-[48px]"
              >
                {isSubmitting ? <Loader2 size={16} className="animate-spin" /> : 'Save'}
              </button>
            </form>
          </div>
        )}

        {/* Progress Bar */}
        <div className="mb-10">
          <div className="flex justify-between items-end mb-2">
            <span className="text-lg font-black text-[#1A1A1A]">Progress: {packedItemsCount}/{totalItems} items packed</span>
            <span className="text-sm font-bold text-[#6B7280]">{progressPercentage}%</span>
          </div>
          <div className="h-4 w-full bg-white border-2 border-[#1A1A1A] rounded-full overflow-hidden" style={{ boxShadow: '2px 2px 0px #1A1A1A' }}>
            <div 
              className="h-full bg-[#F5C142] border-r-2 border-[#1A1A1A] transition-all duration-300 ease-out"
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
        </div>

        {/* Checklist Categories */}
        <div className="space-y-8 mb-12">
          {categories.length === 0 && totalItems === 0 && (
             <div className="text-center py-8 bg-white border-2 border-[#1A1A1A] rounded-3xl p-6" style={{ boxShadow: '6px 6px 0px #1A1A1A' }}>
               <p className="text-lg font-bold text-[#1A1A1A] mb-2">Your packing list is empty</p>
               <p className="text-[#6B7280] text-sm">Add items above to start packing for {trip.name}!</p>
             </div>
          )}

          {groupBy === 'category' ? categories.map(cat => {
            // Filter items by search query
            const visibleItems = cat.items.filter(item => 
              item.name.toLowerCase().includes(searchQuery.toLowerCase())
            );

            if (visibleItems.length === 0 && searchQuery !== '') return null;
            if (visibleItems.length === 0 && cat.items.length === 0) return null; // Don't show empty categories unless searching (handled above)

            const catPacked = cat.items.filter(i => i.isPacked).length;
            const catTotal = cat.items.length;

            return (
              <div key={cat.id} className="bg-white border-2 border-[#1A1A1A] rounded-3xl p-6" style={{ boxShadow: '6px 6px 0px #1A1A1A' }}>
                {/* Category Header */}
                <div className="flex justify-between items-center mb-6 pb-4 border-b-2 border-[#E5E7EB]">
                  <h2 className="text-xl font-black text-[#1A1A1A]">{cat.title}</h2>
                  <span className="text-sm font-bold bg-[#F5F0E8] px-3 py-1 rounded-full border-2 border-[#1A1A1A]">
                    {catPacked}/{catTotal}
                  </span>
                </div>

                {/* Items */}
                <div className="space-y-4">
                  {visibleItems.length === 0 ? (
                    <p className="text-sm font-bold text-[#6B7280]">No items in this category.</p>
                  ) : (
                    visibleItems.map(item => (
                      <div key={item.id} className="flex justify-between items-center group cursor-pointer hover:bg-slate-50 p-2 -mx-2 rounded-xl transition-colors">
                        <label className="flex flex-1 items-center gap-4 cursor-pointer">
                          <div className="relative flex items-center justify-center">
                            <input 
                              type="checkbox" 
                              checked={item.isPacked}
                              onChange={() => toggleItem(item)}
                              className="peer sr-only"
                            />
                            <div className={`w-7 h-7 rounded-lg border-2 transition-all duration-200 flex items-center justify-center
                                          ${item.isPacked ? 'bg-[#F5C142] border-[#1A1A1A]' : 'bg-white border-[#1A1A1A] group-hover:border-[#F5C142]'}`}
                                style={{ boxShadow: item.isPacked ? 'none' : '2px 2px 0px #1A1A1A' }}>
                              {item.isPacked && <Check size={16} className="text-[#1A1A1A]" strokeWidth={4} />}
                            </div>
                          </div>
                          <span className={`text-lg transition-colors duration-200 font-bold ${item.isPacked ? 'text-[#9CA3AF] line-through' : 'text-[#1A1A1A]'}`}>
                            {item.name}
                          </span>
                        </label>
                        <button 
                          onClick={() => handleDelete(item.id)}
                          className="w-8 h-8 rounded-full bg-[#F5F0E8] border-2 border-[#1A1A1A] flex items-center justify-center hover:bg-red-400 transition-colors opacity-0 group-hover:opacity-100"
                        >
                          <Trash2 size={14} className="text-[#1A1A1A]" />
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>
            );
          }) : (
            <div className="bg-white border-2 border-[#1A1A1A] rounded-3xl p-6" style={{ boxShadow: '6px 6px 0px #1A1A1A' }}>
              <div className="space-y-4">
                {processedItems.filter(item => item.name.toLowerCase().includes(searchQuery.toLowerCase())).map(item => (
                  <div key={item.id} className="flex justify-between items-center group cursor-pointer hover:bg-slate-50 p-2 -mx-2 rounded-xl transition-colors">
                    <label className="flex flex-1 items-center gap-4 cursor-pointer">
                      <div className="relative flex items-center justify-center">
                        <input 
                          type="checkbox" 
                          checked={item.isPacked}
                          onChange={() => toggleItem(item)}
                          className="peer sr-only"
                        />
                        <div className={`w-7 h-7 rounded-lg border-2 transition-all duration-200 flex items-center justify-center
                                      ${item.isPacked ? 'bg-[#F5C142] border-[#1A1A1A]' : 'bg-white border-[#1A1A1A] group-hover:border-[#F5C142]'}`}
                            style={{ boxShadow: item.isPacked ? 'none' : '2px 2px 0px #1A1A1A' }}>
                          {item.isPacked && <Check size={16} className="text-[#1A1A1A]" strokeWidth={4} />}
                        </div>
                      </div>
                      <span className={`text-lg transition-colors duration-200 font-bold ${item.isPacked ? 'text-[#9CA3AF] line-through' : 'text-[#1A1A1A]'}`}>
                        {item.name}
                      </span>
                      <span className="text-xs text-gray-400 font-bold ml-2">({item.category})</span>
                    </label>
                    <button 
                      onClick={() => handleDelete(item.id)}
                      className="w-8 h-8 rounded-full bg-[#F5F0E8] border-2 border-[#1A1A1A] flex items-center justify-center hover:bg-red-400 transition-colors opacity-0 group-hover:opacity-100"
                    >
                      <Trash2 size={14} className="text-[#1A1A1A]" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {searchQuery !== '' && categories.every(cat => cat.items.filter(item => item.name.toLowerCase().includes(searchQuery.toLowerCase())).length === 0) && (
            <div className="text-center py-8 text-[#6B7280] font-bold">
              No items match your search.
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <button 
            onClick={resetAll}
            disabled={packedItemsCount === 0 || loading}
            className="flex items-center justify-center gap-2 bg-white border-2 border-[#1A1A1A] rounded-full px-8 py-4 text-sm font-black text-[#1A1A1A] hover:-translate-y-1 transition-transform disabled:opacity-50 disabled:hover:translate-y-0" style={{ boxShadow: '4px 4px 0px #1A1A1A' }}>
            {loading ? <Loader2 size={18} className="animate-spin" /> : <RefreshCw size={18} />}
            Reset all
          </button>
          <button className="flex items-center justify-center gap-2 bg-white border-2 border-[#1A1A1A] rounded-full px-8 py-4 text-sm font-black text-[#1A1A1A] hover:-translate-y-1 transition-transform" style={{ boxShadow: '4px 4px 0px #1A1A1A' }}>
            <Share2 size={18} />
            Share Checklist
          </button>
        </div>

      </div>
    </div>
  );
};

export default PackingPage;

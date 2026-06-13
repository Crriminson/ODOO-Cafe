import React, { useState, useEffect } from 'react';
import { Search, Filter, SortDesc, ArrowLeft, Download, FileText, CheckCircle, PieChart, Image as ImageIcon, Plus, Trash2, Loader2 } from 'lucide-react';
import { Link, useParams } from 'react-router-dom';
import { getTripById, updateTrip } from '../api/trips.api';
import { getExpenses, createExpense, deleteExpense } from '../api/expenses.api';
import { useForm } from 'react-hook-form';

const BudgetPage = () => {
  const { id } = useParams();
  const [searchQuery, setSearchQuery] = useState('');
  const [trip, setTrip] = useState(null);
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingBudget, setEditingBudget] = useState(false);
  const [newBudget, setNewBudget] = useState('');

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm();

  const fetchData = async () => {
    try {
      setLoading(true);
      const tripRes = await getTripById(id);
      const tripData = tripRes.data?.data || tripRes.data?.trip || tripRes.data || tripRes.trip;
      setTrip(tripData);

      const expRes = await getExpenses(id);
      setExpenses(Array.isArray(expRes.data) ? expRes.data : (Array.isArray(expRes.data?.data) ? expRes.data.data : []));
    } catch (err) {
      setError('Failed to load budget data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) fetchData();
  }, [id]);

  const onAddExpense = async (data) => {
    try {
      setError(null);
      const payload = {
        tripId: id,
        category: data.category,
        amount: parseFloat(data.amount)
      };
      if (data.description?.trim()) payload.description = data.description;
      if (data.date) payload.date = new Date(data.date).toISOString();

      await createExpense(payload);
      reset();
      setShowAddForm(false);
      fetchData();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to add expense.');
    }
  };

  const handleUpdateBudget = async () => {
    try {
      setError(null);
      const budgetVal = parseFloat(newBudget);
      if (isNaN(budgetVal) || budgetVal < 0) return setError("Invalid budget amount.");
      await updateTrip(id, { totalBudget: budgetVal });
      setTrip(prev => ({ ...prev, totalBudget: budgetVal }));
      setEditingBudget(false);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to update budget");
    }
  };

  const handleDelete = async (expenseId) => {
    if (window.confirm('Are you sure you want to delete this expense?')) {
      try {
        await deleteExpense(expenseId);
        fetchData();
      } catch (err) {
        setError('Failed to delete expense.');
      }
    }
  };

  const filteredExpenses = expenses.filter(e => 
    e.description?.toLowerCase().includes(searchQuery.toLowerCase()) || 
    e.category?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalSpent = expenses.reduce((acc, curr) => acc + curr.amount, 0);
  const totalBudget = trip?.totalBudget || 0;
  const remaining = totalBudget - totalSpent;

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
      
      {/* Top Controls Row */}
      <div className="flex flex-col md:flex-row items-center justify-end gap-4 mb-8 w-full max-w-6xl mx-auto">
        <div className="relative w-full md:w-80">
          <Search size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#1A1A1A]" />
          <input
            type="text"
            placeholder="Search expenses..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-white border-2 border-[#1A1A1A] rounded-full py-2.5 pl-12 pr-6 text-sm font-bold
                     text-[#1A1A1A] placeholder-[#9CA3AF] focus:outline-none focus:ring-0"
            style={{ boxShadow: '4px 4px 0px #1A1A1A' }}
          />
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <button className="flex-1 md:flex-none flex justify-center items-center gap-2 bg-white border-2 border-[#1A1A1A] rounded-full px-6 py-2.5 text-sm font-bold text-[#1A1A1A] hover:bg-[#F5F0E8] transition-colors whitespace-nowrap" style={{ boxShadow: '4px 4px 0px #1A1A1A' }}>
            <Filter size={16} /> Filter
          </button>
          <button className="flex-1 md:flex-none flex justify-center items-center gap-2 bg-white border-2 border-[#1A1A1A] rounded-full px-6 py-2.5 text-sm font-bold text-[#1A1A1A] hover:bg-[#F5F0E8] transition-colors whitespace-nowrap" style={{ boxShadow: '4px 4px 0px #1A1A1A' }}>
            <SortDesc size={16} /> Sort By
          </button>
        </div>
      </div>

      <div className="max-w-6xl mx-auto">



        {error && (
          <div className="mb-6 rounded-2xl border-2 border-[#EF4444] bg-red-50 px-4 py-3 text-sm font-medium text-[#EF4444]">
            {error}
          </div>
        )}

        {/* Top Cards Row */}
        <div className="flex flex-col lg:flex-row gap-6 mb-8">
          
          {/* Main Invoice Header Card */}
          <div className="flex-1 bg-white border-2 border-[#1A1A1A] rounded-[40px] p-8" style={{ boxShadow: '8px 8px 0px #1A1A1A' }}>
            <div className="flex flex-col md:flex-row gap-8">
              
              {/* Image & Trip Info */}
              <div className="flex items-center gap-6 md:w-1/2">
                <div className="w-32 h-32 shrink-0 bg-[#F5F0E8] border-2 border-[#1A1A1A] rounded-2xl flex items-center justify-center">
                  <ImageIcon size={48} className="text-[#9CA3AF]" />
                </div>
                <div>
                  <h2 className="text-xl font-black text-[#1A1A1A] mb-2">{trip.name}</h2>
                  <p className="text-xs font-bold text-[#6B7280] leading-relaxed">
                    {trip.startDate ? new Date(trip.startDate).toLocaleDateString() : 'TBD'} - {trip.endDate ? new Date(trip.endDate).toLocaleDateString() : 'TBD'}
                  </p>
                </div>
              </div>

              {/* Invoice Details Grid */}
              <div className="flex-1 grid grid-cols-2 gap-y-6 text-sm">
                <div>
                  <p className="text-[#6B7280] font-bold mb-1">Invoice Id</p>
                  <p className="text-[#1A1A1A] font-black">INV-{id.substring(0, 8)}</p>
                </div>
                <div>
                  <p className="text-[#6B7280] font-bold mb-1">Generated date</p>
                  <p className="text-[#1A1A1A] font-black">{new Date().toLocaleDateString()}</p>
                </div>
                <div>
                  <p className="text-[#6B7280] font-bold mb-1">Payment status</p>
                  <p className="text-[#F5C142] font-black uppercase">- pending</p>
                </div>
              </div>

            </div>
          </div>

          {/* Budget Insights Card */}
          <div className="w-full lg:w-80 shrink-0 bg-white border-2 border-[#1A1A1A] rounded-[40px] p-8 flex flex-col justify-between" style={{ boxShadow: '8px 8px 0px #1A1A1A' }}>
            <h3 className="text-sm font-black text-[#1A1A1A] mb-6 flex items-center gap-2">
              <PieChart size={16} /> budget Insights
            </h3>
            
            <div className="flex items-center gap-6 mb-6">
              <div className="w-20 h-20 shrink-0 rounded-full border-4 border-[#1A1A1A] relative" style={{ background: `conic-gradient(#EF4444 0% ${(totalSpent/totalBudget)*100}%, #F5F0E8 ${(totalSpent/totalBudget)*100}% 100%)` }}>
                <div className="absolute top-1/2 left-1/2 w-10 h-10 bg-white rounded-full -translate-x-1/2 -translate-y-1/2 border-2 border-[#1A1A1A]"></div>
              </div>
              
              <div className="text-sm space-y-2">
                <div className="flex justify-between gap-4">
                  <span className="text-[#6B7280] font-bold">Total Budget:</span>
                  {editingBudget ? (
                    <div className="flex gap-2">
                      <input type="number" className="w-20 px-1 text-[#1A1A1A] font-black border-2 border-[#1A1A1A] rounded focus:outline-none" value={newBudget} onChange={(e) => setNewBudget(e.target.value)} />
                      <button onClick={handleUpdateBudget} className="text-xs bg-[#F5C142] border-2 border-[#1A1A1A] px-2 font-bold rounded hover:bg-[#E0AE30]">Save</button>
                    </div>
                  ) : (
                    <span className="text-[#1A1A1A] font-black cursor-pointer hover:underline" title="Click to edit" onClick={() => { setNewBudget(totalBudget.toString()); setEditingBudget(true); }}>
                      ₹{totalBudget.toFixed(2)}
                    </span>
                  )}
                </div>
                <div className="flex justify-between gap-4">
                  <span className="text-[#6B7280] font-bold">Total Spent:</span>
                  <span className="text-[#1A1A1A] font-black">₹{totalSpent.toFixed(2)}</span>
                </div>
                <div className="flex justify-between gap-4">
                  <span className="text-[#6B7280] font-bold">Remaining:</span>
                  <span className={`font-black ${remaining < 0 ? 'text-[#EF4444]' : 'text-[#22C55E]'}`}>₹{remaining.toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>

        </div>

        {/* Expenses List */}
        <div className="bg-white border-2 border-[#1A1A1A] rounded-[40px] overflow-hidden mb-8" style={{ boxShadow: '8px 8px 0px #1A1A1A' }}>
          
          <div className="p-6 border-b-2 border-[#1A1A1A] flex justify-between items-center bg-[#F5F0E8]">
            <h3 className="text-xl font-black text-[#1A1A1A]">Expenses</h3>
            <button 
              onClick={() => setShowAddForm(!showAddForm)}
              className="flex items-center gap-2 bg-[#1A1A1A] text-white font-black text-sm rounded-xl px-4 py-2 border-2 border-[#1A1A1A] hover:bg-gray-800 transition-colors"
            >
              <Plus size={16} /> Add Expense
            </button>
          </div>

          {showAddForm && (
            <form onSubmit={handleSubmit(onAddExpense)} className="p-6 border-b-2 border-[#1A1A1A] bg-gray-50 flex flex-wrap gap-4 items-end">
              <div className="flex-1 min-w-[200px]">
                <label className="block text-xs font-bold text-[#6B7280] mb-1">Description</label>
                <input
                  type="text"
                  className="w-full bg-white border-2 border-[#1A1A1A] rounded-xl px-3 py-2 text-sm font-bold text-[#1A1A1A] focus:outline-none"
                  {...register('description', { required: 'Required' })}
                />
              </div>
              <div className="w-full md:w-48">
                <label className="block text-xs font-bold text-[#6B7280] mb-1">Category</label>
                <select
                  className="w-full bg-white border-2 border-[#1A1A1A] rounded-xl px-3 py-2 text-sm font-bold text-[#1A1A1A] focus:outline-none"
                  {...register('category', { required: 'Required' })}
                >
                  <option value="TRANSPORT">Transport</option>
                  <option value="ACCOMMODATION">Accommodation</option>
                  <option value="ACTIVITIES">Activities</option>
                  <option value="MEALS">Meals</option>
                  <option value="SHOPPING">Shopping</option>
                  <option value="MISCELLANEOUS">Miscellaneous</option>
                </select>
              </div>
              <div className="w-full md:w-32">
                <label className="block text-xs font-bold text-[#6B7280] mb-1">Amount (₹)</label>
                <input
                  type="number"
                  step="0.01"
                  className="w-full bg-white border-2 border-[#1A1A1A] rounded-xl px-3 py-2 text-sm font-bold text-[#1A1A1A] focus:outline-none"
                  {...register('amount', { required: 'Required' })}
                />
              </div>
              <div className="w-full md:w-40">
                <label className="block text-xs font-bold text-[#6B7280] mb-1">Date</label>
                <input
                  type="date"
                  className="w-full bg-white border-2 border-[#1A1A1A] rounded-xl px-3 py-2 text-sm font-bold text-[#1A1A1A] focus:outline-none"
                  {...register('date')}
                />
              </div>
              <button 
                type="submit"
                disabled={isSubmitting}
                className="bg-[#F5C142] text-[#1A1A1A] font-black text-sm rounded-xl px-6 py-2.5 border-2 border-[#1A1A1A] hover:bg-[#E0AE30] disabled:opacity-50 transition-colors h-[42px]"
              >
                {isSubmitting ? <Loader2 size={16} className="animate-spin" /> : 'Save'}
              </button>
            </form>
          )}

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-[#1A1A1A] text-white">
                <tr>
                  <th className="px-6 py-4 font-black border-r border-[#374151]">Category</th>
                  <th className="px-6 py-4 font-black border-r border-[#374151]">Description</th>
                  <th className="px-6 py-4 font-black border-r border-[#374151]">Date</th>
                  <th className="px-6 py-4 font-black border-r border-[#374151]">Amount</th>
                  <th className="px-6 py-4 font-black">Actions</th>
                </tr>
              </thead>
              <tbody className="text-[#1A1A1A] font-bold">
                {filteredExpenses.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="px-6 py-8 text-center text-[#6B7280]">No expenses found.</td>
                  </tr>
                ) : (
                  filteredExpenses.map((item) => (
                    <tr key={item.id} className="border-b-2 border-[#E5E7EB] hover:bg-[#F9FAFB] transition-colors">
                      <td className="px-6 py-4 border-r-2 border-[#E5E7EB]">{item.category}</td>
                      <td className="px-6 py-4 border-r-2 border-[#E5E7EB]">{item.description || '-'}</td>
                      <td className="px-6 py-4 border-r-2 border-[#E5E7EB]">{item.date ? new Date(item.date).toLocaleDateString() : '-'}</td>
                      <td className="px-6 py-4 border-r-2 border-[#E5E7EB]">₹{item.amount.toFixed(2)}</td>
                      <td className="px-6 py-4">
                        <button onClick={() => handleDelete(item.id)} className="text-[#EF4444] hover:text-red-700">
                          <Trash2 size={16} />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Totals Section */}
          <div className="flex justify-end bg-[#F9FAFB] p-8 border-t-2 border-[#1A1A1A]">
            <div className="w-full sm:w-64 space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="font-bold text-[#6B7280]">Subtotal</span>
                <span className="font-black text-[#1A1A1A]">₹{totalSpent.toFixed(2)}</span>
              </div>
              <div className="flex justify-between border-b-2 border-[#E5E7EB] pb-3">
                <span className="font-bold text-[#6B7280]">tax(0%)</span>
                <span className="font-black text-[#1A1A1A]">₹ 0.00</span>
              </div>
              <div className="flex justify-between pt-1">
                <span className="font-black text-lg text-[#1A1A1A]">Grand Total</span>
                <span className="font-black text-lg text-[#1A1A1A]">₹{totalSpent.toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex flex-col sm:flex-row justify-between gap-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <button className="flex items-center justify-center gap-2 bg-white border-2 border-[#1A1A1A] rounded-full px-8 py-3.5 text-sm font-black text-[#1A1A1A] hover:bg-[#F5F0E8] transition-colors" style={{ boxShadow: '4px 4px 0px #1A1A1A' }}>
              <Download size={18} /> Download Invoice
            </button>
            <button className="flex items-center justify-center gap-2 bg-white border-2 border-[#1A1A1A] rounded-full px-8 py-3.5 text-sm font-black text-[#1A1A1A] hover:bg-[#F5F0E8] transition-colors" style={{ boxShadow: '4px 4px 0px #1A1A1A' }}>
              <FileText size={18} /> Export as PDF
            </button>
          </div>
          
          <button className="flex items-center justify-center gap-2 bg-[#F5C142] border-2 border-[#1A1A1A] rounded-full px-12 py-3.5 text-sm font-black text-[#1A1A1A] hover:-translate-y-1 transition-transform" style={{ boxShadow: '4px 4px 0px #1A1A1A' }}>
            <CheckCircle size={18} /> Mark as paid
          </button>
        </div>

      </div>
    </div>
  );
};

export default BudgetPage;


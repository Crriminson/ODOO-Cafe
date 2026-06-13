import React, { useState, useEffect } from 'react';
import { Search, Filter, SortDesc, Layers, ChevronDown, Plus, Edit2, Trash2, ArrowLeft, Loader2, X, Check } from 'lucide-react';
import { useParams, Link } from 'react-router-dom';
import { getNotes, createNote, deleteNote, updateNote } from '../api/notes.api';
import { getTripById } from '../api/trips.api';
import { useForm } from 'react-hook-form';

const NotesPage = () => {
  const { id } = useParams();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState('ALL'); // ALL, DAY, STOP
  const [notes, setNotes] = useState([]);
  const [trip, setTrip] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingNoteId, setEditingNoteId] = useState(null);

  const { register, handleSubmit, reset, formState: { errors, isSubmitting }, setValue } = useForm();

  const fetchData = async () => {
    try {
      setLoading(true);
      const tripRes = await getTripById(id);
      setTrip(tripRes.data?.trip || tripRes.data || tripRes.trip);

      const notesRes = await getNotes(id);
      setNotes(Array.isArray(notesRes.data) ? notesRes.data : (Array.isArray(notesRes.data?.data) ? notesRes.data.data : []));
    } catch (err) {
      setError('Failed to load notes data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) fetchData();
  }, [id]);

  const onAddOrUpdateNote = async (data) => {
    try {
      if (editingNoteId) {
        await updateNote(editingNoteId, {
          title: data.title,
          content: data.content
        });
      } else {
        await createNote({
          tripId: id,
          title: data.title,
          content: data.content
        });
      }
      reset();
      setShowAddForm(false);
      setEditingNoteId(null);
      fetchData();
    } catch (err) {
      setError('Failed to save note.');
    }
  };

  const handleEditClick = (note) => {
    setEditingNoteId(note.id);
    setShowAddForm(true);
    setValue('title', note.title);
    setValue('content', note.content);
  };

  const handleDelete = async (noteId) => {
    if (window.confirm('Are you sure you want to delete this note?')) {
      try {
        await deleteNote(noteId);
        fetchData();
      } catch (err) {
        setError('Failed to delete note.');
      }
    }
  };

  const filteredNotes = notes.filter(note => 
    (note.title && note.title.toLowerCase().includes(searchQuery.toLowerCase())) || 
    note.content.toLowerCase().includes(searchQuery.toLowerCase())
  );

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
      
      {/* Search and Filters Row */}
      <div className="flex flex-col md:flex-row items-center gap-4 mb-10 w-full max-w-4xl mx-auto">
        <div className="relative flex-1 w-full">
          <Search size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#1A1A1A]" />
          <input
            type="text"
            placeholder="Search notes..."
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

      <div className="max-w-4xl mx-auto">
        <Link to={`/trips/${id}`} className="inline-flex items-center gap-2 text-sm font-black text-[#1A1A1A] hover:underline mb-6">
          <ArrowLeft size={16} /> back to Trip
        </Link>
        
        {error && (
          <div className="mb-6 rounded-2xl border-2 border-[#EF4444] bg-red-50 px-4 py-3 text-sm font-medium text-[#EF4444]">
            {error}
          </div>
        )}

        <h1 className="text-3xl font-black text-[#1A1A1A] mb-6">Trip notes</h1>
        
        {/* Controls Row */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 mb-8">
          
          {/* Trip Selector */}
          <button className="flex items-center justify-between w-full sm:w-80 bg-white border-2 border-[#1A1A1A] rounded-2xl px-5 py-3.5 text-left font-bold text-[#1A1A1A] hover:bg-[#F5F0E8] transition-colors" style={{ boxShadow: '4px 4px 0px #1A1A1A' }}>
            <span className="truncate">Trip: {trip.name}</span>
            <ChevronDown size={20} className="shrink-0 ml-3" />
          </button>

          {/* Add Note Button */}
          <button 
            onClick={() => {
              reset();
              setEditingNoteId(null);
              setShowAddForm(!showAddForm);
            }}
            className="flex items-center justify-center gap-2 bg-[#F5C142] border-2 border-[#1A1A1A] rounded-full px-6 py-3.5 text-sm font-black text-[#1A1A1A] hover:-translate-y-1 transition-transform" style={{ boxShadow: '4px 4px 0px #1A1A1A' }}
          >
            <Plus size={18} />
            {showAddForm ? 'Cancel' : 'Add Note'}
          </button>
        </div>

        {/* View Toggle Pills */}
        <div className="flex flex-wrap items-center gap-3 mb-8">
          {[
            { id: 'ALL', label: 'All' },
            { id: 'DAY', label: 'by Day' },
            { id: 'STOP', label: 'by stop' }
          ].map(view => (
            <button
              key={view.id}
              onClick={() => setViewMode(view.id)}
              className={`border-2 border-[#1A1A1A] rounded-full px-8 py-2 text-sm font-bold transition-all duration-200
                        ${viewMode === view.id ? 'bg-[#1A1A1A] text-white' : 'bg-white text-[#1A1A1A] hover:bg-[#F5F0E8]'}`}
              style={{ boxShadow: viewMode === view.id ? '4px 4px 0px #F5C142' : '4px 4px 0px #1A1A1A' }}
            >
              {view.label}
            </button>
          ))}
        </div>

        {/* Add/Edit Note Form */}
        {showAddForm && (
          <div className="bg-white border-2 border-[#1A1A1A] rounded-3xl p-6 mb-8" style={{ boxShadow: '6px 6px 0px #1A1A1A' }}>
            <h3 className="text-xl font-black text-[#1A1A1A] mb-4">{editingNoteId ? 'Edit Note' : 'Add New Note'}</h3>
            <form onSubmit={handleSubmit(onAddOrUpdateNote)} className="space-y-4">
              <div>
                <input
                  type="text"
                  placeholder="Note Title (Optional)"
                  className="w-full bg-[#F5F0E8] border-2 border-[#1A1A1A] rounded-xl px-4 py-3 text-sm font-bold text-[#1A1A1A] focus:outline-none"
                  {...register('title')}
                />
              </div>
              <div>
                <textarea
                  placeholder="Note Content"
                  rows={4}
                  className="w-full bg-[#F5F0E8] border-2 border-[#1A1A1A] rounded-xl px-4 py-3 text-sm font-bold text-[#1A1A1A] focus:outline-none resize-none"
                  {...register('content', { required: 'Content is required' })}
                />
                {errors.content && <p className="text-xs text-[#EF4444] mt-1">{errors.content.message}</p>}
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button 
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="flex items-center gap-2 bg-white text-[#1A1A1A] font-black text-sm rounded-xl px-4 py-2 border-2 border-[#1A1A1A] hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  disabled={isSubmitting}
                  className="flex items-center gap-2 bg-[#F5C142] text-[#1A1A1A] font-black text-sm rounded-xl px-6 py-2 border-2 border-[#1A1A1A] hover:bg-[#E0AE30] transition-colors disabled:opacity-50"
                >
                  {isSubmitting ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />} Save
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Notes List */}
        <div className="space-y-6">
          {filteredNotes.length > 0 ? (
            filteredNotes.map(note => (
              <div 
                key={note.id}
                className="bg-white border-2 border-[#1A1A1A] rounded-3xl p-6 group hover:-translate-y-1 transition-transform duration-200 relative"
                style={{ boxShadow: '6px 6px 0px #1A1A1A' }}
              >
                {/* Action Icons */}
                <div className="absolute top-6 right-6 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button 
                    onClick={() => handleEditClick(note)}
                    className="w-8 h-8 rounded-full bg-[#F5F0E8] border-2 border-[#1A1A1A] flex items-center justify-center hover:bg-[#F5C142] transition-colors" title="Edit Note"
                  >
                    <Edit2 size={14} className="text-[#1A1A1A]" />
                  </button>
                  <button 
                    onClick={() => handleDelete(note.id)}
                    className="w-8 h-8 rounded-full bg-[#F5F0E8] border-2 border-[#1A1A1A] flex items-center justify-center hover:bg-red-400 transition-colors" title="Delete Note"
                  >
                    <Trash2 size={14} className="text-[#1A1A1A]" />
                  </button>
                </div>

                {/* Content */}
                <div className="pr-20"> {/* Padding to prevent text from overlapping icons */}
                  {note.title && <h3 className="text-lg font-black text-[#1A1A1A] mb-2">{note.title}</h3>}
                  <p className="text-[#6B7280] mb-4 text-sm leading-relaxed whitespace-pre-wrap">
                    {note.content}
                  </p>
                  <div className="text-xs font-bold text-[#1A1A1A] bg-[#F5F0E8] inline-block px-3 py-1 rounded-lg border-2 border-[#1A1A1A]">
                    {new Date(note.createdAt).toLocaleDateString()}
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="bg-white rounded-3xl border-2 border-[#1A1A1A] p-12 text-center" style={{ boxShadow: '6px 6px 0px #1A1A1A' }}>
              <p className="text-lg font-bold text-[#1A1A1A] mb-2">No notes found</p>
              <p className="text-[#6B7280] text-sm">Create a new note or adjust your search.</p>
            </div>
          )}
        </div>

      </div>
    </div>
  );
};

export default NotesPage;

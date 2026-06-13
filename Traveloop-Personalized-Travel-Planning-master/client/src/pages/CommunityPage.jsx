import React, { useState, useEffect } from 'react';
import { Search, Filter, SortDesc, Layers, Heart, MessageSquare, Share2, Loader2, Send } from 'lucide-react';
import { getCommunityPosts, createCommunityPost, likeCommunityPost, addCommunityComment } from '../api/community.api';
import { useAuthStore } from '../store/authStore';

const CommunityPage = () => {
  const { user } = useAuthStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState('ALL');
  const [sortBy, setSortBy] = useState('POPULAR');
  const [groupBy, setGroupBy] = useState(false);

  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // New post state
  const [newTitle, setNewTitle] = useState('');
  const [newContent, setNewContent] = useState('');
  const [newCategory, setNewCategory] = useState('TIPS');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchPosts();
  }, []);

  const fetchPosts = async () => {
    try {
      setLoading(true);
      const res = await getCommunityPosts();
      setPosts(res.data || res);
      setError(null);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch community posts');
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePost = async (e) => {
    e.preventDefault();
    if (!newTitle.trim() || !newContent.trim()) return;
    
    try {
      setSubmitting(true);
      await createCommunityPost({
        title: newTitle,
        content: newContent,
        category: newCategory
      });
      setNewTitle('');
      setNewContent('');
      await fetchPosts();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create post');
    } finally {
      setSubmitting(false);
    }
  };

  const handleLike = async (postId) => {
    try {
      await likeCommunityPost(postId);
      // Optimistically update
      setPosts(prev => prev.map(p => 
        p.id === postId ? { ...p, likes: p.likes + 1 } : p
      ));
    } catch (err) {
      console.error(err);
    }
  };

  const filteredPosts = [...posts].filter(post => {
    const matchesSearch = post.title?.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          post.content?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = filterCategory === 'ALL' || post.category === filterCategory;
    return matchesSearch && matchesFilter;
  }).sort((a, b) => {
    if (sortBy === 'POPULAR') return (b.likes || 0) - (a.likes || 0);
    if (sortBy === 'DISCUSSED') return (b.comments?.length || 0) - (a.comments?.length || 0);
    return new Date(b.createdAt) - new Date(a.createdAt);
  });

  // All unique categories present in the data
  const allCategories = ['ALL', ...Array.from(new Set(posts.map(p => p.category).filter(Boolean)))];
  const groupCategories = Array.from(new Set(filteredPosts.map(p => p.category).filter(Boolean)));

  const renderPost = (post) => (
    <div key={post.id} className="flex gap-6 items-start w-full group">
      
      {/* Avatar Circle */}
      <div 
        className="w-14 h-14 shrink-0 rounded-full bg-[#F5C142] border-2 border-[#1A1A1A] flex items-center justify-center text-xl font-black text-[#1A1A1A] mt-2 group-hover:-translate-y-1 transition-transform duration-200"
        style={{ boxShadow: '4px 4px 0px #1A1A1A' }}
      >
        {post.author?.name ? post.author.name.charAt(0).toUpperCase() : 'U'}
      </div>

      {/* Content Box */}
      <div 
        className="flex-1 bg-white border-2 border-[#1A1A1A] rounded-3xl p-6 group-hover:-translate-y-1 transition-transform duration-200"
        style={{ boxShadow: '6px 6px 0px #1A1A1A' }}
      >
        <div className="flex items-center gap-3 mb-3">
          <span className="px-3 py-1 bg-[#1A1A1A] text-white rounded-full text-[10px] font-black tracking-widest uppercase">
            {post.category || 'TIPS'}
          </span>
          <span className="text-sm font-bold text-[#6B7280]">Posted by {post.author?.name || 'Unknown'}</span>
        </div>
        
        <h3 className="text-xl font-black text-[#1A1A1A] mb-2">{post.title}</h3>
        <p className="text-[#6B7280] mb-6 leading-relaxed">
          {post.content}
        </p>
        
        <div className="flex items-center gap-6">
          <button 
            onClick={() => handleLike(post.id)}
            className="flex items-center gap-2 text-sm font-bold text-[#1A1A1A] hover:text-[#F5C142] transition-colors"
          >
            <Heart size={18} />
            {post.likes || 0}
          </button>
          <button className="flex items-center gap-2 text-sm font-bold text-[#1A1A1A] hover:text-[#F5C142] transition-colors">
            <MessageSquare size={18} />
            {post.comments?.length || 0}
          </button>
          <button className="flex items-center gap-2 text-sm font-bold text-[#1A1A1A] hover:text-[#F5C142] transition-colors ml-auto">
            <Share2 size={18} />
            Share
          </button>
        </div>
      </div>
    </div>
  );

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
      <div className="flex flex-col md:flex-row items-center gap-4 mb-10 w-full max-w-4xl mx-auto">
        {/* Search Bar */}
        <div className="relative flex-1 w-full">
          <Search size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#1A1A1A]" />
          <input
            type="text"
            placeholder="Search discussions, tips..."
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
            onClick={() => setGroupBy(!groupBy)}
            className={`flex items-center gap-2 border-2 border-[#1A1A1A] rounded-full px-6 py-3.5 text-sm font-bold transition-colors whitespace-nowrap ${groupBy ? 'bg-[#F5C142] text-[#1A1A1A]' : 'bg-white text-[#1A1A1A] hover:bg-[#F5F0E8]'}`} 
            style={{ boxShadow: '4px 4px 0px #1A1A1A' }}
          >
            <Layers size={16} />
            Group by
          </button>
          <button 
            onClick={() => {
              const nextIndex = (allCategories.indexOf(filterCategory) + 1) % allCategories.length;
              setFilterCategory(allCategories[nextIndex]);
            }}
            className={`flex items-center gap-2 border-2 border-[#1A1A1A] rounded-full px-6 py-3.5 text-sm font-bold transition-colors whitespace-nowrap ${filterCategory !== 'ALL' ? 'bg-[#F5C142] text-[#1A1A1A]' : 'bg-white text-[#1A1A1A] hover:bg-[#F5F0E8]'}`} 
            style={{ boxShadow: '4px 4px 0px #1A1A1A' }}
          >
            <Filter size={16} />
            Filter: {filterCategory === 'ALL' ? 'All' : filterCategory}
          </button>
          <button 
            onClick={() => {
              setSortBy(prev => prev === 'POPULAR' ? 'DISCUSSED' : 'POPULAR');
            }}
            className={`flex items-center gap-2 border-2 border-[#1A1A1A] rounded-full px-6 py-3.5 text-sm font-bold transition-colors whitespace-nowrap ${sortBy !== 'POPULAR' ? 'bg-[#F5C142] text-[#1A1A1A]' : 'bg-white text-[#1A1A1A] hover:bg-[#F5F0E8]'}`} 
            style={{ boxShadow: '4px 4px 0px #1A1A1A' }}
          >
            <SortDesc size={16} />
            Sort: {sortBy === 'POPULAR' ? 'Most Liked' : 'Most Discussed'}
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-black text-[#1A1A1A] text-center mb-10">Community tab</h1>

        {error && (
          <div className="mb-6 rounded-2xl border-2 border-[#EF4444] bg-red-50 px-4 py-3 text-sm font-medium text-[#EF4444]">
            {error}
          </div>
        )}

        {/* Create Post Form */}
        <div className="mb-10 bg-white border-2 border-[#1A1A1A] rounded-3xl p-6" style={{ boxShadow: '6px 6px 0px #1A1A1A' }}>
          <h3 className="text-xl font-black text-[#1A1A1A] mb-4">Start a discussion</h3>
          <form onSubmit={handleCreatePost} className="space-y-4">
            <div className="flex gap-4">
              <select
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value)}
                className="bg-white border-2 border-[#1A1A1A] rounded-xl px-4 py-3 text-sm font-bold text-[#1A1A1A] focus:outline-none"
              >
                <option value="TIPS">Tips</option>
                <option value="ITINERARY REVIEW">Itinerary Review</option>
                <option value="GEAR">Gear</option>
              </select>
              <input
                type="text"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder="Post title..."
                className="flex-1 bg-white border-2 border-[#1A1A1A] rounded-xl px-4 py-3 text-sm font-bold text-[#1A1A1A] focus:outline-none"
              />
            </div>
            <textarea
              value={newContent}
              onChange={(e) => setNewContent(e.target.value)}
              placeholder="What's on your mind?"
              rows="3"
              className="w-full bg-white border-2 border-[#1A1A1A] rounded-xl px-4 py-3 text-sm font-bold text-[#1A1A1A] focus:outline-none resize-none"
            ></textarea>
            <div className="flex justify-end">
              <button
                type="submit"
                disabled={submitting || !newTitle.trim() || !newContent.trim()}
                className="flex items-center gap-2 bg-[#F5C142] border-2 border-[#1A1A1A] rounded-xl px-6 py-3 text-sm font-black transition-transform hover:-translate-y-1 disabled:opacity-50 disabled:hover:translate-y-0"
                style={{ boxShadow: submitting || !newTitle.trim() || !newContent.trim() ? 'none' : '4px 4px 0px #1A1A1A' }}
              >
                {submitting ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
                Post
              </button>
            </div>
          </form>
        </div>

        {filteredPosts.length > 0 ? (
          <div className="space-y-8 pl-4 border-l-2 border-dashed border-[#1A1A1A]">
            {!groupBy ? (
              filteredPosts.map(post => renderPost(post))
            ) : (
              <div className="space-y-12">
                {groupCategories.map(cat => {
                  const items = filteredPosts.filter(i => i.category === cat);
                  if (items.length === 0) return null;
                  return (
                    <div key={cat} className="space-y-6">
                      <div className="relative -left-4 flex items-center gap-4">
                        <div className="w-8 h-8 rounded-full bg-[#1A1A1A] flex items-center justify-center">
                          <div className="w-3 h-3 rounded-full bg-[#F5C142]"></div>
                        </div>
                        <h2 className="text-xl font-black text-[#1A1A1A] uppercase tracking-widest">{cat}</h2>
                      </div>
                      <div className="space-y-8">
                        {items.map(post => renderPost(post))}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        ) : (
          <div className="bg-white rounded-3xl border-2 border-[#1A1A1A] p-12 text-center" style={{ boxShadow: '6px 6px 0px #1A1A1A' }}>
            <p className="text-lg font-bold text-[#1A1A1A] mb-2">No discussions found</p>
            <p className="text-[#6B7280] text-sm">Try adjusting your search terms or filters.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default CommunityPage;

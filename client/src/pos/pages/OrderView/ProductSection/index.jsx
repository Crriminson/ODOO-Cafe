import React, { useState, useEffect, useRef, useCallback } from 'react';
import { getCategories } from '../../../../shared/api/categories.api.js';
import { getProducts } from '../../../../shared/api/products.api.js';
import useCartStore from '../../../../shared/stores/useCartStore.js';

// ─── Helpers ──────────────────────────────────────────────────────────────
const formatCurrency = (amount) => {
  const num = Number(amount || 0);
  return (
    '₹' +
    num.toLocaleString('en-IN', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })
  );
};

/** YIQ formula: returns dark or light text color for a given hex background */
const getContrastColor = (hexcolor) => {
  if (!hexcolor) return '#1A1A1A';
  const hex = hexcolor.replace('#', '');
  const len = hex.length;
  if (len !== 3 && len !== 6) return '#1A1A1A';
  let r, g, b;
  if (len === 6) {
    r = parseInt(hex.slice(0, 2), 16);
    g = parseInt(hex.slice(2, 4), 16);
    b = parseInt(hex.slice(4, 6), 16);
  } else {
    r = parseInt(hex[0] + hex[0], 16);
    g = parseInt(hex[1] + hex[1], 16);
    b = parseInt(hex[2] + hex[2], 16);
  }
  const yiq = (r * 299 + g * 587 + b * 114) / 1000;
  return yiq >= 128 ? '#1A1A1A' : '#FFFFFF';
};

// ─── Skeleton grid shown while data loads (guidelines §5 — never full spinner) ─
function ProductGridSkeleton() {
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))',
        gap: '12px',
        padding: '16px',
      }}
    >
      {Array.from({ length: 12 }).map((_, i) => (
        <div
          key={i}
          style={{
            height: '90px',
            backgroundColor: '#E5E7EB',
            borderRadius: '12px',
            animation: 'pulse 1.5s cubic-bezier(0.4,0,0.6,1) infinite',
          }}
        />
      ))}
    </div>
  );
}

export default function ProductSection() {
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedCategoryId, setSelectedCategoryId] = useState('all');

  // Raw search query drives the input immediately; debouncedQuery is what actually filters
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const debounceRef = useRef(null);

  const addItem = useCartStore((s) => s.addItem);

  // ─── Debounce search ────────────────────────────────────────────────
  const handleSearchChange = useCallback((e) => {
    const value = e.target.value;
    setSearchQuery(value);
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setDebouncedQuery(value);
    }, 300);
  }, []);

  useEffect(() => () => clearTimeout(debounceRef.current), []);

  // ─── Load categories + products once ────────────────────────────────
  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const [catRes, prodRes] = await Promise.all([
          getCategories(),
          getProducts({ is_active: true }),
        ]);
        setCategories(catRes.categories || []);
        setProducts(prodRes.products || []);
        setError(null);
      } catch (err) {
        console.error('[ProductSection] load error:', err);
        setError(err.message || 'Failed to load products. Please refresh.');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  // ─── Client-side filter ──────────────────────────────────────────────
  const query = debouncedQuery.toLowerCase().trim();
  const filteredBySearch = query
    ? products.filter((p) => p.name.toLowerCase().includes(query))
    : products;

  const displayedProducts =
    selectedCategoryId === 'all'
      ? filteredBySearch
      : filteredBySearch.filter((p) => p.category_id === selectedCategoryId);

  // ─── Loading skeleton ────────────────────────────────────────────────
  if (loading) {
    return (
      <div style={{ backgroundColor: 'var(--color-canvas)', height: '100%' }}>
        {/* Category tabs skeleton */}
        <div
          style={{
            display: 'flex',
            gap: '8px',
            padding: '12px 16px',
            borderBottom: '2px solid #E5E7EB',
            overflowX: 'auto',
          }}
        >
          {Array.from({ length: 5 }).map((_, i) => (
            <div
              key={i}
              style={{
                width: `${60 + i * 15}px`,
                height: '36px',
                backgroundColor: '#E5E7EB',
                borderRadius: '8px',
                flexShrink: 0,
                animation: 'pulse 1.5s cubic-bezier(0.4,0,0.6,1) infinite',
              }}
            />
          ))}
        </div>
        <ProductGridSkeleton />
      </div>
    );
  }

  // ─── Error state ─────────────────────────────────────────────────────
  if (error) {
    return (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100%',
          backgroundColor: 'var(--color-canvas)',
          padding: '24px',
          gap: '12px',
        }}
      >
        <div
          style={{
            background: 'var(--color-error-bg)',
            border: '2px solid var(--color-error)',
            borderRadius: '12px',
            padding: '16px 20px',
            display: 'flex',
            gap: '10px',
            alignItems: 'flex-start',
            maxWidth: '380px',
            width: '100%',
          }}
        >
          <span>⚠️</span>
          <span style={{ color: '#EF4444', fontSize: '13px', fontWeight: 600 }}>{error}</span>
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        backgroundColor: 'var(--color-canvas)',
      }}
    >
      {/* ─── Search bar ───────────────────────────────────────────── */}
      <div
        style={{
          padding: '12px 16px 0',
        }}
      >
        <div style={{ position: 'relative' }}>
          <span
            style={{
              position: 'absolute',
              left: '12px',
              top: '50%',
              transform: 'translateY(-50%)',
              color: '#9CA3AF',
              pointerEvents: 'none',
              fontSize: '16px',
            }}
          >
            🔍
          </span>
          <input
            type="search"
            value={searchQuery}
            onChange={handleSearchChange}
            placeholder="Search products..."
            aria-label="Search products by name"
            style={{
              width: '100%',
              padding: '10px 12px 10px 38px',
              border: '2px solid #E5E7EB',
              borderRadius: '8px',
              fontSize: '14px',
              backgroundColor: '#fff',
              color: '#1A1A1A',
              outline: 'none',
              transition: 'border-color 0.15s ease',
              boxSizing: 'border-box',
            }}
            onFocus={(e) => (e.target.style.borderColor = '#1A1A1A')}
            onBlur={(e) => (e.target.style.borderColor = '#E5E7EB')}
          />
        </div>
      </div>

      {/* ─── Category tabs ────────────────────────────────────────── */}
      <div
        style={{
          display: 'flex',
          gap: '8px',
          padding: '10px 16px',
          overflowX: 'auto',
          borderBottom: '2px solid #E5E7EB',
          flexShrink: 0,
        }}
      >
        {/* "All Items" tab */}
        <button
          onClick={() => setSelectedCategoryId('all')}
          aria-pressed={selectedCategoryId === 'all'}
          style={{
            padding: '6px 14px',
            borderRadius: '8px',
            border: '2px solid #1A1A1A',
            backgroundColor: selectedCategoryId === 'all' ? '#F5C142' : '#fff',
            color: '#1A1A1A',
            fontWeight: selectedCategoryId === 'all' ? 900 : 700,
            fontSize: '13px',
            cursor: 'pointer',
            whiteSpace: 'nowrap',
            flexShrink: 0,
            boxShadow: selectedCategoryId === 'all' ? '2px 2px 0px #1A1A1A' : 'none',
            transition: 'all 0.15s ease',
            minHeight: '36px',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
          }}
        >
          All Items
        </button>

        {/* Per-category tabs — color from API, never hardcoded */}
        {categories.map((cat) => {
          const isActive = selectedCategoryId === cat.id;
          const tabColor = cat.color || '#F5C142';
          const textColor = isActive ? getContrastColor(tabColor) : '#1A1A1A';

          return (
            <button
              key={cat.id}
              onClick={() => setSelectedCategoryId(cat.id)}
              aria-pressed={isActive}
              style={{
                padding: '6px 14px',
                borderRadius: '8px',
                border: '2px solid #1A1A1A',
                backgroundColor: isActive ? tabColor : '#fff',
                color: isActive ? textColor : '#1A1A1A',
                fontWeight: isActive ? 900 : 700,
                fontSize: '13px',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                flexShrink: 0,
                boxShadow: isActive ? '2px 2px 0px #1A1A1A' : 'none',
                transition: 'all 0.15s ease',
                minHeight: '36px',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              {/* Color dot on inactive tabs (guidelines §2.8) */}
              {!isActive && (
                <span
                  style={{
                    display: 'inline-block',
                    width: '10px',
                    height: '10px',
                    borderRadius: '50%',
                    backgroundColor: tabColor,
                    flexShrink: 0,
                  }}
                />
              )}
              {cat.name}
            </button>
          );
        })}
      </div>

      {/* ─── Product grid ─────────────────────────────────────────── */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '12px 16px 16px' }}>
        {displayedProducts.length === 0 ? (
          /* Empty state */
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              height: '200px',
              gap: '10px',
              color: '#6B7280',
            }}
          >
            <span style={{ fontSize: '40px', opacity: 0.5 }}>🍽️</span>
            <p style={{ fontWeight: 700, fontSize: '14px' }}>No products found</p>
            <p style={{ fontSize: '12px' }}>
              {query ? 'Try a different search term' : 'No items in this category'}
            </p>
          </div>
        ) : (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))',
              gap: '12px',
            }}
          >
            {displayedProducts.map((product) => {
              const cat = categories.find((c) => c.id === product.category_id);
              const catColor = cat?.color || '#F5C142';

              return (
                <button
                  key={product.id}
                  onClick={() => addItem(product)}
                  aria-label={`Add ${product.name} to cart — ${formatCurrency(product.price)}`}
                  style={{
                    background: '#fff',
                    border: '2px solid #1A1A1A',
                    borderRadius: '12px',
                    overflow: 'hidden',
                    cursor: 'pointer',
                    textAlign: 'left',
                    padding: 0,
                    boxShadow: '4px 4px 0px #1A1A1A',
                    transition: 'transform 0.15s ease, box-shadow 0.15s ease',
                    minHeight: '88px',
                    display: 'flex',
                    flexDirection: 'column',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-2px)';
                    e.currentTarget.style.boxShadow = '4px 6px 0px #1A1A1A';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = '4px 4px 0px #1A1A1A';
                  }}
                >
                  {/* 4px category-color top bar (guidelines §4.1) */}
                  <div style={{ height: '4px', backgroundColor: catColor, flexShrink: 0 }} />

                  <div style={{ padding: '10px 12px', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                    <p
                      style={{
                        fontSize: '13px',
                        fontWeight: 700,
                        color: '#1A1A1A',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                        marginBottom: '4px',
                      }}
                    >
                      {product.name}
                    </p>
                    <p
                      style={{
                        fontSize: '13px',
                        fontFamily: 'monospace',
                        fontWeight: 900,
                        color: '#1A1A1A',
                      }}
                    >
                      {formatCurrency(product.price)}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

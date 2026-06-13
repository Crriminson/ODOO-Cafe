import React, { useState, useEffect } from 'react';
import { getCategories } from '../../../shared/api/categories.api.js';
import { getProducts } from '../../../shared/api/products.api.js';

/**
 * Calculates the appropriate text color (black or white) to contrast with the given hex background color.
 * Uses the YIQ color brightness formula.
 * @param {string} hexcolor - Hex color string
 * @returns {string} Contrast text color (hex)
 */
const getContrastColor = (hexcolor) => {
  if (!hexcolor) return '#ffffff';
  const hex = hexcolor.replace('#', '');
  if (hex.length !== 6 && hex.length !== 3) return '#ffffff';
  
  let r, g, b;
  if (hex.length === 6) {
    r = parseInt(hex.substring(0, 2), 16);
    g = parseInt(hex.substring(2, 4), 16);
    b = parseInt(hex.substring(4, 6), 16);
  } else {
    r = parseInt(hex.substring(0, 1) + hex.substring(0, 1), 16);
    g = parseInt(hex.substring(1, 2) + hex.substring(1, 2), 16);
    b = parseInt(hex.substring(2, 3) + hex.substring(2, 3), 16);
  }
  
  // YIQ brightness formula
  const yiq = ((r * 299) + (g * 587) + (b * 114)) / 1000;
  return (yiq >= 128) ? '#0b0f19' : '#ffffff';
};

const formatCurrency = (amount) => {
  const num = Number(amount || 0);
  return '₹' + num.toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
};

export default function ProductSection({ onProductSelect }) {
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedCategoryId, setSelectedCategoryId] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        // Parallel load of categories and products using Promise.all
        const [categoriesRes, productsRes] = await Promise.all([
          getCategories(),
          getProducts({ is_active: true })
        ]);
        setCategories(categoriesRes.categories || []);
        setProducts(productsRes.products || []);
        setError(null);
      } catch (err) {
        console.error('Failed to load categories/products:', err);
        setError(err.message || 'Failed to load products and categories.');
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  if (loading) {
    return (
      <div className="product-section justify-center items-center">
        <div className="spinner-container">
          <div className="spinner"></div>
          <p className="loading-text">Loading menu...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="product-section">
        <div className="session-error-alert">
          <span>⚠️</span>
          <span>{error}</span>
        </div>
      </div>
    );
  }

  // Local client-side case-insensitive search on product name
  const searchedProducts = products.filter((product) =>
    product.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Local client-side filtering by category
  const displayedProducts = selectedCategoryId === 'all'
    ? searchedProducts
    : searchedProducts.filter((product) => product.category_id === selectedCategoryId);

  return (
    <div className="product-section">
      <div className="product-section-header">
        <div className="search-bar-container">
          <span className="search-bar-icon">🔍</span>
          <input
            type="text"
            className="search-bar-input"
            placeholder="Search products by name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="categories-tabs-container">
          <button
            onClick={() => setSelectedCategoryId('all')}
            className="category-tab"
            style={{
              borderColor: '#f59e0b',
              backgroundColor: selectedCategoryId === 'all' ? '#f59e0b' : 'transparent',
              color: selectedCategoryId === 'all' ? '#0b0f19' : '#f59e0b'
            }}
          >
            All Items
          </button>
          {categories.map((category) => {
            const isActive = selectedCategoryId === category.id;
            const tabColor = category.color || '#f59e0b';
            const textColor = isActive ? getContrastColor(tabColor) : tabColor;

            return (
              <button
                key={category.id}
                onClick={() => setSelectedCategoryId(category.id)}
                className="category-tab"
                style={{
                  borderColor: tabColor,
                  backgroundColor: isActive ? tabColor : 'transparent',
                  color: textColor
                }}
              >
                {category.name}
              </button>
            );
          })}
        </div>
      </div>

      <div className="products-grid-container">
        {displayedProducts.length === 0 ? (
          <div className="cart-empty-state">
            <span className="cart-empty-icon">🍽️</span>
            <p>No products found matching your criteria.</p>
          </div>
        ) : (
          <div className="products-grid">
            {displayedProducts.map((product) => {
              const productCategory = categories.find((c) => c.id === product.category_id);
              const categoryColor = productCategory?.color || '#f59e0b';
              const categoryName = productCategory?.name || 'Uncategorized';

              return (
                <div
                  key={product.id}
                  className="product-card"
                  onClick={() => onProductSelect(product)}
                  style={{ borderLeft: `4px solid ${categoryColor}` }}
                >
                  <div className="product-card-info">
                    <div className="product-card-name">{product.name}</div>
                    <div className="product-card-price">{formatCurrency(product.price)}</div>
                  </div>
                  <div className="product-card-footer">
                    <span className="product-card-category">{categoryName}</span>
                    <button className="product-card-add-btn">+</button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

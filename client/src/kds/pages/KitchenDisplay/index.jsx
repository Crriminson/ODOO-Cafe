import React, { useState, useEffect } from 'react';
import {
  getKdsOrders,
  stageOrder,
  completeItem,
} from '../../../shared/api/kds.api.js';
import { KDS_STAGES } from '@shared/kdsStages.js';
import { getCategories } from '../../../shared/api/categories.api.js';
import { getProducts } from '../../../shared/api/products.api.js';
import useDebounce from '../../../shared/hooks/useDebounce.js';
import { socket } from '../../../shared/sockets/socket.js';
import {
  Search,
  Clock,
  CheckSquare,
  Square,
  Play,
  Check,
  User,
  Filter,
} from 'lucide-react';

export default function KitchenDisplay() {
  const [orders, setOrders] = useState([]);
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearch = useDebounce(searchQuery, 300);
  const [selectedCategoryId, setSelectedCategoryId] = useState('');
  const [selectedProductId, setSelectedProductId] = useState('');

  // Elapsed time trigger (updates "time ago" badges every 10 seconds)
  const [timeTicker, setTimeTicker] = useState(Date.now());

  useEffect(() => {
    const interval = setInterval(() => {
      setTimeTicker(Date.now());
    }, 10000);
    return () => clearInterval(interval);
  }, []);

  // Fetch KDS orders from backend
  const fetchKdsOrders = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await getKdsOrders({
        search: debouncedSearch || undefined,
        category_id: selectedCategoryId || undefined,
        product_id: selectedProductId || undefined,
      });
      setOrders(response.orders || []);
    } catch (err) {
      setError(err.message || 'Failed to fetch KDS orders');
    } finally {
      setLoading(false);
    }
  };

  // Fetch initial dropdown options
  useEffect(() => {
    const fetchDropdowns = async () => {
      try {
        const catRes = await getCategories();
        setCategories(catRes.categories || []);

        const prodRes = await getProducts();
        setProducts(prodRes.products || []);
      } catch (err) {
        console.error('Failed to load filter dropdowns', err);
      }
    };
    fetchDropdowns();
  }, []);

  // Fetch orders when filters change
  useEffect(() => {
    fetchKdsOrders();
  }, [debouncedSearch, selectedCategoryId, selectedProductId]);

  // Socket.IO event wiring
  useEffect(() => {
    socket.connect();

    const handleNewOrder = (newOrder) => {
      setOrders((prev) => {
        // Avoid duplicate tickets
        if (prev.some((o) => o.id === newOrder.id)) return prev;
        return [newOrder, ...prev];
      });
    };

    const handleStageUpdated = ({ order_id, kds_status }) => {
      setOrders((prev) =>
        prev.map((order) => {
          if (order.id === order_id) {
            return {
              ...order,
              items: order.items.map((item) => ({ ...item, kds_status })),
            };
          }
          return order;
        })
      );
    };

    const handleItemCompleted = ({ order_id, item_id }) => {
      setOrders((prev) =>
        prev.map((order) => {
          if (order.id === order_id) {
            return {
              ...order,
              items: order.items.map((item) =>
                item.id === item_id ? { ...item, is_item_completed: true } : item
              ),
            };
          }
          return order;
        })
      );
    };

    const handleCookAssigned = ({ order_id, assignments }) => {
      setOrders((prev) =>
        prev.map((order) => {
          if (order.id !== order_id) return order;
          return {
            ...order,
            items: order.items.map((item) => {
              const assignment = assignments.find((a) => a.item_id === item.id);
              if (!assignment) return item;
              return {
                ...item,
                assigned_cook_id: assignment.cook_id,
                assigned_cook_name: assignment.cook_name,
              };
            }),
          };
        })
      );
    };

    const handleOrderPaid = ({ order_id }) => {
      // Remove ticket from active display on payment
      setOrders((prev) => prev.filter((order) => order.id !== order_id));
    };

    socket.on('order:new', handleNewOrder);
    socket.on('order:stage_updated', handleStageUpdated);
    socket.on('item:completed', handleItemCompleted);
    socket.on('order:paid', handleOrderPaid);
    socket.on('cook:assigned', handleCookAssigned);

    return () => {
      socket.off('order:new', handleNewOrder);
      socket.off('order:stage_updated', handleStageUpdated);
      socket.off('item:completed', handleItemCompleted);
      socket.off('order:paid', handleOrderPaid);
      socket.off('cook:assigned', handleCookAssigned);
    };
  }, []);

  // Compute order stage client-side
  const getOrderStage = (order) => {
    const items = order.items || [];
    if (items.length === 0) return KDS_STAGES.COMPLETED;

    const allCompleted = items.every((i) => i.is_item_completed || i.kds_status === KDS_STAGES.COMPLETED);
    if (allCompleted) return KDS_STAGES.COMPLETED;

    const hasPreparing = items.some((i) => i.kds_status === KDS_STAGES.PREPARING);
    if (hasPreparing) return KDS_STAGES.PREPARING;

    return KDS_STAGES.TO_COOK;
  };

  // Trigger optimistic item completion
  const handleCompleteItem = async (e, orderId, itemId) => {
    e.stopPropagation(); // prevent card stage advancement click
    setError('');

    // Optimistic Update
    setOrders((prev) =>
      prev.map((order) => {
        if (order.id === orderId) {
          return {
            ...order,
            items: order.items.map((item) =>
              item.id === itemId ? { ...item, is_item_completed: true } : item
            ),
          };
        }
        return order;
      })
    );

    try {
      await completeItem(itemId);
    } catch (err) {
      setError(err.message || 'Failed to update item status');
      fetchKdsOrders(); // revert on failure
    }
  };

  // Trigger optimistic order stage update
  const handleStageUpdate = async (orderId, currentStage) => {
    if (currentStage === KDS_STAGES.COMPLETED) return;
    setError('');

    const newStage = currentStage === KDS_STAGES.TO_COOK ? KDS_STAGES.PREPARING : KDS_STAGES.COMPLETED;

    // Optimistic Update
    setOrders((prev) =>
      prev.map((order) => {
        if (order.id === orderId) {
          return {
            ...order,
            items: order.items.map((item) => ({ ...item, kds_status: newStage })),
          };
        }
        return order;
      })
    );

    try {
      await stageOrder(orderId);
    } catch (err) {
      setError(err.message || 'Failed to update order stage');
      fetchKdsOrders(); // revert on failure
    }
  };

  const getMinutesElapsed = (createdAt) => {
    const elapsedMs = Date.now() - new Date(createdAt).getTime();
    return Math.floor(elapsedMs / 60000);
  };

  // Split orders into stages client-side
  const toCookOrders = orders.filter((o) => getOrderStage(o) === KDS_STAGES.TO_COOK);
  const preparingOrders = orders.filter((o) => getOrderStage(o) === KDS_STAGES.PREPARING);
  const completedOrders = orders.filter((o) => getOrderStage(o) === KDS_STAGES.COMPLETED);

  const styles = {
    fullscreenContainer: {
      backgroundColor: '#F5F0E8',
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      fontFamily: "'Outfit', 'Inter', sans-serif",
      color: '#1A1A1A',
      boxSizing: 'border-box',
    },
    topBar: {
      backgroundColor: '#1A1A1A',
      color: '#FFF',
      padding: '16px 24px',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      borderBottom: '3px solid #1A1A1A',
      flexWrap: 'wrap',
      gap: '16px',
    },
    brand: {
      fontSize: '24px',
      fontWeight: '900',
      textTransform: 'uppercase',
      letterSpacing: '1px',
      color: '#714867',
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
    },
    filtersRow: {
      display: 'flex',
      alignItems: 'center',
      gap: '16px',
      flexWrap: 'wrap',
    },
    searchWrapper: {
      position: 'relative',
    },
    searchInput: {
      padding: '8px 12px 8px 36px',
      fontSize: '14px',
      border: '2px solid #FFF',
      backgroundColor: 'transparent',
      color: '#FFF',
      borderRadius: '0px',
      fontFamily: "'Inter', sans-serif",
      width: '200px',
    },
    searchIcon: {
      position: 'absolute',
      left: '10px',
      top: '50%',
      transform: 'translateY(-50%)',
      color: '#AAA',
    },
    filterSelect: {
      padding: '8px 12px',
      fontSize: '14px',
      border: '2px solid #FFF',
      backgroundColor: '#1A1A1A',
      color: '#FFF',
      cursor: 'pointer',
      borderRadius: '0px',
      fontFamily: "'Outfit', sans-serif",
    },
    board: {
      flex: 1,
      display: 'grid',
      gridTemplateColumns: 'repeat(3, 1fr)',
      gap: '2px',
      backgroundColor: '#1A1A1A',
    },
    column: {
      backgroundColor: '#F5F0E8',
      display: 'flex',
      flexDirection: 'column',
      height: 'calc(100vh - 75px)',
      overflowY: 'auto',
    },
    columnHeader: {
      position: 'sticky',
      top: 0,
      zIndex: 10,
      padding: '16px 20px',
      borderBottom: '3px solid #1A1A1A',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    columnTitle: {
      margin: 0,
      fontSize: '20px',
      fontWeight: '900',
      textTransform: 'uppercase',
      letterSpacing: '0.5px',
    },
    columnCountBadge: {
      backgroundColor: '#1A1A1A',
      color: '#FFF',
      padding: '4px 10px',
      fontSize: '14px',
      fontWeight: '900',
    },
    ticketsList: {
      padding: '20px',
      display: 'flex',
      flexDirection: 'column',
      gap: '20px',
    },
    ticketCard: {
      backgroundColor: '#FFF',
      border: '3px solid #1A1A1A',
      boxShadow: '6px 6px 0px #1A1A1A',
      padding: '20px',
      cursor: 'pointer',
      transition: 'transform 0.1s, box-shadow 0.1s',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'space-between',
      position: 'relative',
    },
    ticketHeader: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      borderBottom: '2px solid #1A1A1A',
      paddingBottom: '10px',
      marginBottom: '12px',
    },
    ticketTitle: {
      margin: 0,
      fontSize: '18px',
      fontWeight: '900',
      textTransform: 'uppercase',
    },
    ticketMeta: {
      fontSize: '12px',
      fontWeight: 'bold',
      color: '#666',
      display: 'flex',
      alignItems: 'center',
      gap: '4px',
    },
    orderType: {
      padding: '2px 6px',
      fontSize: '10px',
      fontWeight: '800',
      textTransform: 'uppercase',
      border: '2px solid #1A1A1A',
      backgroundColor: '#FFF',
    },
    itemsList: {
      display: 'flex',
      flexDirection: 'column',
      gap: '8px',
      marginBottom: '16px',
    },
    itemRow: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      padding: '6px 0',
      borderBottom: '1px dashed #DDD',
      fontSize: '15px',
    },
    itemMain: {
      display: 'flex',
      alignItems: 'flex-start',
      gap: '8px',
    },
    quantity: {
      fontWeight: '900',
      backgroundColor: '#1A1A1A',
      color: '#FFF',
      padding: '0px 6px',
      marginRight: '4px',
    },
    itemName: {
      fontWeight: 'bold',
    },
    itemStrikethrough: {
      textDecoration: 'line-through',
      color: '#999',
    },
    cookAssignment: {
      fontSize: '11px',
      color: '#666',
      marginTop: '2px',
      display: 'flex',
      alignItems: 'center',
      gap: '2px',
    },
    cardActionArea: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      borderTop: '2px solid #1A1A1A',
      paddingTop: '12px',
      marginTop: '8px',
    },
    cardActionBtn: {
      width: '100%',
      backgroundColor: '#714867',
      border: '2px solid #1A1A1A',
      padding: '8px 12px',
      fontWeight: '800',
      fontSize: '13px',
      textTransform: 'uppercase',
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '6px',
      boxShadow: '2px 2px 0px #1A1A1A',
    },
  };

  return (
    <div style={styles.fullscreenContainer}>
      {/* Top Bar */}
      <div style={styles.topBar}>
        <div style={styles.brand}>
          <Clock size={24} /> Odoo Cafe KDS
        </div>

        {/* Global Filters */}
        <div style={styles.filtersRow}>
          <div style={styles.searchWrapper}>
            <Search style={styles.searchIcon} size={16} />
            <input
              type="text"
              placeholder="Search product..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={styles.searchInput}
            />
          </div>

          <select
            value={selectedCategoryId}
            onChange={(e) => setSelectedCategoryId(e.target.value)}
            style={styles.filterSelect}
          >
            <option value="">Filter Category</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.name}
              </option>
            ))}
          </select>

          <select
            value={selectedProductId}
            onChange={(e) => setSelectedProductId(e.target.value)}
            style={styles.filterSelect}
          >
            <option value="">Filter Product</option>
            {products.map((prod) => (
              <option key={prod.id} value={prod.id}>
                {prod.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {error && (
        <div
          style={{
            backgroundColor: '#FF6B6B',
            color: '#FFF',
            border: '3px solid #1A1A1A',
            margin: '10px 20px',
            padding: '8px 16px',
            fontWeight: 'bold',
          }}
        >
          {error}
        </div>
      )}

      {/* Columns Grid */}
      <div style={styles.board}>
        {/* Column 1: To Cook */}
        <div style={styles.column}>
          <div style={{ ...styles.columnHeader, backgroundColor: '#FFD54F' }}>
            <h2 style={styles.columnTitle}>To Cook</h2>
            <span style={styles.columnCountBadge}>{toCookOrders.length}</span>
          </div>

          <div style={styles.ticketsList}>
            {toCookOrders.map((order) => (
              <div
                key={order.id}
                style={styles.ticketCard}
                onClick={() => handleStageUpdate(order.id, KDS_STAGES.TO_COOK)}
              >
                <div style={styles.ticketHeader}>
                  <h3 style={styles.ticketTitle}>Order #{order.id}</h3>
                  <span style={styles.orderType}>{order.order_type}</span>
                </div>

                <div style={styles.itemsList}>
                  {order.items.map((item) => (
                    <div
                      key={item.id}
                      style={styles.itemRow}
                      onClick={(e) => handleCompleteItem(e, order.id, item.id)}
                    >
                      <div style={styles.itemMain}>
                        {item.is_item_completed ? (
                          <CheckSquare size={16} />
                        ) : (
                          <Square size={16} />
                        )}
                        <span
                          style={{
                            ...styles.itemName,
                            ...(item.is_item_completed ? styles.itemStrikethrough : {}),
                          }}
                        >
                          <span style={styles.quantity}>{item.quantity}</span>
                          {item.product_name}
                          {item.category_color && (
                            <span
                              style={{
                                display: 'inline-block',
                                marginLeft: '8px',
                                padding: '2px 6px',
                                fontSize: '10px',
                                fontWeight: 'bold',
                                borderRadius: '4px',
                                border: '1px solid #1A1A1A',
                                backgroundColor: item.category_color,
                                color: '#1A1A1A',
                                textTransform: 'uppercase',
                              }}
                            >
                              {item.category_name}
                            </span>
                          )}
                        </span>
                      </div>
                      {item.assigned_cook_name && (
                        <span style={styles.cookAssignment}>
                          <User size={10} /> {item.assigned_cook_name}
                        </span>
                      )}
                    </div>
                  ))}
                </div>

                <div style={styles.ticketMeta}>
                  <Clock size={12} /> {getMinutesElapsed(order.created_at)}m ago
                </div>

                <div style={styles.cardActionArea}>
                  <button style={styles.cardActionBtn}>
                    <Play size={12} /> Start Preparing
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Column 2: Preparing */}
        <div style={styles.column}>
          <div style={{ ...styles.columnHeader, backgroundColor: '#FF8A65' }}>
            <h2 style={styles.columnTitle}>Preparing</h2>
            <span style={styles.columnCountBadge}>{preparingOrders.length}</span>
          </div>

          <div style={styles.ticketsList}>
            {preparingOrders.map((order) => (
              <div
                key={order.id}
                style={styles.ticketCard}
                onClick={() => handleStageUpdate(order.id, KDS_STAGES.PREPARING)}
              >
                <div style={styles.ticketHeader}>
                  <h3 style={styles.ticketTitle}>Order #{order.id}</h3>
                  <span style={styles.orderType}>{order.order_type}</span>
                </div>

                <div style={styles.itemsList}>
                  {order.items.map((item) => (
                    <div
                      key={item.id}
                      style={styles.itemRow}
                      onClick={(e) => handleCompleteItem(e, order.id, item.id)}
                    >
                      <div style={styles.itemMain}>
                        {item.is_item_completed ? (
                          <CheckSquare size={16} />
                        ) : (
                          <Square size={16} />
                        )}
                        <span
                          style={{
                            ...styles.itemName,
                            ...(item.is_item_completed ? styles.itemStrikethrough : {}),
                          }}
                        >
                          <span style={styles.quantity}>{item.quantity}</span>
                          {item.product_name}
                          {item.category_color && (
                            <span
                              style={{
                                display: 'inline-block',
                                marginLeft: '8px',
                                padding: '2px 6px',
                                fontSize: '10px',
                                fontWeight: 'bold',
                                borderRadius: '4px',
                                border: '1px solid #1A1A1A',
                                backgroundColor: item.category_color,
                                color: '#1A1A1A',
                                textTransform: 'uppercase',
                              }}
                            >
                              {item.category_name}
                            </span>
                          )}
                        </span>
                      </div>
                      {item.assigned_cook_name && (
                        <span style={styles.cookAssignment}>
                          <User size={10} /> {item.assigned_cook_name}
                        </span>
                      )}
                    </div>
                  ))}
                </div>

                <div style={styles.ticketMeta}>
                  <Clock size={12} /> {getMinutesElapsed(order.created_at)}m ago
                </div>

                <div style={styles.cardActionArea}>
                  <button style={styles.cardActionBtn}>
                    <Check size={12} /> Ready/Complete
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Column 3: Completed */}
        <div style={styles.column}>
          <div style={{ ...styles.columnHeader, backgroundColor: '#81C784' }}>
            <h2 style={styles.columnTitle}>Completed</h2>
            <span style={styles.columnCountBadge}>{completedOrders.length}</span>
          </div>

          <div style={styles.ticketsList}>
            {completedOrders.map((order) => (
              <div key={order.id} style={styles.ticketCard}>
                <div style={styles.ticketHeader}>
                  <h3 style={styles.ticketTitle}>Order #{order.id}</h3>
                  <span style={styles.orderType}>{order.order_type}</span>
                </div>

                <div style={styles.itemsList}>
                  {order.items.map((item) => (
                    <div key={item.id} style={styles.itemRow}>
                      <div style={styles.itemMain}>
                        <CheckSquare size={16} />
                        <span style={{ ...styles.itemName, ...styles.itemStrikethrough }}>
                          <span style={styles.quantity}>{item.quantity}</span>
                          {item.product_name}
                          {item.category_color && (
                            <span
                              style={{
                                display: 'inline-block',
                                marginLeft: '8px',
                                padding: '2px 6px',
                                fontSize: '10px',
                                fontWeight: 'bold',
                                borderRadius: '4px',
                                border: '1px solid #1A1A1A',
                                backgroundColor: item.category_color,
                                color: '#1A1A1A',
                                textTransform: 'uppercase',
                              }}
                            >
                              {item.category_name}
                            </span>
                          )}
                        </span>
                      </div>
                      {item.assigned_cook_name && (
                        <span style={styles.cookAssignment}>
                          <User size={10} /> {item.assigned_cook_name}
                        </span>
                      )}
                    </div>
                  ))}
                </div>

                <div style={styles.ticketMeta}>
                  <Clock size={12} /> {getMinutesElapsed(order.created_at)}m ago
                </div>

                <div style={styles.cardActionArea}>
                  <div
                    style={{
                      width: '100%',
                      padding: '8px',
                      backgroundColor: '#E8F5E9',
                      border: '2px solid #81C784',
                      color: '#2E7D32',
                      textAlign: 'center',
                      fontWeight: 'bold',
                      fontSize: '13px',
                      textTransform: 'uppercase',
                    }}
                  >
                    All Items Ready
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}


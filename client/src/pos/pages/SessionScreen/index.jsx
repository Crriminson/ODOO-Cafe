import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import PosLayout from '../../layout/PosLayout.jsx';
import Card from '../../../shared/components/Card.jsx';
import Button from '../../../shared/components/Button.jsx';
import {
  getCurrentSession,
  openSession,
  closeSession,
  getLastClosedSession,
} from '../../../shared/api/sessions.api.js';

export default function SessionScreen() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [activeSession, setActiveSession] = useState(null);
  const [lastSession, setLastSession] = useState(null);
  const [error, setError] = useState(null);

  // Closing summary state populated when user successfully closes the session
  const [closedSummary, setClosedSummary] = useState(null);

  // Helper to format dates in India/Kolkata timezone
  const formatDateKolkata = (dateVal) => {
    if (!dateVal) return '';
    try {
      const date = new Date(dateVal);
      return new Intl.DateTimeFormat('en-IN', {
        timeZone: 'Asia/Kolkata',
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      }).format(date);
    } catch (err) {
      console.error('Date formatting error:', err);
      return '';
    }
  };

  // Helper to format currency values as ₹X,XXX.XX
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

  // Load session data on mount
  const fetchSessionData = async () => {
    setLoading(true);
    setError(null);
    try {
      const currentRes = await getCurrentSession();
      if (currentRes.session) {
        setActiveSession(currentRes.session);
        setLastSession(null);
      } else {
        setActiveSession(null);
        const lastRes = await getLastClosedSession();
        setLastSession(lastRes.session);
      }
    } catch (err) {
      console.error('Error fetching session data:', err);
      setError(err.message || 'Failed to load session details.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSessionData();
  }, []);

  const handleOpenSession = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await openSession();
      setActiveSession(res.session);
      navigate('/pos/order-type');
    } catch (err) {
      if (err.code === 'SESSION_ALREADY_OPEN' || err.status === 409) {
        setError('A session is already open');
      } else {
        setError(err.message || 'Failed to open session.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCloseSession = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await closeSession();
      setClosedSummary(res.session);
      setActiveSession(null);
      // Set this newly closed session as the last closed session for display
      setLastSession(res.session);
    } catch (err) {
      setError(err.message || 'Failed to close session.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <PosLayout>
      <Card className="session-screen-card">
        {loading ? (
          <div className="spinner-container">
            <div className="spinner"></div>
            <span className="loading-text">Loading session data...</span>
          </div>
        ) : (
          <>
            {/* Session Icon Header */}
            {activeSession ? (
              <div className="session-icon-wrapper">
                <span style={{ fontSize: '32px' }}>🔓</span>
              </div>
            ) : (
              <div className="session-icon-wrapper closed">
                <span style={{ fontSize: '32px' }}>🔒</span>
              </div>
            )}

            <h2 className="session-title">
              {activeSession ? 'Active Session Open' : 'Register Closed'}
            </h2>
            <p className="session-subtitle">
              {activeSession
                ? `Opened at: ${formatDateKolkata(activeSession.opened_at)}`
                : 'Open a session to start taking café orders'}
            </p>

            {/* Inline Error Alert */}
            {error && (
              <div className="session-error-alert">
                <span>⚠️</span>
                <span>{error}</span>
              </div>
            )}

            {/* State A - No Open Session */}
            {!activeSession && (
              <>
                {/* Last Session Info Banner */}
                <div className="session-last-info">
                  <span className="session-last-label">Last Session Info</span>
                  {lastSession ? (
                    <span className="session-last-value">
                      Last session: {formatDateKolkata(lastSession.closed_at)} —{' '}
                      {formatCurrency(lastSession.closing_total_revenue)}
                    </span>
                  ) : (
                    <span className="session-last-value" style={{ color: 'var(--text-muted)' }}>
                      No previous sessions
                    </span>
                  )}
                </div>

                {/* Inline Closing Summary Confirmation (State B success outcome) */}
                {closedSummary && (
                  <div className="session-summary-box">
                    <div className="session-summary-title">✓ Session Closed</div>
                    <div className="session-summary-row">
                      <span>Total Orders:</span>
                      <span>{closedSummary.closing_total_orders}</span>
                    </div>
                    <div className="session-summary-row">
                      <span>Total Revenue:</span>
                      <span>{formatCurrency(closedSummary.closing_total_revenue)}</span>
                    </div>
                    <div className="session-summary-title" style={{ marginTop: '16px', fontSize: '13px' }}>
                      Payment Breakdown
                    </div>
                    <div className="session-breakdown-list">
                      <div className="session-breakdown-item">
                        <span>Cash:</span>
                        <span>{formatCurrency(closedSummary.closing_breakdown?.cash)}</span>
                      </div>
                      <div className="session-breakdown-item">
                        <span>Card:</span>
                        <span>{formatCurrency(closedSummary.closing_breakdown?.card)}</span>
                      </div>
                      <div className="session-breakdown-item">
                        <span>UPI:</span>
                        <span>{formatCurrency(closedSummary.closing_breakdown?.upi)}</span>
                      </div>
                    </div>
                  </div>
                )}

                <div className="session-actions-grid">
                  <Button variant="primary" onClick={handleOpenSession}>
                    Open Session
                  </Button>
                </div>
              </>
            )}

            {/* State B - Session Already Open */}
            {activeSession && (
              <div className="session-actions-grid">
                <Button variant="primary" onClick={() => navigate('/pos/order-type')}>
                  Enter POS
                </Button>
                <Button variant="secondary" onClick={handleCloseSession}>
                  Close Session
                </Button>
              </div>
            )}
          </>
        )}
      </Card>
    </PosLayout>
  );
}

import React from 'react';

export default function Modal({ isOpen, onClose, title, children }) {
  if (!isOpen) return null;

  const styles = {
    overlay: {
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(26, 26, 26, 0.65)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      padding: '20px',
    },
    container: {
      backgroundColor: '#F5F0E8',
      border: '3px solid #1A1A1A',
      borderRadius: '0px',
      width: '100%',
      maxWidth: '500px',
      boxShadow: '8px 8px 0px #1A1A1A',
      display: 'flex',
      flexDirection: 'column',
      maxHeight: '90vh',
      overflow: 'hidden',
    },
    header: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '16px 20px',
      borderBottom: '3px solid #1A1A1A',
      backgroundColor: '#F5C142',
    },
    title: {
      margin: 0,
      fontFamily: "'Outfit', 'Inter', sans-serif",
      fontSize: '20px',
      fontWeight: '800',
      color: '#1A1A1A',
      textTransform: 'uppercase',
      letterSpacing: '0.5px',
    },
    closeBtn: {
      background: '#F5F0E8',
      border: '2px solid #1A1A1A',
      color: '#1A1A1A',
      fontFamily: "'Outfit', 'Inter', sans-serif",
      fontSize: '16px',
      fontWeight: 'bold',
      padding: '4px 8px',
      cursor: 'pointer',
      boxShadow: '2px 2px 0px #1A1A1A',
      transition: 'transform 0.1s, box-shadow 0.1s',
    },
    content: {
      padding: '24px 20px',
      overflowY: 'auto',
      color: '#1A1A1A',
      fontFamily: "'Inter', sans-serif",
      fontSize: '14px',
      lineHeight: '1.5',
    },
  };

  return (
    <div style={styles.overlay} onClick={onClose}>
      <div style={styles.container} onClick={(e) => e.stopPropagation()}>
        <div style={styles.header}>
          <h2 style={styles.title}>{title}</h2>
          <button style={styles.closeBtn} onClick={onClose}>
            ✕
          </button>
        </div>
        <div style={styles.content}>
          {children}
        </div>
      </div>
    </div>
  );
}

import React from 'react';

/**
 * Premium glassmorphism container Card.
 */
export default function Card({ children, className = '', ...props }) {
  return (
    <div className={`card ${className}`} {...props}>
      {children}
    </div>
  );
}

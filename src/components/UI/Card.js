import React from 'react';
import './Card.css';
/* REMOVED import './ui.css' */

const Card = ({children, className = '', ...props}) => {
  return (
    /* Fix: Now matches the CSS selector */
    <div className={`lux-card ${className}`} {...props}>
        {children}
    </div>
  );
};

export default Card;
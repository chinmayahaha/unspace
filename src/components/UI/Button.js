import React from 'react';
import './Button.css'; 
/* REMOVED import './ui.css' - Prevents CSS leakage/conflicts */

const Button = ({
    children, 
    variant = 'primary', // 'primary' | 'secondary' | 'outline'
    className = '', 
    ...props
}) => {
  // Dynamically generate class: "lux-btn-primary" or "lux-btn-outline"
  const buttonClass = `lux-btn-${variant} ${className}`;
  
  return (
    <button className={buttonClass} {...props}>
        {children}
    </button>
  );
};

export default Button;
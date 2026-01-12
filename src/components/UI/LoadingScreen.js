/* src/components/UI/LoadingScreen.js */
import React from 'react';
import './LoadingScreen.css'; // New clean CSS file

const LoadingScreen = () => {
  return (
    <div className="loading-container">
      <div className="loading-content">
        <div className="loading-spinner"></div>
        <div className="loading-text">Entering Unspace...</div>
      </div>
    </div>
  );
};

export default LoadingScreen;
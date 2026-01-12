/* src/components/UI/Lightbox.js */
import React, { useEffect } from 'react';
// DELETED: import './ui.css'; 

const Lightbox = ({ images = [], index = 0, onClose }) => {
  const [current, setCurrent] = React.useState(index);

  useEffect(() => {
    const keyHandler = (e) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowRight') setCurrent((c) => Math.min(c + 1, images.length - 1));
      if (e.key === 'ArrowLeft') setCurrent((c) => Math.max(c - 1, 0));
    };
    document.addEventListener('keydown', keyHandler);
    return () => document.removeEventListener('keydown', keyHandler);
  }, [images.length, onClose]);

  if (!images || images.length === 0) return null;

  return (
    <div className="lightbox-overlay" role="dialog" aria-modal="true" aria-label="Image viewer">
      <button className="lightbox-close" onClick={onClose} aria-label="Close">×</button>
      
      <div className="lightbox-inner">
        <button 
          className="lightbox-nav left" 
          onClick={() => setCurrent((c) => Math.max(c - 1, 0))}
          disabled={current === 0}
        >
          ‹
        </button>
        
        <img 
          src={images[current]} 
          alt={`View ${current + 1}`} 
          className="lightbox-image"
        />
        
        <button 
          className="lightbox-nav right" 
          onClick={() => setCurrent((c) => Math.min(c + 1, images.length - 1))}
          disabled={current === images.length - 1}
        >
          ›
        </button>
      </div>
      
      <div className="lightbox-counter">
        {current + 1} / {images.length}
      </div>
    </div>
  );
};

export default Lightbox;


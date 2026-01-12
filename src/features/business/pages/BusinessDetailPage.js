import React from 'react';
import { Link } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { ICONS } from '../../../config/icons';
import './BusinessDetailPage.css';

const BusinessDetailPage = () => {
  return (
    <div className="business-detail-page">
      <div className="container">
        <div className="page-header">
          <h1>Business Details</h1>
          <p>View business information and reviews</p>
        </div>
        
        <div className="coming-soon">
          <FontAwesomeIcon icon={ICONS.BRIEFCASE} />
          <h2>Coming Soon</h2>
          <p>Business detail page is under development</p>
          <Link to="/businessx" className="btn btn-primary">
            Back to BusinessX
          </Link>
        </div>
      </div>
    </div>
  );
};

export default BusinessDetailPage;

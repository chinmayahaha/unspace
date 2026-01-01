import React from 'react';
import { Link } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { ICONS } from '../config/icons';
import './RequestDetailPage.css';

const RequestDetailPage = () => {
  return (
    <div className="request-detail-page">
      <div className="container">
        <div className="page-header">
          <h1>Request Details</h1>
          <p>View service request information</p>
        </div>
        
        <div className="coming-soon">
          <FontAwesomeIcon icon={ICONS.BULLHORN} />
          <h2>Coming Soon</h2>
          <p>Request detail page is under development</p>
          <Link to="/adsx" className="btn btn-primary">
            Back to AdsX
          </Link>
        </div>
      </div>
    </div>
  );
};

export default RequestDetailPage;

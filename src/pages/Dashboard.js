import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { ICONS } from '../config/icons';
import './Dashboard.css';

const Dashboard = () => {
  const { user, signOut } = useAuth();

  const stats = [
    {
      icon: ICONS.PROJECT_DIAGRAM,
      title: 'Active Projects',
      value: '12',
      change: '+3 this week'
    },
    {
      icon: ICONS.CODE,
      title: 'Code Commits',
      value: '247',
      change: '+15 today'
    },
    {
      icon: ICONS.CHART_LINE,
      title: 'Performance Score',
      value: '94%',
      change: '+2% this month'
    }
  ];

  const recentActivity = [
    {
      action: 'Created new project',
      project: 'E-commerce Backend',
      time: '2 hours ago'
    },
    {
      action: 'Deployed to production',
      project: 'User Auth API',
      time: '5 hours ago'
    },
    {
      action: 'Code review completed',
      project: 'Payment Gateway',
      time: '1 day ago'
    },
    {
      action: 'Database optimization',
      project: 'Analytics Service',
      time: '2 days ago'
    }
  ];

  const quickActions = [
    {
      icon: ICONS.CODE,
      title: 'New Project',
      description: 'Start a new backend project'
    },
    {
      icon: ICONS.CHART_LINE,
      title: 'Analytics',
      description: 'View performance metrics'
    },
    {
      icon: ICONS.SETTINGS,
      title: 'Settings',
      description: 'Configure your preferences'
    }
  ];

  return (
    <div className="dashboard">
      {/* Header */}
      <header className="dashboard-header">
        <div className="dashboard-header-content">
          <div className="dashboard-logo">
            <FontAwesomeIcon icon={ICONS.ROBOT} className="dashboard-icon" />
            <h1>Dashboard</h1>
          </div>
          <div className="dashboard-user-info">
            <div className="user-details">
              <FontAwesomeIcon icon={ICONS.USER} className="user-icon" />
              <div className="user-info">
                <span className="user-name">{user?.name}</span>
                <span className="user-email">{user?.email}</span>
              </div>
            </div>
            <button onClick={signOut} className="signout-button">
              <FontAwesomeIcon icon={ICONS.SIGNOUT} />
              Sign Out
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="dashboard-main">
        <div className="dashboard-content">
          {/* Welcome Section */}
          <section className="welcome-section">
            <h2>Welcome back, {user?.name}!</h2>
            <p>Here's what's happening with your projects today.</p>
          </section>

          {/* Stats Grid */}
          <section className="stats-section">
            <h3>Overview</h3>
            <div className="stats-grid">
              {stats.map((stat, index) => (
                <div key={index} className="stat-card">
                  <div className="stat-icon">
                    <FontAwesomeIcon icon={stat.icon} />
                  </div>
                  <div className="stat-content">
                    <h4>{stat.title}</h4>
                    <div className="stat-value">{stat.value}</div>
                    <div className="stat-change">{stat.change}</div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <div className="dashboard-grid">
            {/* Recent Activity */}
            <section className="activity-section">
              <h3>Recent Activity</h3>
              <div className="activity-list">
                {recentActivity.map((activity, index) => (
                  <div key={index} className="activity-item">
                    <div className="activity-content">
                      <div className="activity-action">{activity.action}</div>
                      <div className="activity-project">{activity.project}</div>
                    </div>
                    <div className="activity-time">
                      <FontAwesomeIcon icon={ICONS.CALENDAR} />
                      {activity.time}
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* Quick Actions */}
            <section className="actions-section">
              <h3>Quick Actions</h3>
              <div className="actions-grid">
                {quickActions.map((action, index) => (
                  <div key={index} className="action-card">
                    <FontAwesomeIcon icon={action.icon} className="action-icon" />
                    <h4>{action.title}</h4>
                    <p>{action.description}</p>
                  </div>
                ))}
              </div>
            </section>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;

// Icons configuration file
import { library } from '@fortawesome/fontawesome-svg-core';


// Import Font Awesome icon sets
import { 
  faRobot,
  faEye, 
  faEyeSlash,
  faBars,
  faTimes,
  faHome,
  faUser,
  faSignOutAlt,
  faCog,
  faChartLine,
  faCode,
  faProjectDiagram,
  faCalendarAlt,
  faDatabase,
  faMagic,
  faMobileAlt,
} from '@fortawesome/free-solid-svg-icons';

import { 
  fab ,
  faGoogle
} from '@fortawesome/free-brands-svg-icons';

// Add icons to the library
library.add(
  // Solid icons
  faRobot,
  faEye,
  faEyeSlash,
  faBars,
  faTimes,
  faHome,
  faUser,
  faSignOutAlt,
  faCog,
  faChartLine,
  faCode,
  faProjectDiagram,
  faCalendarAlt,
  faDatabase,
  faMagic,
  faMobileAlt,
  faGoogle,
  // Brand icons
  fab
);

// Export icon names for easy reference
export const ICONS = {
  // Navigation
  ROBOT: 'robot',
  BARS: 'bars',
  TIMES: 'times',
  HOME: 'home',
  USER: 'user',
  SIGNOUT: 'sign-out-alt',
  SETTINGS: 'cog',
  
  // Auth
  EYE: 'eye',
  EYE_SLASH: 'eye-slash',
  GOOGLE: 'google',
  
  // Dashboard
  CHART_LINE: 'chart-line',
  CODE: 'code',
  PROJECT_DIAGRAM: 'project-diagram',
  CALENDAR: 'calendar-alt',
  
  // Features
  DATABASE: 'database',
  MAGIC: 'magic',
  MOBILE_ALT: 'mobile-alt',
  
  // Brand icons (use array format for brand icons)
  REACT: ['fab', 'react'],
  GITHUB: ['fab', 'github'],
  PYTHON: ['fab', 'python'],
  GOOGLE_BRAND: ['fab', 'google']
};

export default ICONS;

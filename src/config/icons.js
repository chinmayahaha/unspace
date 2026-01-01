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
  faShoppingCart,
  faBook,
  faComments,
  faBriefcase,
  faBullhorn,
  faPlus,
  faEdit,
  faTrash,
  faHeart,
  faStar,
  faSearch,
  faFilter,
  faUpload,
  faImage,
  faFileAlt,
  faEnvelope,
  faPhone,
  faGlobe,
  faMapMarkerAlt,
  faDollarSign,
  faClock,
  faCheck,
  faTimesCircle,
  faExclamationTriangle,
  faInfoCircle,
  faSun,
  faMoon,
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
  faShoppingCart,
  faBook,
  faComments,
  faBriefcase,
  faBullhorn,
  faPlus,
  faEdit,
  faTrash,
  faHeart,
  faStar,
  faSearch,
  faFilter,
  faUpload,
  faImage,
  faFileAlt,
  faEnvelope,
  faPhone,
  faGlobe,
  faMapMarkerAlt,
  faDollarSign,
  faClock,
  faCheck,
  faTimesCircle,
  faExclamationTriangle,
  faInfoCircle,
  faGoogle,
  faSun,
  faMoon,
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
  
  // Main Features
  SHOPPING_CART: 'shopping-cart',
  BOOK: 'book',
  COMMENTS: 'comments',
  BRIEFCASE: 'briefcase',
  BULLHORN: 'bullhorn',
  
  // Actions
  PLUS: 'plus',
  EDIT: 'edit',
  TRASH: 'trash',
  HEART: 'heart',
  STAR: 'star',
  SEARCH: 'search',
  FILTER: 'filter',
  UPLOAD: 'upload',
  IMAGE: 'image',
  FILE_ALT: 'file-alt',
  
  // Contact
  ENVELOPE: 'envelope',
  PHONE: 'phone',
  GLOBE: 'globe',
  MAP_MARKER_ALT: 'map-marker-alt',
  
  // Status
  DOLLAR_SIGN: 'dollar-sign',
  CLOCK: 'clock',
  CHECK: 'check',
  TIMES_CIRCLE: 'times-circle',
  EXCLAMATION_TRIANGLE: 'exclamation-triangle',
  INFO_CIRCLE: 'info-circle',
  SUN: 'sun',
  MOON: 'moon',
  
  // Brand icons (use array format for brand icons)
  REACT: ['fab', 'react'],
  GITHUB: ['fab', 'github'],
  PYTHON: ['fab', 'python'],
  GOOGLE_BRAND: ['fab', 'google']
};

export default ICONS;

export const environment = {
  production: false,
  apiUrl: 'https://learningaksh.onrender.com/api/v1',
  socketUrl: 'https://learningaksh.onrender.com',
  appName: 'EdTech Platform',
  appVersion: '2.0.0',
  
  // Feature flags
  features: {
    analytics: true,
    notifications: true,
    liveSessions: true,
    certificates: true,
    mockTests: true
  },
  
  // Pagination defaults
  pagination: {
    defaultPageSize: 10,
    pageSizeOptions: [5, 10, 25, 50, 100]
  },
  
  // File upload limits (in MB)
  uploadLimits: {
    image: 5,
    video: 100,
    document: 10,
    assignment: 20
  },
  
  // Auth settings
  auth: {
    tokenKey: 'jwt_token',
    refreshTokenKey: 'refresh_token',
    expiresIn: '7d'
  },
  
  // Theme settings
  theme: {
    default: 'theme-luminous',
    available: ['theme-luminous', 'theme-midnight', 'theme-bio-frost', 'theme-solar-flare']
  }

};


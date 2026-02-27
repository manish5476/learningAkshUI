export const environment = {
  production: true,
apiUrl: 'https://learningaksh.onrender.com/api/v1',
  socketUrl: 'https://learningaksh.onrender.com',
  appName: 'EdTech Platform',
  appVersion: '2.0.0',
  
  features: {
    analytics: true,
    notifications: true,
    liveSessions: true,
    certificates: true,
    mockTests: true
  },
  
  pagination: {
    defaultPageSize: 10,
    pageSizeOptions: [5, 10, 25, 50, 100]
  },
  
  uploadLimits: {
    image: 5,
    video: 100,
    document: 10,
    assignment: 20
  },
  
  auth: {
    tokenKey: 'jwt_token',
    refreshTokenKey: 'refresh_token',
    expiresIn: '7d'
  },
  
  theme: {
    default: 'theme-luminous',
    available: ['theme-luminous', 'theme-midnight', 'theme-bio-frost', 'theme-solar-flare']
  }

};

export const endpoints = {
  auth: {
    register:       '/auth/register',
    login:          '/auth/login',
    refresh:        '/auth/refresh',
    logout:         '/auth/logout',
    forgotPassword: '/auth/forgot-password',
    resetPassword:  '/auth/reset-password',
    verifyEmail:    '/auth/verify-email',
  },
  flights: {
    search:  '/flights/search',
    byId:    (id: string) => `/flights/${id}`,
    book:    '/flights/book',
    popular: '/flights/popular',
  },
  hotels: {
    search: '/hotels/search',
    byId:   (id: string) => `/hotels/${id}`,
    rooms:  (id: string) => `/hotels/${id}/rooms`,
    book:   '/hotels/book',
  },
  buses: {
    search: '/buses/search',
    book:   '/buses/book',
  },
  trains: {
    search: '/trains/search',
    book:   '/trains/book',
  },
  cabs: {
    search: '/cabs/search',
    book:   '/cabs/book',
  },
  bookings: {
    list:    '/bookings',
    byId:    (id: string) => `/bookings/${id}`,
    cancel:  (id: string) => `/bookings/${id}/cancel`,
    invoice: (id: string) => `/bookings/${id}/invoice`,
  },
  users: {
    profile:            '/users/profile',
    wallet:             '/users/wallet',
    walletTopup:        '/users/wallet/topup',
    walletTransactions: '/users/wallet/transactions',
    travellers:         '/users/travellers',
    traveller:          (id: string) => `/users/travellers/${id}`,
  },
  admin: {
    dashboard:    '/admin/dashboard',
    analytics:    '/admin/analytics',
    users:        '/admin/users',
    blockUser:    (id: string) => `/admin/users/${id}/block`,
    bookings:     '/admin/bookings',
    coupons:      '/admin/coupons',
    coupon:       (id: string) => `/admin/coupons/${id}`,
  },
  payments: {
    initiate: '/payments/initiate',
    verify:   '/payments/verify',
    status:   (id: string) => `/payments/${id}`,
  },
  coupons: {
    validate: '/coupons/validate',
  },
}

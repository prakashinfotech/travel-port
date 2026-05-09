export const endpoints = {
  auth: {
    register:   '/auth/register',
    login:      '/auth/login',
    refresh:    '/auth/refresh',
    logout:     '/auth/logout',
  },
  flights: {
    search:     '/flights/search',
    byId:       (id: string) => `/flights/${id}`,
    book:       '/flights/book',
  },
  hotels: {
    search:     '/hotels/search',
    byId:       (id: string) => `/hotels/${id}`,
    book:       '/hotels/book',
  },
  bookings: {
    list:       '/bookings',
    byId:       (id: string) => `/bookings/${id}`,
    cancel:     (id: string) => `/bookings/${id}/cancel`,
  },
  users: {
    profile:    '/users/profile',
    wallet:     '/users/wallet',
    travellers: '/users/travellers',
    traveller:  (id: string) => `/users/travellers/${id}`,
  },
}

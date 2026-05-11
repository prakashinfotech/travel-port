export interface Airport {
  code: string
  city: string
  name: string
}

export const AIRPORTS: Airport[] = [
  { code: 'BOM', city: 'Mumbai', name: 'Chhatrapati Shivaji Maharaj International' },
  { code: 'DEL', city: 'New Delhi', name: 'Indira Gandhi International' },
  { code: 'BLR', city: 'Bangalore', name: 'Kempegowda International' },
  { code: 'MAA', city: 'Chennai', name: 'Chennai International' },
  { code: 'HYD', city: 'Hyderabad', name: 'Rajiv Gandhi International' },
  { code: 'CCU', city: 'Kolkata', name: 'Netaji Subhas Chandra Bose International' },
  { code: 'GOI', city: 'Goa', name: 'Goa International Airport (Dabolim)' },
  { code: 'AMD', city: 'Ahmedabad', name: 'Sardar Vallabhbhai Patel International' },
  { code: 'PNQ', city: 'Pune', name: 'Pune Airport' },
  { code: 'JAI', city: 'Jaipur', name: 'Jaipur International Airport' },
  { code: 'COK', city: 'Kochi', name: 'Cochin International Airport' },
  { code: 'TRV', city: 'Thiruvananthapuram', name: 'Trivandrum International Airport' },
  { code: 'LKO', city: 'Lucknow', name: 'Chaudhary Charan Singh International' },
  { code: 'NAG', city: 'Nagpur', name: 'Dr. Babasaheb Ambedkar International' },
  { code: 'IXC', city: 'Chandigarh', name: 'Chandigarh International Airport' },
  { code: 'SXR', city: 'Srinagar', name: 'Sheikh ul-Alam International Airport' },
  { code: 'GAU', city: 'Guwahati', name: 'Lokpriya Gopinath Bordoloi International' },
  { code: 'IXZ', city: 'Port Blair', name: 'Veer Savarkar International Airport' },
  { code: 'VNS', city: 'Varanasi', name: 'Lal Bahadur Shastri International' },
  { code: 'ATQ', city: 'Amritsar', name: 'Sri Guru Ram Dass Jee International' },
  { code: 'BHO', city: 'Bhopal', name: 'Raja Bhoj Airport' },
  { code: 'UDR', city: 'Udaipur', name: 'Maharana Pratap Airport' },
  { code: 'IDR', city: 'Indore', name: 'Devi Ahilyabai Holkar Airport' },
  { code: 'RPR', city: 'Raipur', name: 'Swami Vivekananda Airport' },
]

export function searchAirports(query: string): Airport[] {
  if (!query || query.length < 1) return []
  const q = query.toLowerCase()
  return AIRPORTS.filter(
    a =>
      a.code.toLowerCase().includes(q) ||
      a.city.toLowerCase().includes(q) ||
      a.name.toLowerCase().includes(q)
  ).slice(0, 6)
}

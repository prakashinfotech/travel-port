export interface City {
  name: string
  state: string
}

export const CITIES: City[] = [
  { name: 'Mumbai',           state: 'Maharashtra'      },
  { name: 'Delhi',            state: 'Delhi'            },
  { name: 'Bangalore',        state: 'Karnataka'        },
  { name: 'Chennai',          state: 'Tamil Nadu'       },
  { name: 'Hyderabad',        state: 'Telangana'        },
  { name: 'Kolkata',          state: 'West Bengal'      },
  { name: 'Pune',             state: 'Maharashtra'      },
  { name: 'Ahmedabad',        state: 'Gujarat'          },
  { name: 'Jaipur',           state: 'Rajasthan'        },
  { name: 'Goa',              state: 'Goa'              },
  { name: 'Kochi',            state: 'Kerala'           },
  { name: 'Lucknow',          state: 'Uttar Pradesh'    },
  { name: 'Agra',             state: 'Uttar Pradesh'    },
  { name: 'Varanasi',         state: 'Uttar Pradesh'    },
  { name: 'Mathura',          state: 'Uttar Pradesh'    },
  { name: 'Prayagraj',        state: 'Uttar Pradesh'    },
  { name: 'Kanpur',           state: 'Uttar Pradesh'    },
  { name: 'Nagpur',           state: 'Maharashtra'      },
  { name: 'Nashik',           state: 'Maharashtra'      },
  { name: 'Aurangabad',       state: 'Maharashtra'      },
  { name: 'Kolhapur',         state: 'Maharashtra'      },
  { name: 'Surat',            state: 'Gujarat'          },
  { name: 'Vadodara',         state: 'Gujarat'          },
  { name: 'Rajkot',           state: 'Gujarat'          },
  { name: 'Indore',           state: 'Madhya Pradesh'   },
  { name: 'Bhopal',           state: 'Madhya Pradesh'   },
  { name: 'Jabalpur',         state: 'Madhya Pradesh'   },
  { name: 'Jodhpur',          state: 'Rajasthan'        },
  { name: 'Udaipur',          state: 'Rajasthan'        },
  { name: 'Ajmer',            state: 'Rajasthan'        },
  { name: 'Bikaner',          state: 'Rajasthan'        },
  { name: 'Mysore',           state: 'Karnataka'        },
  { name: 'Mangalore',        state: 'Karnataka'        },
  { name: 'Hubli',            state: 'Karnataka'        },
  { name: 'Coimbatore',       state: 'Tamil Nadu'       },
  { name: 'Madurai',          state: 'Tamil Nadu'       },
  { name: 'Tiruchirappalli',  state: 'Tamil Nadu'       },
  { name: 'Pondicherry',      state: 'Puducherry'       },
  { name: 'Tirupati',         state: 'Andhra Pradesh'   },
  { name: 'Visakhapatnam',    state: 'Andhra Pradesh'   },
  { name: 'Vijayawada',       state: 'Andhra Pradesh'   },
  { name: 'Warangal',         state: 'Telangana'        },
  { name: 'Patna',            state: 'Bihar'            },
  { name: 'Ranchi',           state: 'Jharkhand'        },
  { name: 'Bhubaneswar',      state: 'Odisha'           },
  { name: 'Puri',             state: 'Odisha'           },
  { name: 'Chandigarh',       state: 'Punjab'           },
  { name: 'Amritsar',         state: 'Punjab'           },
  { name: 'Ludhiana',         state: 'Punjab'           },
  { name: 'Shimla',           state: 'Himachal Pradesh' },
  { name: 'Manali',           state: 'Himachal Pradesh' },
  { name: 'Dehradun',         state: 'Uttarakhand'      },
  { name: 'Haridwar',         state: 'Uttarakhand'      },
  { name: 'Rishikesh',        state: 'Uttarakhand'      },
  { name: 'Nainital',         state: 'Uttarakhand'      },
  { name: 'Srinagar',         state: 'Jammu & Kashmir'  },
  { name: 'Jammu',            state: 'Jammu & Kashmir'  },
  { name: 'Leh',              state: 'Ladakh'           },
  { name: 'Guwahati',         state: 'Assam'            },
  { name: 'Shillong',         state: 'Meghalaya'        },
  { name: 'Raipur',           state: 'Chhattisgarh'     },
  { name: 'Thiruvananthapuram', state: 'Kerala'         },
  { name: 'Kozhikode',        state: 'Kerala'           },
  { name: 'Mahabalipuram',    state: 'Tamil Nadu'       },
  { name: 'Ooty',             state: 'Tamil Nadu'       },
  { name: 'Darjeeling',       state: 'West Bengal'      },
  { name: 'Siliguri',         state: 'West Bengal'      },
]

const POPULAR_CITIES = CITIES.slice(0, 10)

export function searchCities(query: string): City[] {
  if (!query || query.length < 1) return POPULAR_CITIES
  const q = query.toLowerCase()
  return CITIES.filter(c =>
    c.name.toLowerCase().includes(q) ||
    c.state.toLowerCase().includes(q)
  ).slice(0, 8)
}

export { POPULAR_CITIES }

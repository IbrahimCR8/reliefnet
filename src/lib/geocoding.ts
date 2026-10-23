/**
 * ReliefNet Geocoding Service
 *
 * Provides forward geocoding (place name/address/PIN code -> coordinates)
 * and reverse geocoding (coordinates -> readable address).
 *
 * Uses OpenStreetMap Nominatim with strict adherence to OSM Usage Policy:
 * - Valid User-Agent identifying the application
 * - In-memory caching to minimize upstream requests
 * - Request timeouts and error handling
 * - Built-in fallback catalog for offline resilience & instant demo responses
 */

export interface GeocodeLocation {
  place_id: string;
  display_name: string;
  name: string;
  latitude: number;
  longitude: number;
  type?: string;
  importance?: number;
  address?: {
    road?: string;
    suburb?: string;
    neighbourhood?: string;
    city?: string;
    state?: string;
    postcode?: string;
    country?: string;
  };
}

interface NominatimItem {
  place_id: number | string;
  display_name: string;
  name?: string;
  lat: string;
  lon: string;
  type?: string;
  importance?: number;
  address?: {
    road?: string;
    suburb?: string;
    neighbourhood?: string;
    city?: string;
    state?: string;
    postcode?: string;
    country?: string;
  };
}

// In-memory cache for forward and reverse geocoding (TTL: 1 hour)
interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

const CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour
const forwardCache = new Map<string, CacheEntry<GeocodeLocation[]>>();
const reverseCache = new Map<string, CacheEntry<GeocodeLocation | null>>();

const NOMINATIM_BASE = 'https://nominatim.openstreetmap.org';
const USER_AGENT = 'ReliefNet-DisasterResponsePlatform/1.0 (contact: admin@reliefnet.org)';

/**
 * Built-in fallback database for key Indian cities, landmarks, and PIN codes.
 * Ensures the platform works even if OSM rate-limits or the network is constrained.
 */
const OFFLINE_LOCATIONS: Array<{
  keywords: string[];
  location: GeocodeLocation;
}> = [
  {
    keywords: ['velachery', '600042', 'chennai'],
    location: {
      place_id: 'offline-velachery',
      name: 'Velachery',
      display_name: 'Velachery, Chennai, Tamil Nadu, 600042, India',
      latitude: 12.9815,
      longitude: 80.2180,
      type: 'suburb',
      address: {
        suburb: 'Velachery',
        city: 'Chennai',
        state: 'Tamil Nadu',
        postcode: '600042',
        country: 'India',
      },
    },
  },
  {
    keywords: ['tambaram', 'government hospital, tambaram', 'gh tambaram', '600045'],
    location: {
      place_id: 'offline-tambaram',
      name: 'Government Hospital, Tambaram',
      display_name: 'Government Hospital, GST Road, Tambaram, Chennai, Tamil Nadu, 600045, India',
      latitude: 12.9249,
      longitude: 80.1264,
      type: 'hospital',
      address: {
        road: 'GST Road',
        suburb: 'Tambaram',
        city: 'Chennai',
        state: 'Tamil Nadu',
        postcode: '600045',
        country: 'India',
      },
    },
  },
  {
    keywords: ['marina beach', 'marina beach, chennai', 'triplicane'],
    location: {
      place_id: 'offline-marina',
      name: 'Marina Beach',
      display_name: 'Marina Beach, Kamarajar Salai, Triplicane, Chennai, Tamil Nadu, 600005, India',
      latitude: 13.0500,
      longitude: 80.2824,
      type: 'beach',
      address: {
        road: 'Kamarajar Salai',
        suburb: 'Triplicane',
        city: 'Chennai',
        state: 'Tamil Nadu',
        postcode: '600005',
        country: 'India',
      },
    },
  },
  {
    keywords: ['hyderabad', 'charminar', 'telangana'],
    location: {
      place_id: 'offline-charminar',
      name: 'Charminar',
      display_name: 'Charminar, Old City, Hyderabad, Telangana, 500002, India',
      latitude: 17.3616,
      longitude: 78.4747,
      type: 'monument',
      address: {
        neighbourhood: 'Old City',
        city: 'Hyderabad',
        state: 'Telangana',
        postcode: '500002',
        country: 'India',
      },
    },
  },
  {
    keywords: ['riverside colony', 'fictional city'],
    location: {
      place_id: 'offline-riverside',
      name: 'Riverside Colony',
      display_name: 'Riverside Colony, Riverfront Road, Hyderabad, Telangana, 500012, India',
      latitude: 17.3850,
      longitude: 78.4867,
      type: 'residential',
      address: {
        neighbourhood: 'Riverside Colony',
        city: 'Hyderabad',
        state: 'Telangana',
        country: 'India',
      },
    },
  },
  {
    keywords: ['greenfield school', 'north district'],
    location: {
      place_id: 'offline-greenfield',
      name: 'Greenfield Primary School',
      display_name: 'Greenfield Primary School, North District Road, Hyderabad, Telangana, 500020, India',
      latitude: 17.4100,
      longitude: 78.5200,
      type: 'school',
      address: {
        neighbourhood: 'North District',
        city: 'Hyderabad',
        state: 'Telangana',
        country: 'India',
      },
    },
  },
  {
    keywords: ['mumbai', 'dadar', '400014', 'maharashtra'],
    location: {
      place_id: 'offline-mumbai-dadar',
      name: 'Dadar',
      display_name: 'Dadar, Mumbai, Maharashtra, 400014, India',
      latitude: 19.0178,
      longitude: 72.8478,
      type: 'suburb',
      address: {
        suburb: 'Dadar',
        city: 'Mumbai',
        state: 'Maharashtra',
        postcode: '400014',
        country: 'India',
      },
    },
  },
  {
    keywords: ['bengaluru', 'bangalore', 'koramangala', '560034', 'karnataka'],
    location: {
      place_id: 'offline-koramangala',
      name: 'Koramangala',
      display_name: 'Koramangala, Bengaluru, Karnataka, 560034, India',
      latitude: 12.9352,
      longitude: 77.6245,
      type: 'suburb',
      address: {
        suburb: 'Koramangala',
        city: 'Bengaluru',
        state: 'Karnataka',
        postcode: '560034',
        country: 'India',
      },
    },
  },
  {
    keywords: ['delhi', 'connaught place', 'cp', '110001'],
    location: {
      place_id: 'offline-delhi-cp',
      name: 'Connaught Place',
      display_name: 'Connaught Place, New Delhi, Delhi, 110001, India',
      latitude: 28.6315,
      longitude: 77.2167,
      type: 'commercial',
      address: {
        suburb: 'Connaught Place',
        city: 'New Delhi',
        state: 'Delhi',
        postcode: '110001',
        country: 'India',
      },
    },
  },
];

/**
 * Searches offline dictionary for matching entries
 */
function searchOfflineLocations(query: string): GeocodeLocation[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];

  const matched = OFFLINE_LOCATIONS.filter((item) =>
    item.keywords.some((kw) => q.includes(kw) || kw.includes(q))
  ).map((item) => item.location);

  return matched;
}

/**
 * Forward Geocoding: Converts an address/place name into coordinates
 */
export async function forwardGeocode(
  query: string,
  limit: number = 5
): Promise<GeocodeLocation[]> {
  const cleanQuery = query.trim();
  if (!cleanQuery || cleanQuery.length < 2) {
    return [];
  }

  // Check in-memory cache
  const cacheKey = `${cleanQuery.toLowerCase()}_${limit}`;
  const cached = forwardCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
    return cached.data;
  }

  try {
    const params = new URLSearchParams({
      q: cleanQuery,
      format: 'jsonv2',
      addressdetails: '1',
      limit: String(limit),
    });

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4500); // 4.5s timeout

    const res = await fetch(`${NOMINATIM_BASE}/search?${params.toString()}`, {
      headers: {
        'User-Agent': USER_AGENT,
        Accept: 'application/json',
      },
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) {
        const results: GeocodeLocation[] = data.map((item: NominatimItem) => ({
          place_id: String(item.place_id),
          display_name: item.display_name,
          name: item.name || item.display_name.split(',')[0],
          latitude: parseFloat(item.lat),
          longitude: parseFloat(item.lon),
          type: item.type,
          importance: item.importance,
          address: item.address,
        }));

        forwardCache.set(cacheKey, { data: results, timestamp: Date.now() });
        return results;
      }
    }
  } catch (err) {
    // Network error or timeout, proceed to offline catalog
    console.warn('[geocoding] Upstream geocoding failed or timed out:', err);
  }

  // Fallback to offline catalog if upstream had no results or failed
  const offlineMatches = searchOfflineLocations(cleanQuery);
  if (offlineMatches.length > 0) {
    forwardCache.set(cacheKey, { data: offlineMatches, timestamp: Date.now() });
    return offlineMatches;
  }

  return [];
}

/**
 * Reverse Geocoding: Converts coordinates into a readable address
 */
export async function reverseGeocode(
  latitude: number,
  longitude: number
): Promise<GeocodeLocation | null> {
  if (
    typeof latitude !== 'number' ||
    typeof longitude !== 'number' ||
    isNaN(latitude) ||
    isNaN(longitude) ||
    latitude < -90 ||
    latitude > 90 ||
    longitude < -180 ||
    longitude > 180
  ) {
    return null;
  }

  // Rounded cache key to ~11 meters precision
  const cacheKey = `${latitude.toFixed(4)},${longitude.toFixed(4)}`;
  const cached = reverseCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
    return cached.data;
  }

  try {
    const params = new URLSearchParams({
      lat: String(latitude),
      lon: String(longitude),
      format: 'jsonv2',
      addressdetails: '1',
    });

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4500);

    const res = await fetch(`${NOMINATIM_BASE}/reverse?${params.toString()}`, {
      headers: {
        'User-Agent': USER_AGENT,
        Accept: 'application/json',
      },
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (res.ok) {
      const item = await res.json();
      if (item && item.lat && item.lon) {
        const result: GeocodeLocation = {
          place_id: String(item.place_id),
          display_name: item.display_name,
          name: item.name || item.display_name.split(',')[0],
          latitude: parseFloat(item.lat),
          longitude: parseFloat(item.lon),
          type: item.type,
          address: item.address,
        };

        reverseCache.set(cacheKey, { data: result, timestamp: Date.now() });
        return result;
      }
    }
  } catch (err) {
    console.warn('[geocoding] Reverse geocoding failed or timed out:', err);
  }

  // Fallback to closest offline location if within ~15km
  for (const item of OFFLINE_LOCATIONS) {
    const dLat = Math.abs(item.location.latitude - latitude);
    const dLon = Math.abs(item.location.longitude - longitude);
    if (dLat < 0.15 && dLon < 0.15) {
      return item.location;
    }
  }

  // Generic fallback address representation
  const genericFallback: GeocodeLocation = {
    place_id: `coord-${cacheKey}`,
    name: `Location (${latitude.toFixed(3)}°, ${longitude.toFixed(3)}°)`,
    display_name: `Point near ${latitude.toFixed(4)}, ${longitude.toFixed(4)}`,
    latitude,
    longitude,
  };

  return genericFallback;
}

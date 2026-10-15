/**
 * pincodeUtils.ts
 * Bi-directional Indian PIN Code <-> Area / Dispatch Zone resolution engine.
 * - PIN Code -> Area Name (e.g. 400014 -> Dadar, 414502 -> Shevgaon, 400068 -> Dahisar)
 * - Area Name -> PIN Code (e.g. Dadar -> 400014, Shevgaon -> 414502, Borivali -> 400092)
 */

const PINCODE_STORAGE_KEY = 'omnipack_pincodes_cache';

function loadStoredPincodes(): Record<string, string> {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      const data = localStorage.getItem(PINCODE_STORAGE_KEY);
      if (data) return JSON.parse(data);
    }
  } catch (_) {}
  return {};
}

function saveStoredPincode(pin: string, area: string): void {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      const current = loadStoredPincodes();
      current[pin] = area;
      localStorage.setItem(PINCODE_STORAGE_KEY, JSON.stringify(current));
    }
  } catch (_) {}
}

const pincodeCache = new Map<string, string>(Object.entries(loadStoredPincodes()));
const areaToPinCache = new Map<string, string>();

// Populate reverse cache from stored pincodes
pincodeCache.forEach((area, pin) => {
  if (area && pin) areaToPinCache.set(area.toLowerCase(), pin);
});

// High-speed local map for popular zones & localities
const LOCAL_PINCODE_MAP: Record<string, string> = {
  '400014': 'Dadar',
  '400018': 'Worli',
  '400050': 'Bandra West',
  '400051': 'Bandra East',
  '400068': 'Dahisar',
  '400091': 'Borivali',
  '400092': 'Borivali',
  '400103': 'Borivali',
  '400066': 'Borivali',
  '400067': 'Kandivali',
  '400101': 'Kandivali',
  '400104': 'Kandivali',
  '401107': 'Mira Road',
  '401201': 'Vasai',
  '401202': 'Vasai',
  '401208': 'Vasai',
  '401209': 'Vasai',
  '401303': 'Virar',
  '401305': 'Virar',
  '400064': 'Malad',
  '400097': 'Malad',
  '400062': 'Goregaon',
  '400063': 'Goregaon',
  '400065': 'Goregaon',
  '400053': 'Andheri',
  '400058': 'Andheri',
  '400059': 'Andheri',
  '400069': 'Andheri',
  '400099': 'Andheri',
  '400047': 'Andheri',
  '400072': 'Andheri',
  '414502': 'Shevgaon',
  '414001': 'Ahmednagar'
};

const REGIONAL_PREFIX_MAP: Record<string, string> = {
  '110': 'New Delhi',
  '121': 'Faridabad',
  '122': 'Gurugram',
  '201': 'Noida / Ghaziabad',
  '302': 'Jaipur',
  '380': 'Ahmedabad',
  '395': 'Surat',
  '400': 'Mumbai',
  '401': 'Palghar / Vasai',
  '411': 'Pune',
  '413': 'Solapur',
  '414': 'Ahmednagar',
  '415': 'Satara',
  '416': 'Kolhapur',
  '421': 'Thane / Kalyan',
  '422': 'Nashik',
  '431': 'Chhatrapati Sambhajinagar',
  '440': 'Nagpur',
  '500': 'Hyderabad',
  '560': 'Bengaluru',
  '600': 'Chennai',
  '700': 'Kolkata'
};

/**
 * Resolves 6-digit Indian PIN code to its exact locality / area name.
 */
export async function fetchAreaFromPincode(pin: string): Promise<string> {
  const code = pin.trim();
  if (!code || code.length !== 6 || !/^\d{6}$/.test(code)) {
    return '';
  }

  if (pincodeCache.has(code)) {
    return pincodeCache.get(code)!;
  }

  if (LOCAL_PINCODE_MAP[code]) {
    const localArea = LOCAL_PINCODE_MAP[code];
    pincodeCache.set(code, localArea);
    saveStoredPincode(code, localArea);
    return localArea;
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3500);
    
    const res = await fetch(`https://api.postalpincode.in/pincode/${code}`, {
      signal: controller.signal
    });
    clearTimeout(timeoutId);

    if (res.ok) {
      const data = await res.json();
      if (
        Array.isArray(data) && 
        data[0]?.Status === 'Success' && 
        Array.isArray(data[0]?.PostOffice) && 
        data[0].PostOffice.length > 0
      ) {
        const poList = data[0].PostOffice;

        const primaryPO = poList.find((po: any) => 
          po.DeliveryStatus === 'Delivery' && po.Name && po.Name.trim() !== ''
        ) || poList.find((po: any) => 
          (po.BranchType === 'Head Post Office' || po.BranchType === 'Sub Post Office') && 
          po.Name && po.Name.trim() !== ''
        ) || poList[0];

        let areaName = '';

        if (primaryPO && primaryPO.Name) {
          areaName = primaryPO.Name
            .replace(/\s*\([^)]*\)/g, '')
            .replace(/\s+(S\.?O\.?|B\.?O\.?|H\.?O\.?)$/i, '')
            .trim();
        }

        if (!areaName || areaName.toLowerCase() === 'mumbai' || areaName.toLowerCase() === 'pune') {
          const blockEntry = poList.find((po: any) => po.Block && po.Block.trim() !== 'NA' && po.Block.trim().toLowerCase() !== 'mumbai' && po.Block.trim().toLowerCase() !== 'na');
          if (blockEntry && blockEntry.Block) {
            areaName = blockEntry.Block.trim();
          }
        }

        if (!areaName && primaryPO && primaryPO.Block && primaryPO.Block.trim() !== 'NA') {
          areaName = primaryPO.Block.trim();
        } else if (!areaName && primaryPO && primaryPO.District) {
          areaName = primaryPO.District.trim();
        }

        if (areaName) {
          areaName = areaName.charAt(0).toUpperCase() + areaName.slice(1);
          pincodeCache.set(code, areaName);
          saveStoredPincode(code, areaName);
          areaToPinCache.set(areaName.toLowerCase(), code);
          return areaName;
        }
      }
    }
  } catch (err) {
    console.warn(`India Post API lookup notice for ${code}:`, err);
  }

  const prefix3 = code.substring(0, 3);
  if (REGIONAL_PREFIX_MAP[prefix3]) {
    const regionalArea = REGIONAL_PREFIX_MAP[prefix3];
    pincodeCache.set(code, regionalArea);
    return regionalArea;
  }

  const fallback = 'All India';
  pincodeCache.set(code, fallback);
  return fallback;
}

/**
 * Reverse lookup: Resolves a Zone/Area name to its corresponding 6-digit PIN code.
 */
export async function fetchPincodeFromArea(areaName: string): Promise<string> {
  const name = areaName.trim();
  if (!name || name === 'All India' || name === 'Other') return '';

  const lowerName = name.toLowerCase();

  if (areaToPinCache.has(lowerName)) {
    return areaToPinCache.get(lowerName)!;
  }

  // 1. Search in local exact map
  for (const [pin, zone] of Object.entries(LOCAL_PINCODE_MAP)) {
    if (zone.toLowerCase() === lowerName || lowerName === zone.toLowerCase()) {
      areaToPinCache.set(lowerName, pin);
      return pin;
    }
  }

  // 2. Search in pincodeCache
  for (const [pin, zone] of pincodeCache.entries()) {
    if (zone.toLowerCase() === lowerName) {
      areaToPinCache.set(lowerName, pin);
      return pin;
    }
  }

  // 3. Query India Post Office API
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3500);

    const res = await fetch(`https://api.postalpincode.in/postoffice/${encodeURIComponent(name)}`, {
      signal: controller.signal
    });
    clearTimeout(timeoutId);

    if (res.ok) {
      const data = await res.json();
      if (
        Array.isArray(data) && 
        data[0]?.Status === 'Success' && 
        Array.isArray(data[0]?.PostOffice) && 
        data[0].PostOffice.length > 0
      ) {
        const poList = data[0].PostOffice;

        const targetPO = poList.find((po: any) => 
          po.Circle === 'Maharashtra' && (po.BranchType === 'Head Post Office' || po.BranchType === 'Sub Post Office') && po.Pincode
        ) || poList.find((po: any) => 
          (po.BranchType === 'Head Post Office' || po.BranchType === 'Sub Post Office') && po.Pincode
        ) || poList.find((po: any) => po.Pincode) || poList[0];

        if (targetPO && targetPO.Pincode) {
          const matchedPin = targetPO.Pincode.trim();
          areaToPinCache.set(lowerName, matchedPin);
          pincodeCache.set(matchedPin, name);
          saveStoredPincode(matchedPin, name);
          return matchedPin;
        }
      }
    }
  } catch (err) {
    console.warn(`India Post Office lookup notice for ${name}:`, err);
  }

  return '';
}

export function syncMapPincodeToArea(pin: string): string {
  const code = pin.trim();
  if (!code) return '';
  if (pincodeCache.has(code)) return pincodeCache.get(code)!;
  if (LOCAL_PINCODE_MAP[code]) return LOCAL_PINCODE_MAP[code];
  return '';
}

export function syncMapAreaToPincode(areaName: string): string {
  const name = areaName.trim().toLowerCase();
  if (!name) return '';
  if (areaToPinCache.has(name)) return areaToPinCache.get(name)!;
  for (const [pin, zone] of Object.entries(LOCAL_PINCODE_MAP)) {
    if (zone.toLowerCase() === name) return pin;
  }
  return '';
}

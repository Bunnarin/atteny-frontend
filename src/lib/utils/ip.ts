const IP_STORAGE_KEY = 'cached_ip';

export async function getClientIP(): Promise<string | null> {
  // Return cached IP if available
  const cachedIP = localStorage.getItem(IP_STORAGE_KEY);
  if (cachedIP) return cachedIP;

  try {
    const response = await fetch('https://api.ipify.org?format=json');
    if (!response.ok) throw new Error('Failed to fetch IP');
    
    const data = await response.json();
    const ip = data.ip;
    
    // Store IP in localStorage for future use
    if (ip) {
      localStorage.setItem(IP_STORAGE_KEY, ip);
    }
    
    return ip;
  } catch (error) {
    console.error('Error fetching IP:', error);
    return null;
  }
}

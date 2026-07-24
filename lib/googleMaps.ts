// Google Maps Places(New)/Routes API 래퍼. GOOGLE_MAPS_API_KEY가 없으면 mock 데이터를 반환한다.

export type RouteLeg = {
  fromName: string;
  toName: string;
  distanceMeters: number;
  durationMinutes: number;
  isMock: boolean;
};

export async function getRoute(fromName: string, toName: string): Promise<RouteLeg> {
  const apiKey = process.env.GOOGLE_MAPS_API_KEY;
  if (!apiKey) {
    return mockRoute(fromName, toName);
  }

  const res = await fetch('https://routes.googleapis.com/directions/v2:computeRoutes', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Goog-Api-Key': apiKey,
      'X-Goog-FieldMask': 'routes.duration,routes.distanceMeters',
    },
    body: JSON.stringify({
      origin: { address: fromName },
      destination: { address: toName },
      travelMode: 'TRANSIT',
    }),
  });

  if (!res.ok) {
    throw new Error(`Google Routes API error: ${res.status} ${await res.text()}`);
  }

  const json = await res.json();
  const route = json?.routes?.[0];
  return {
    fromName,
    toName,
    distanceMeters: route?.distanceMeters ?? 0,
    durationMinutes: route?.duration ? Math.round(parseInt(route.duration) / 60) : 0,
    isMock: false,
  };
}

function mockRoute(fromName: string, toName: string): RouteLeg {
  return {
    fromName,
    toName,
    distanceMeters: 3200,
    durationMinutes: 18,
    isMock: true,
  };
}

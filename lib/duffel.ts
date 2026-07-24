// Duffel 항공권 검색 래퍼. DUFFEL_API_KEY가 없으면 sandbox 라벨이 붙은 mock 데이터를 반환한다.
// 실제 키가 생기면 .env.local 에 DUFFEL_API_KEY=duffel_test_... 를 넣기만 하면 real API로 전환된다.

export type FlightOffer = {
  id: string;
  origin: string;
  destination: string;
  departureDate: string;
  airline: string;
  priceAmount: number;
  priceCurrency: string;
  durationMinutes: number;
  isMock: boolean;
};

export type FlightSearchParams = {
  origin: string;
  destination: string;
  departureDate: string;
  returnDate?: string;
};

export async function searchFlights(params: FlightSearchParams): Promise<FlightOffer[]> {
  const apiKey = process.env.DUFFEL_API_KEY;
  if (!apiKey) {
    return mockFlights(params);
  }

  const res = await fetch('https://api.duffel.com/air/offer_requests?return_offers=true', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Duffel-Version': 'v2',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      data: {
        slices: [
          { origin: params.origin, destination: params.destination, departure_date: params.departureDate },
          ...(params.returnDate
            ? [{ origin: params.destination, destination: params.origin, departure_date: params.returnDate }]
            : []),
        ],
        passengers: [{ type: 'adult' }],
        cabin_class: 'economy',
      },
    }),
  });

  if (!res.ok) {
    throw new Error(`Duffel API error: ${res.status} ${await res.text()}`);
  }

  const json = await res.json();
  const offers = json?.data?.offers ?? [];
  return offers.map((offer: any) => ({
    id: offer.id,
    origin: params.origin,
    destination: params.destination,
    departureDate: params.departureDate,
    airline: offer.owner?.name ?? 'Unknown',
    priceAmount: Number(offer.total_amount),
    priceCurrency: offer.total_currency,
    durationMinutes: 0,
    isMock: false,
  }));
}

function mockFlights({ origin, destination, departureDate }: FlightSearchParams): FlightOffer[] {
  return [
    {
      id: 'mock-1',
      origin,
      destination,
      departureDate,
      airline: '(샌드박스) Sample Airlines',
      priceAmount: 320000,
      priceCurrency: 'KRW',
      durationMinutes: 150,
      isMock: true,
    },
    {
      id: 'mock-2',
      origin,
      destination,
      departureDate,
      airline: '(샌드박스) Budget Air',
      priceAmount: 245000,
      priceCurrency: 'KRW',
      durationMinutes: 165,
      isMock: true,
    },
  ];
}

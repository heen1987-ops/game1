// Agoda Partner 숙소 검색 래퍼. AGODA_API_KEY가 없으면 sandbox 라벨이 붙은 mock 데이터를 반환한다.
// 실제 파트너 승인이 나면 .env.local 에 AGODA_API_KEY를 넣고 실제 엔드포인트로 교체한다.
// (Agoda Partner Search API의 정확한 엔드포인트/파라미터는 파트너 승인 후 제공되는 문서 기준으로 맞춘다.)

export type HotelOffer = {
  id: string;
  name: string;
  city: string;
  pricePerNight: number;
  currency: string;
  rating: number;
  isMock: boolean;
};

export type HotelSearchParams = {
  city: string;
  checkIn: string;
  checkOut: string;
  guests: number;
};

export async function searchHotels(params: HotelSearchParams): Promise<HotelOffer[]> {
  const apiKey = process.env.AGODA_API_KEY;
  if (!apiKey) {
    return mockHotels(params);
  }

  // TODO: Agoda Partner 승인 후 실제 엔드포인트로 교체
  throw new Error('AGODA_API_KEY가 설정되어 있지만 실제 API 연동은 아직 구현되지 않았습니다.');
}

function mockHotels({ city }: HotelSearchParams): HotelOffer[] {
  return [
    {
      id: 'mock-hotel-1',
      name: `(샌드박스) ${city} Central Hotel`,
      city,
      pricePerNight: 95000,
      currency: 'KRW',
      rating: 4.2,
      isMock: true,
    },
    {
      id: 'mock-hotel-2',
      name: `(샌드박스) ${city} Budget Inn`,
      city,
      pricePerNight: 58000,
      currency: 'KRW',
      rating: 3.6,
      isMock: true,
    },
  ];
}

/** Travel affiliate offers — cashback into trip pot (specialty monetization) */
export type AffiliateOffer = {
  id: string;
  brand: string;
  title: string;
  cashbackPct: number;
  category: 'stay' | 'bus' | 'flight' | 'activity';
  blurb: string;
  /** Placeholder partner URL — swap for real affiliate links later */
  url: string;
};

export const AFFILIATE_OFFERS: AffiliateOffer[] = [
  {
    id: 'stay_zostel',
    brand: 'Zostel',
    title: 'Hostels & stays',
    cashbackPct: 5,
    category: 'stay',
    blurb: 'Book group stay → 5% back into your trip pot',
    url: 'https://www.zostel.com/',
  },
  {
    id: 'bus_redbus',
    brand: 'redBus',
    title: 'Intercity buses',
    cashbackPct: 3,
    category: 'bus',
    blurb: 'Group bus tickets with cashback on settle',
    url: 'https://www.redbus.in/',
  },
  {
    id: 'flight_ixigo',
    brand: 'ixigo',
    title: 'Flights',
    cashbackPct: 2,
    category: 'flight',
    blurb: 'Split flight fares + earn pot credit',
    url: 'https://www.ixigo.com/',
  },
  {
    id: 'act_thrill',
    brand: 'Thrillophilia',
    title: 'Activities',
    cashbackPct: 4,
    category: 'activity',
    blurb: 'Paragliding, rafting — split + cashback',
    url: 'https://www.thrillophilia.com/',
  },
];

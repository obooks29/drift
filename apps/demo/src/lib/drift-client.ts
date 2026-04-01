export interface FlightResult {
  id: string; origin: string; destination: string;
  departure: string; arrival: string; airline: string;
  price: number; currency: string; class: "economy" | "business";
}
export interface HotelResult {
  id: string; name: string; location: string;
  stars: number; pricePerNight: number; currency: string; available: boolean;
}
export const MOCK_FLIGHTS: FlightResult[] = [
  { id: "f1", origin: "LOS", destination: "LHR", departure: "2026-06-12T22:00", arrival: "2026-06-13T06:30", airline: "British Airways", price: 847.50, currency: "USD", class: "economy" },
  { id: "f2", origin: "LOS", destination: "LHR", departure: "2026-06-12T18:00", arrival: "2026-06-13T04:45", airline: "Virgin Atlantic", price: 923.00, currency: "USD", class: "economy" },
  { id: "f3", origin: "LOS", destination: "LHR", departure: "2026-06-13T01:00", arrival: "2026-06-13T09:15", airline: "Emirates", price: 1142.00, currency: "USD", class: "business" },
];
export const MOCK_HOTELS: HotelResult[] = [
  { id: "h1", name: "The Shoreditch", location: "East London", stars: 4, pricePerNight: 189, currency: "USD", available: true },
  { id: "h2", name: "Canary Wharf Marriott", location: "Canary Wharf", stars: 5, pricePerNight: 274, currency: "USD", available: true },
  { id: "h3", name: "CitizenM Tower Bridge", location: "London Bridge", stars: 4, pricePerNight: 156, currency: "USD", available: true },
];
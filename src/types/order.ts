interface Order {
  id: string;
  event: string;
  date: string;
  price: number;
  subtotal: number;
  fees: number;
  tickets: number;
  ticketPins: string[];
  isUpcoming: boolean;
  eventImage: string;
}
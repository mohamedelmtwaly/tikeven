/** @format */

export interface OrganizerSettings {
  userId: string;
  defaultTicketQuantity?: number;
  defaultTicketPrice?: number;
  defaultVisibility?: "public" | "private" | "unlisted";
  emailNotifications?: boolean;
  inAppAlerts?: boolean;
  accountId?: string;
  accountActive?: boolean;
  bankAccountNumber?: string;
  routingNumber?: string;
  paymentProviderApiKey?: string;
  facebookUrl?: string;
  instagramUrl?: string;
  twitterUrl?: string;
  websiteUrl?: string;
}

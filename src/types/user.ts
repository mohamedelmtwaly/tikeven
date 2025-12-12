/** @format */

export default interface User {
  id: string;
  name: string;
  email: string;
  image?: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
  blocked?: boolean;
  role: string;
  gender?: string;
  age?: number | string;
  country?: string;
  city?: string;
  description?: string
}

export interface Category {
  id?: string;
  name: string;
  image: string;
  eventsCount?: number;
}

export interface CategoriesState {
  categories: Category[];
  loading: boolean;
  error: string | null;
}
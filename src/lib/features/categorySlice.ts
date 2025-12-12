import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import { collection, addDoc, getDocs, doc, updateDoc, deleteDoc, query, where, getCountFromServer } from "firebase/firestore";
import { db } from "@/services/firebase/config";
import { Category, CategoriesState } from "@/types/category";

const initialState: CategoriesState = {
  categories: [],
  loading: true,
  error: null,
};

export const fetchCategories = createAsyncThunk(
  "categories/fetchCategories",
  async (_, { rejectWithValue }) => {
    try {
      const snapshot = await getDocs(collection(db, "categories"));

      const categories: Category[] = await Promise.all(
        snapshot.docs.map(async (docItem) => {
          const data = docItem.data();
          const id = docItem.id;

          const eventsRef = collection(db, "events");
          const q = query(eventsRef, where("category", "==", id));
          const countSnapshot = await getCountFromServer(q);
          const eventsCount = countSnapshot.data().count;

          return {
            id,
            eventsCount,
            ...data,
          } as Category;
        })
      );

      return categories;
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

export const checkCategoryExists = async (name: string, excludeId?: string): Promise<boolean> => {
  let q = query(collection(db, "categories"), where("name", "==", name.trim()));
  if (excludeId) {
    q = query(q, where("__name__", "!=", excludeId));
  }
  const snapshot = await getCountFromServer(q);
  return snapshot.data().count > 0;
};

export const addCategory = createAsyncThunk(
  "categories/addCategory",
  async (category: Omit<Category, "id">, { rejectWithValue }) => {
    try {
      const exists = await checkCategoryExists(category.name);
      if (exists) {
        return rejectWithValue("A category with this name already exists");
      }
      const docRef = await addDoc(collection(db, "categories"), category);
      return { id: docRef.id, ...category };
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to add category");
    }
  }
);

export const editCategory = createAsyncThunk(
  "categories/editCategory",
  async (
    { id, updatedData }: { id: string; updatedData: Partial<Category> },
    { rejectWithValue }
  ) => {
    try {
      // Only check for duplicate if name is being updated
      if (updatedData.name) {
        const exists = await checkCategoryExists(updatedData.name, id);
        if (exists) {
          return rejectWithValue("A category with this name already exists");
        }
      }
      
      const categoryRef = doc(db, "categories", id);
      await updateDoc(categoryRef, updatedData);
      return { id, updatedData };
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to update category");
    }
  }
);

export const deleteCategory = createAsyncThunk(
  "categories/deleteCategory",
  async (id: string, { rejectWithValue }) => {
    try {
      // Check if category has associated events
      const eventsRef = collection(db, "events");
      const q = query(eventsRef, where("category", "==", id));
      const querySnapshot = await getDocs(q);
      
      if (!querySnapshot.empty) {
        throw new Error('Cannot delete category as it has associated events');
      }
      
      await deleteDoc(doc(db, "categories", id));
      return id;
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

const categoriesSlice = createSlice({
  name: "categories",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      // Fetch Categories
      .addCase(fetchCategories.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchCategories.fulfilled, (state, action: PayloadAction<Category[]>) => {
        state.categories = action.payload;
        state.loading = false;
      })
      .addCase(fetchCategories.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      
      // Add Category
      .addCase(addCategory.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(addCategory.fulfilled, (state, action: PayloadAction<Category>) => {
        state.categories.push(action.payload);
        state.loading = false;
      })
      .addCase(addCategory.rejected, (state, action) => {
        state.error = action.payload as string;
        state.loading = false;
      })
      
      // Edit Category
      .addCase(editCategory.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(editCategory.fulfilled, (state, action: PayloadAction<{ id: string; updatedData: Partial<Category> }>) => {
        const index = state.categories.findIndex(
          (category) => category.id === action.payload.id
        );
        if (index !== -1) {
          state.categories[index] = {
            ...state.categories[index],
            ...action.payload.updatedData,
          };
        }
        state.loading = false;
      })
      .addCase(editCategory.rejected, (state, action) => {
        state.error = action.payload as string;
        state.loading = false;
      })
      
      // Delete Category
      .addCase(deleteCategory.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteCategory.fulfilled, (state, action: PayloadAction<string>) => {
        state.categories = state.categories.filter(cat => cat.id !== action.payload);
        state.loading = false;
      })
      .addCase(deleteCategory.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export default categoriesSlice.reducer;

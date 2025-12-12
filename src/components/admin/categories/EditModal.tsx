"use client";

import { useState, useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { FilePond } from "react-filepond";
import FilePondPluginImagePreview from "filepond-plugin-image-preview";
import { useDispatch, useSelector } from "react-redux";
import {  RootState } from "@/lib/features";
import { editCategory } from "@/lib/features/categorySlice";
import { AppDispatch } from "@/lib/features";
import { XMarkIcon } from "@heroicons/react/24/outline";
import { Category } from "@/types/category";

type FormData = {
  name: string;
  image?: File | string;
};

const categorySchema = z.object({
  name: z.string().min(2, { message: "Name is required" }),
  image: z.any().optional(),
});

interface EditCategoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  category: Category | null;
}

export default function EditModal({ isOpen, onClose, category: initialCategory }: EditCategoryModalProps) {
  const dispatch = useDispatch<AppDispatch>();
  const [category, setCategory] = useState<Category | null>(initialCategory);

  const {
    register,
    handleSubmit,
    control,
    reset,
    setError,
    clearErrors,
    formState: { errors },
    watch,
  } = useForm<FormData>({
    resolver: zodResolver(categorySchema),
    defaultValues: {
      name: initialCategory?.name || "",
      image: initialCategory?.image || "",
    },
  });

  const currentImage = watch("image");
const { error } = useSelector((state: RootState) => state.categories);

  useEffect(() => {
    if (initialCategory) {
      setCategory(initialCategory);
      reset({
        name: initialCategory.name || "",
        image: initialCategory.image || "",
      });
    }
  }, [initialCategory, reset]);

  const handleFormSubmit = async (data: FormData) => {
    if (!category?.id) return;
    
    try {
      clearErrors();
      const updateData: Partial<Category> = { name: data.name || '' };
      
      if (data.image && typeof data.image !== 'string') {
        const reader = new FileReader();
        
        reader.onloadend = async () => {
          try {
            const imageUrl = reader.result as string;
            const result = await dispatch(editCategory({ 
              id: category.id!, 
              updatedData: { 
                ...updateData, 
                image: imageUrl 
              } 
            }));
            
            if (editCategory.fulfilled.match(result)) {
              onClose();
            }
          } catch (error) {
            console.error('Error updating category with image:', error);
          }
        };
        
        reader.readAsDataURL(data.image);
      } else if (data.name !== category.name) {
        const result = await dispatch(editCategory({ 
          id: category.id, 
          updatedData: updateData 
        }));
        
        if (editCategory.fulfilled.match(result)) {
          onClose();
        }
      } else {
        onClose();
      }
    } catch (error) {
      console.error('Error processing form:', error);
    }
  };

  if (!isOpen || !category) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="relative w-full max-w-md rounded-lg bg-white p-6 shadow-xl dark:bg-slate-800">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 text-gray-400 hover:text-gray-500"
        >
          <XMarkIcon className="h-6 w-6" />
        </button>

        <h2 className="mb-6 text-2xl font-bold text-gray-900 dark:text-white">
          Edit Category
        </h2>

        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
          <div>
            <label
              htmlFor="name"
              className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300"
            >
              Category Name
            </label>
            <input
              type="text"
              id="name"
              {...register("name")}
              className={`block w-full rounded-lg border border-gray-300 bg-gray-50 p-2.5 text-sm text-gray-900 focus:border-blue-500 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder-gray-400 dark:focus:border-blue-500 dark:focus:ring-blue-500 ${
                errors.name ? "border-red-500" : ""
              }`}
              placeholder="Enter category name"
            />
            {errors.name && (
              <p className="mt-1 text-sm text-red-500">{errors.name.message}</p>
            )}
            {error && !errors.name && (
              <p className="mt-1 text-sm text-red-500">{error}</p>
            )}
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Category Image
            </label>
            <Controller
              name="image"
              control={control}
              render={({ field: { onChange } }) => (
                <FilePond
                  allowMultiple={false}
                  acceptedFileTypes={["image/*"]}
                  onupdatefiles={(fileItems) => {
                    const file = fileItems[0]?.file;
                    if (file) {
                      onChange(file);
                    }
                  }}
                  labelIdle='Drag & Drop your image or <span class="filepond--label-action">Browse</span>'
                />
              )}
            />
            {errors.image && (
              <p className="mt-1 text-sm text-red-500">
                {errors.image.message as string}
              </p>
            )}
            {!errors.image && currentImage && (
              <div className="mt-2">
                <p className="text-sm text-gray-500">
                  {typeof currentImage === 'string' ? 'Current Image:' : 'New Image Preview:'}
                </p>
                <img 
                  src={typeof currentImage === 'string' ? currentImage : URL.createObjectURL(currentImage)} 
                  alt={category?.name || 'Category image'} 
                  className="mt-1 h-20 w-20 object-cover rounded"
                />
              </div>
            )}
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              Save Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
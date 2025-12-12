"use client";

import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { FilePond, registerPlugin } from "react-filepond";
import FilePondPluginImagePreview from "filepond-plugin-image-preview";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "@/lib/features";
import { addCategory } from "@/lib/features/categorySlice";
import { AppDispatch } from "@/lib/features";
import { XMarkIcon } from "@heroicons/react/24/outline";

registerPlugin(FilePondPluginImagePreview);

type CategoryFormData = {
  name: string;
  image: File;
};

const categorySchema = z.object({
  name: z.string().min(2, { message: "Name is required" }),
  image: z.instanceof(File, { message: "Image is required" }),
});

interface AddCategoryModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function AddModal({ isOpen, onClose }: AddCategoryModalProps) {
  const dispatch = useDispatch<AppDispatch>();

  const {
    register,
    handleSubmit,
    control,
    reset,
    setError,
    clearErrors,
    formState: { errors },
  } = useForm<CategoryFormData>({
    resolver: zodResolver(categorySchema),
  });
  
  const { error } = useSelector((state: RootState) => state.categories);

  const handleFormSubmit = async (data: CategoryFormData) => {
    if (!data.image) return;
    
    try {
      clearErrors();
      const reader = new FileReader();
      
      reader.onloadend = async () => {
        try {
          const imageUrl = reader.result as string;
          const result = await dispatch(addCategory({ name: data.name, image: imageUrl }));
          
          if (addCategory.fulfilled.match(result)) {
            reset();
            onClose();
          }
        } catch (error) {
          console.error('Error adding category:', error);
        }
      };
      
      reader.readAsDataURL(data.image);
    } catch (error) {
      console.error('Error processing form:', error);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="relative w-full max-w-md rounded-lg bg-white p-6 shadow-lg dark:bg-neutral-900">
        <button
          className="absolute right-4 top-4 text-gray-500 hover:text-gray-800 dark:hover:text-white"
          onClick={onClose}
        >
          <XMarkIcon className="h-5 w-5" />
        </button>

        <h2 className="mb-4 text-2xl font-bold text-gray-900 dark:text-white">Add Category</h2>

        <form onSubmit={handleSubmit(handleFormSubmit)} className="flex flex-col gap-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-200">
              Name
            </label>
            <input
              type="text"
              {...register("name")}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:ring-1 focus:ring-primary dark:border-gray-700 dark:bg-neutral-800 dark:text-white"
            />
            {errors.name && (
              <p className="mt-1 text-sm text-red-500">{errors.name.message}</p>
            )}
            {error && !errors.name && (
              <p className="mt-1 text-sm text-red-500">{error}</p>
            )}
          </div>

          {/* FilePond Dropzone */}
          <Controller
            name="image"
            control={control}
            render={({ field: { onChange } }) => (
              <FilePond
                allowMultiple={false}
                onupdatefiles={(fileItems) => {
                  onChange(fileItems[0]?.file || null);
                }}
                labelIdle='Drag & Drop your image or <span class="filepond--label-action">Browse</span>'
                stylePanelLayout="compact circle"
              />
            )}
          />
          {errors.image && (
            <p className="mt-1 text-sm text-red-500">{errors.image.message}</p>
          )}

          {/* Buttons */}
          <div className="mt-4 flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 dark:border-gray-700 dark:text-gray-200 dark:hover:bg-neutral-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="rounded-lg bg-primary px-4 py-2 text-sm font-bold text-white hover:bg-blue-800"
            >
              Add
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

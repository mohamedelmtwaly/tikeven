import AdminLayoutWrapper from "@/components/admin/AdminLayoutWrapper";
import 'filepond/dist/filepond.min.css';
import 'filepond-plugin-image-preview/dist/filepond-plugin-image-preview.css';

export default function AdminLayoutClient({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AdminLayoutWrapper>
      {children}
    </AdminLayoutWrapper>
  );
}
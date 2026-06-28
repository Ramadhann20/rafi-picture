import AdminAuthCheck from "@/components/authentication/AdminAuthCheck";

import Sidebar from "@/components/admin/Sidebar";

function AdminProtectedLayout({ children }) {
  return (
    
    <div className="min-h-screen bg-surface font-body-md text-on-surface antialiased overflow-x-hidden">
      <Sidebar />

      <main className="min-h-screen md:pl-64">
        <div className="px-6 py-8 md:px-8 md:py-10">{children}</div>
      </main>
    </div>
  );
}

export default function AdminLayout({ children }) {
  return (
    <AdminAuthCheck>
      <AdminProtectedLayout>{children}</AdminProtectedLayout>
    </AdminAuthCheck>
  );
}
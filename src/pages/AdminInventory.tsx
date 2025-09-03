import { BookHiveLayout } from "@/components/BookHiveLayout";
import { AdminBookManagement } from "@/components/AdminBookManagement";
import { ClientDashboard } from "@/components/ClientDashboard";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Package, Users } from "lucide-react";

const AdminInventory = () => {
  return (
    <BookHiveLayout>
      <div className="container mx-auto px-6 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Inventory Management</h1>
          <p className="text-muted-foreground">
            Manage your library's book collection and client records
          </p>
        </div>

        {/* Main Content */}
        <Tabs defaultValue="books" className="space-y-8">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="books" className="flex items-center gap-2">
              <Package className="w-4 h-4" />
              Book Management
            </TabsTrigger>
            <TabsTrigger value="clients" className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              Client Records
            </TabsTrigger>
          </TabsList>

          <TabsContent value="books">
            <AdminBookManagement />
          </TabsContent>

          <TabsContent value="clients">
            <ClientDashboard />
          </TabsContent>
        </Tabs>
      </div>
    </BookHiveLayout>
  );
};

export default AdminInventory;
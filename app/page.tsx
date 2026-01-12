"use client"

import { useState } from "react"
import { ClientList } from "@/components/client-list"
import { ClientProfile } from "@/components/client-profile"
import { AddClientModal } from "@/components/add-client-modal"
import { ProductManagerModal } from "@/components/product-manager-modal"
import type { Client, Product } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { Plus, Settings, Moon, Sun, Loader2 } from "lucide-react"
import { useTheme } from "next-themes"
import { useClients } from "@/hooks/use-clients"
import { useProducts } from "@/hooks/use-products"
import { useTeamMembers } from "@/hooks/use-team-members"

export default function ClientDashboard() {
  const [selectedClient, setSelectedClient] = useState<Client | null>(null)
  const [selectedProducts, setSelectedProducts] = useState<Product[]>([])
  const [isAddClientOpen, setIsAddClientOpen] = useState(false)
  const [isProductManagerOpen, setIsProductManagerOpen] = useState(false)
  const { theme, setTheme } = useTheme()

  // Fetch data from Supabase
  const { clients, loading: clientsLoading, addClient, updateClient, deleteClient } = useClients()
  const { products, productConfigs, loading: productsLoading, addProduct, updateProductColors, deleteProduct } =
    useProducts()
  const { teamMembers, loading: teamMembersLoading } = useTeamMembers()

  const loading = clientsLoading || productsLoading || teamMembersLoading

  const handleClientUpdate = async (updatedClient: Client) => {
    await updateClient(updatedClient)
    setSelectedClient(updatedClient)
  }

  const handleAddClient = async (newClient: Client) => {
    await addClient(newClient)
    setIsAddClientOpen(false)
  }

  const handleDeleteClient = async (clientId: string) => {
    await deleteClient(clientId)
    if (selectedClient?.id === clientId) {
      setSelectedClient(null)
    }
  }

  return (
    <div className="flex flex-col h-screen bg-background">
      <header className="border-b border-border bg-card px-6 py-3">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold text-foreground">Appworks Client Dashboard</h1>

          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => (window.location.href = "/settings")}>
              <Settings className="h-4 w-4 mr-2" />
              Settings
            </Button>
            <Button variant="outline" size="sm" onClick={() => setIsProductManagerOpen(true)}>
              <Settings className="h-4 w-4 mr-2" />
              Manage Products
            </Button>
            <Button variant="default" size="sm" onClick={() => setIsAddClientOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Client
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              className="ml-2"
            >
              {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </Button>
          </div>
        </div>
      </header>

      {loading ? (
        <div className="flex flex-1 items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          <span className="ml-3 text-muted-foreground">Loading data from Supabase...</span>
        </div>
      ) : (
        <div className="flex flex-1 overflow-hidden">
          <ClientList
            clients={clients}
            selectedClient={selectedClient}
            onSelectClient={setSelectedClient}
            productFilter={selectedProducts}
            onProductFilterChange={setSelectedProducts}
            productConfigs={productConfigs}
          />
          <main className="flex-1 overflow-auto">
            {selectedClient ? (
              <ClientProfile
                client={selectedClient}
                onUpdate={handleClientUpdate}
                onDelete={handleDeleteClient}
                teamMembers={teamMembers}
                availableProducts={products}
                productConfigs={productConfigs}
              />
            ) : (
              <div className="flex h-full items-center justify-center">
                <div className="text-center">
                  <h2 className="text-2xl font-semibold text-foreground">Select a client</h2>
                  <p className="mt-2 text-muted-foreground">Choose a client from the list to view their details</p>
                </div>
              </div>
            )}
          </main>
        </div>
      )}

      <AddClientModal
        open={isAddClientOpen}
        onOpenChange={setIsAddClientOpen}
        onAddClient={handleAddClient}
        availableProducts={products}
      />
      <ProductManagerModal
        open={isProductManagerOpen}
        onOpenChange={setIsProductManagerOpen}
        productConfigs={productConfigs}
        onAddProduct={addProduct}
        onDeleteProduct={deleteProduct}
        onUpdateColors={updateProductColors}
      />
    </div>
  )
}

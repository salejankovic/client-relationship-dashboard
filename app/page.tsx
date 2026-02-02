"use client"

import { useState } from "react"
import { MainNav } from "@/components/main-nav"
import { ClientList } from "@/components/client-list"
import { ClientProfile } from "@/components/client-profile"
import { AddClientModal } from "@/components/add-client-modal"
import { ProductManagerModal } from "@/components/product-manager-modal"
import { TaskBoard } from "@/components/task-board"
import type { Client, Product } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { Plus, Settings, Loader2, ListTodo, Users } from "lucide-react"
import { useClients } from "@/hooks/use-clients"
import { useProducts } from "@/hooks/use-products"
import { useTeamMembers } from "@/hooks/use-team-members"
import { cn } from "@/lib/utils"

export default function ClientDashboard() {
  const [selectedClient, setSelectedClient] = useState<Client | null>(null)
  const [selectedProducts, setSelectedProducts] = useState<Product[]>([])
  const [isAddClientOpen, setIsAddClientOpen] = useState(false)
  const [isProductManagerOpen, setIsProductManagerOpen] = useState(false)
  const [activeView, setActiveView] = useState<"clients" | "tasks">("clients")

  // Fetch data from Supabase
  const { clients, loading: clientsLoading, addClient, updateClient, deleteClient } = useClients()
  const { products, productConfigs, loading: productsLoading, addProduct, updateProductColors, updateProductName, deleteProduct } =
    useProducts()
  const { teamMembers, loading: teamMembersLoading } = useTeamMembers()

  const loading = clientsLoading || productsLoading || teamMembersLoading

  const handleClientUpdate = async (updatedClient: Client) => {
    await updateClient(updatedClient)
    setSelectedClient(updatedClient)
  }

  const handleAddClient = async (newClient: Client) => {
    try {
      console.log('handleAddClient called with:', newClient)
      await addClient(newClient)
      console.log('Client added successfully to database')
      // Don't close modal here - let AddClientModal handle it
    } catch (error) {
      console.error('Error in handleAddClient:', error)
      throw error // Re-throw so AddClientModal can catch it
    }
  }

  const handleDeleteClient = async (clientId: string) => {
    await deleteClient(clientId)
    if (selectedClient?.id === clientId) {
      setSelectedClient(null)
    }
  }

  return (
    <div className="flex flex-col h-screen bg-background">
      <MainNav />
      <div className="flex items-center justify-between border-b border-border bg-card px-6 py-3 mt-16">
        <div className="flex items-center gap-4">
          {/* View Toggle Tabs */}
          <div className="flex items-center bg-muted rounded-lg p-1">
            <button
              onClick={() => setActiveView("clients")}
              className={cn(
                "flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-colors",
                activeView === "clients"
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Users className="h-4 w-4" />
              Client Management
            </button>
            <button
              onClick={() => setActiveView("tasks")}
              className={cn(
                "flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-colors",
                activeView === "tasks"
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <ListTodo className="h-4 w-4" />
              Task Board
            </button>
          </div>
        </div>
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
        </div>
      </div>

      {loading ? (
        <div className="flex flex-1 items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          <span className="ml-3 text-muted-foreground">Loading data from Supabase...</span>
        </div>
      ) : activeView === "tasks" ? (
        <div className="flex flex-1 overflow-hidden">
          <div className="w-96 border-r border-border">
            <TaskBoard clients={clients} onUpdateClient={handleClientUpdate} onSelectClient={setSelectedClient} />
          </div>
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
                  <ListTodo className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h2 className="text-2xl font-semibold text-foreground">Task Board</h2>
                  <p className="mt-2 text-muted-foreground">Complete tasks and manage your to-dos across all clients</p>
                </div>
              </div>
            )}
          </main>
        </div>
      ) : (
        <div className="flex flex-1 overflow-hidden">
          <ClientList
            clients={clients}
            selectedClient={selectedClient}
            onSelectClient={setSelectedClient}
            productFilter={selectedProducts}
            onProductFilterChange={setSelectedProducts}
            teamMembers={teamMembers}
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
        teamMembers={teamMembers}
      />
      <ProductManagerModal
        open={isProductManagerOpen}
        onOpenChange={setIsProductManagerOpen}
        productConfigs={productConfigs}
        onAddProduct={addProduct}
        onDeleteProduct={deleteProduct}
        onUpdateColors={updateProductColors}
        onUpdateName={updateProductName}
      />
    </div>
  )
}

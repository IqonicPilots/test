"use client"

import { DataTable } from "./data-table"
import {
  useAllListings,
  useDeleteListing,
  useToggleListingStatus,
} from "@/hooks/api/use-listings"

export function ListingsContent() {
  const { data: listings = [], isLoading } = useAllListings()
  const deleteListingMutation = useDeleteListing()
  const toggleStatusMutation = useToggleListingStatus()

  const handleDeleteListing = (id: string) => {
    deleteListingMutation.mutate(id)
  }

  const handleToggleStatus = (id: string) => {
    const listing = listings.find((l) => l._id === id)
    if (!listing) return
    toggleStatusMutation.mutate({ id, isActive: !listing.isActive })
  }

  return (
    <div className="flex h-full min-w-0 max-w-full flex-1 flex-col space-y-6">
      <DataTable
        listings={listings}
        onDeleteListing={handleDeleteListing}
        onToggleStatus={handleToggleStatus}
        isLoading={isLoading && !listings.length}
        isDeleting={deleteListingMutation.isPending}
      />
    </div>
  )
}

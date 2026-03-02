"use client"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { sdk } from "@/lib/medusa-sdk"
import type { ResellerType } from "@/types/reseller"

// ============================================================
// TYPES
// ============================================================

interface MedusaCustomerGroup {
  id: string
  name: string
  metadata?: Record<string, string>
}

interface MedusaPromotion {
  id: string
  code: string
  type: string
  is_automatic: boolean
  status: string
  application_method?: {
    type: string
    target_type: string
    value: number
    currency_code: string
  }
  rules?: Array<{
    attribute: string
    operator: string
    values: string[]
  }>
}

export interface SyncStatus {
  resellerType: ResellerType
  customerGroup: MedusaCustomerGroup | null
  promotion: MedusaPromotion | null
  synced: boolean
}

// ============================================================
// QUERIES
// ============================================================

export function useMedusaCustomerGroups() {
  return useQuery({
    queryKey: ["medusa", "customer-groups"],
    queryFn: async () => {
      const response = (await sdk.client.fetch("/admin/customer-groups", {
        query: { limit: 100 },
      })) as { customer_groups: MedusaCustomerGroup[] }
      return response.customer_groups ?? []
    },
  })
}

export function useMedusaPromotions() {
  return useQuery({
    queryKey: ["medusa", "promotions"],
    queryFn: async () => {
      const response = (await sdk.client.fetch("/admin/promotions", {
        query: { limit: 100 },
      })) as { promotions: MedusaPromotion[] }
      return response.promotions ?? []
    },
  })
}

// ============================================================
// SYNC STATUS
// ============================================================

/** Compute sync status for each reseller type */
export function computeSyncStatus(
  resellerTypes: ResellerType[],
  customerGroups: MedusaCustomerGroup[],
  promotions: MedusaPromotion[]
): SyncStatus[] {
  return resellerTypes.map((rt) => {
    const groupName = `reseller-${rt.name}`
    const promoCode = `RESELLER-${rt.name.toUpperCase()}`

    const customerGroup = customerGroups.find((g) => g.name === groupName) ?? null
    const promotion = promotions.find((p) => p.code === promoCode) ?? null

    return {
      resellerType: rt,
      customerGroup,
      promotion,
      synced: !!customerGroup && !!promotion,
    }
  })
}

// ============================================================
// SYNC MUTATION
// ============================================================

export function useSyncResellerTypeToMedusa() {
  const qc = useQueryClient()

  return useMutation({
    mutationFn: async ({
      resellerType,
      existingGroup,
      existingPromotion,
    }: {
      resellerType: ResellerType
      existingGroup: MedusaCustomerGroup | null
      existingPromotion: MedusaPromotion | null
    }) => {
      const groupName = `reseller-${resellerType.name}`
      const promoCode = `RESELLER-${resellerType.name.toUpperCase()}`
      const discountPct = resellerType.default_customer_discount_percentage

      // 1. Create customer group if it doesn't exist
      let group = existingGroup
      if (!group) {
        const created = (await sdk.client.fetch("/admin/customer-groups", {
          method: "POST",
          body: {
            name: groupName,
            metadata: {
              reseller_type_id: resellerType.id,
              reseller_type_name: resellerType.display_name,
            },
          },
        })) as { customer_group: MedusaCustomerGroup }
        group = created.customer_group
      }

      // 2. Create or update promotion
      let promotion = existingPromotion
      if (!promotion && discountPct > 0) {
        const created = (await sdk.client.fetch("/admin/promotions", {
          method: "POST",
          body: {
            code: promoCode,
            type: "standard",
            is_automatic: true,
            status: "active",
            application_method: {
              type: "percentage",
              target_type: "order",
              value: discountPct,
              currency_code: "ars",
            },
            rules: [
              {
                attribute: "customer.group.id",
                operator: "in",
                values: [group.id],
              },
            ],
          },
        })) as { promotion: MedusaPromotion }
        promotion = created.promotion
      } else if (promotion) {
        // Update status based on discount percentage
        await sdk.client.fetch(`/admin/promotions/${promotion.id}`, {
          method: "POST",
          body: {
            status: discountPct > 0 ? "active" : "draft",
          },
        })
      }

      return { group, promotion }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["medusa", "customer-groups"] })
      qc.invalidateQueries({ queryKey: ["medusa", "promotions"] })
    },
  })
}

// Sync ALL reseller types at once
export function useSyncAllResellerTypes() {
  const qc = useQueryClient()

  return useMutation({
    mutationFn: async ({
      statuses,
    }: {
      statuses: SyncStatus[]
    }) => {
      const results = []

      for (const status of statuses) {
        const { resellerType } = status
        const groupName = `reseller-${resellerType.name}`
        const promoCode = `RESELLER-${resellerType.name.toUpperCase()}`
        const discountPct = resellerType.default_customer_discount_percentage

        // 1. Customer group
        let group = status.customerGroup
        if (!group) {
          const created = (await sdk.client.fetch("/admin/customer-groups", {
            method: "POST",
            body: {
              name: groupName,
              metadata: {
                reseller_type_id: resellerType.id,
                reseller_type_name: resellerType.display_name,
              },
            },
          })) as { customer_group: MedusaCustomerGroup }
          group = created.customer_group
        }

        // 2. Promotion
        let promotion = status.promotion
        if (!promotion && discountPct > 0) {
          const created = (await sdk.client.fetch("/admin/promotions", {
            method: "POST",
            body: {
              code: promoCode,
              type: "standard",
              is_automatic: true,
              status: "active",
              application_method: {
                type: "percentage",
                target_type: "order",
                value: discountPct,
                currency_code: "ars",
              },
              rules: [
                {
                  attribute: "customer.group.id",
                  operator: "in",
                  values: [group.id],
                },
              ],
            },
          })) as { promotion: MedusaPromotion }
          promotion = created.promotion
        } else if (promotion) {
          await sdk.client.fetch(`/admin/promotions/${promotion.id}`, {
            method: "POST",
            body: {
              status: discountPct > 0 ? "active" : "draft",
            },
          })
        }

        results.push({ type: resellerType.display_name, group, promotion })
      }

      return results
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["medusa", "customer-groups"] })
      qc.invalidateQueries({ queryKey: ["medusa", "promotions"] })
    },
  })
}

// Add a customer to a Medusa customer group
export function useAddCustomerToGroup() {
  const qc = useQueryClient()

  return useMutation({
    mutationFn: async ({
      groupId,
      customerId,
    }: {
      groupId: string
      customerId: string
    }) => {
      await sdk.client.fetch(`/admin/customer-groups/${groupId}/customers`, {
        method: "POST",
        body: {
          add: [customerId],
        },
      })
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["medusa", "customer-groups"] })
    },
  })
}

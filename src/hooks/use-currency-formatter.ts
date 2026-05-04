"use client"

import { useCallback } from "react"

import { useSystemConfig } from "@/hooks/api/use-system-config"

export function useCurrencyFormatter(enabled = true) {
  const { data } = useSystemConfig(enabled)
  const currencyPrefix = data?.currency_prefix ?? "$"
  const currencyPostfix = data?.currency_postfix ?? ""

  const formatCurrency = useCallback(
    (value: number, options?: { decimals?: number; hidePostfix?: boolean }) => {
      const decimals = options?.decimals ?? 2
      const postfix = options?.hidePostfix ? "" : currencyPostfix
      return `${currencyPrefix}${Number(value || 0).toFixed(decimals)}${postfix}`
    },
    [currencyPrefix, currencyPostfix]
  )

  const formatCurrencyCompact = useCallback(
    (value: number) => `${currencyPrefix}${Number(value || 0).toLocaleString()}${currencyPostfix}`,
    [currencyPrefix, currencyPostfix]
  )

  return { currencyPrefix, currencyPostfix, formatCurrency, formatCurrencyCompact }
}


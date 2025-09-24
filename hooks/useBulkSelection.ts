'use client'

import { useState, useCallback, useMemo } from 'react'

interface UseBulkSelectionOptions<T> {
  items: T[]
  keyField?: keyof T
}

export function useBulkSelection<T>({ 
  items, 
  keyField = 'id' as keyof T 
}: UseBulkSelectionOptions<T>) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())

  // アイテムのIDを取得
  const getItemId = useCallback((item: T): string => {
    const id = item[keyField]
    return String(id)
  }, [keyField])

  // 選択状態をトグル
  const toggleSelection = useCallback((item: T) => {
    const id = getItemId(item)
    setSelectedIds(prev => {
      const newSet = new Set(prev)
      if (newSet.has(id)) {
        newSet.delete(id)
      } else {
        newSet.add(id)
      }
      return newSet
    })
  }, [getItemId])

  // すべて選択
  const selectAll = useCallback(() => {
    const allIds = new Set(items.map(item => getItemId(item)))
    setSelectedIds(allIds)
  }, [items, getItemId])

  // すべて選択解除
  const deselectAll = useCallback(() => {
    setSelectedIds(new Set())
  }, [])

  // 選択状態をトグル（すべて選択/解除）
  const toggleAll = useCallback(() => {
    if (selectedIds.size === items.length) {
      deselectAll()
    } else {
      selectAll()
    }
  }, [selectedIds.size, items.length, selectAll, deselectAll])

  // 特定のアイテムが選択されているか
  const isSelected = useCallback((item: T): boolean => {
    const id = getItemId(item)
    return selectedIds.has(id)
  }, [selectedIds, getItemId])

  // 選択されたアイテムのリスト
  const selectedItems = useMemo(() => {
    return items.filter(item => isSelected(item))
  }, [items, isSelected])

  // 選択されたIDの配列
  const selectedIdArray = useMemo(() => {
    return Array.from(selectedIds)
  }, [selectedIds])

  // 選択状態のリセット
  const resetSelection = useCallback(() => {
    setSelectedIds(new Set())
  }, [])

  // 条件に基づいて選択
  const selectByCondition = useCallback((predicate: (item: T) => boolean) => {
    const matchingIds = items
      .filter(predicate)
      .map(item => getItemId(item))
    setSelectedIds(new Set(matchingIds))
  }, [items, getItemId])

  // 選択を反転
  const invertSelection = useCallback(() => {
    const allIds = items.map(item => getItemId(item))
    const newSet = new Set<string>()
    
    allIds.forEach(id => {
      if (!selectedIds.has(id)) {
        newSet.add(id)
      }
    })
    
    setSelectedIds(newSet)
  }, [items, selectedIds, getItemId])

  return {
    // 状態
    selectedIds: selectedIdArray,
    selectedItems,
    selectedCount: selectedIds.size,
    isAllSelected: selectedIds.size === items.length && items.length > 0,
    isPartiallySelected: selectedIds.size > 0 && selectedIds.size < items.length,
    hasSelection: selectedIds.size > 0,

    // アクション
    toggleSelection,
    selectAll,
    deselectAll,
    toggleAll,
    isSelected,
    resetSelection,
    selectByCondition,
    invertSelection,

    // ヘルパー
    getCheckboxProps: (item: T) => ({
      checked: isSelected(item),
      onChange: () => toggleSelection(item)
    }),
    getAllCheckboxProps: () => ({
      checked: selectedIds.size === items.length && items.length > 0,
      indeterminate: selectedIds.size > 0 && selectedIds.size < items.length,
      onChange: toggleAll
    })
  }
}

// 永続化機能付きバージョン
export function usePersistentBulkSelection<T>({ 
  items, 
  keyField = 'id' as keyof T,
  storageKey
}: UseBulkSelectionOptions<T> & { storageKey: string }) {
  const getStoredSelection = useCallback((): Set<string> => {
    if (typeof window === 'undefined') return new Set()
    
    try {
      const stored = localStorage.getItem(storageKey)
      if (stored) {
        const ids = JSON.parse(stored)
        return new Set(ids)
      }
    } catch (error) {
      console.error('Failed to load selection from storage:', error)
    }
    
    return new Set()
  }, [storageKey])

  const [selectedIds, setSelectedIds] = useState<Set<string>>(getStoredSelection)

  const updateSelection = useCallback((newSelection: Set<string>) => {
    setSelectedIds(newSelection)
    
    try {
      localStorage.setItem(storageKey, JSON.stringify(Array.from(newSelection)))
    } catch (error) {
      console.error('Failed to save selection to storage:', error)
    }
  }, [storageKey])

  // 基本のフックを使用して、setSelectedIdsをオーバーライド
  const baseSelection = useBulkSelection({ items, keyField })

  return {
    ...baseSelection,
    toggleSelection: (item: T) => {
      const id = String(item[keyField])
      const newSet = new Set(selectedIds)
      
      if (newSet.has(id)) {
        newSet.delete(id)
      } else {
        newSet.add(id)
      }
      
      updateSelection(newSet)
    },
    selectAll: () => {
      const allIds = new Set(items.map(item => String(item[keyField])))
      updateSelection(allIds)
    },
    deselectAll: () => {
      updateSelection(new Set())
    },
    resetSelection: () => {
      updateSelection(new Set())
      localStorage.removeItem(storageKey)
    }
  }
}


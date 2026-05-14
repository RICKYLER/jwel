import { useState } from 'react'

export function useSidebarLogic(
  onSectionChange
) {
  const [expandedItem, setExpandedItem] =
    useState(null)

  const handleItemClick = (item) => {
    const hasSubitems =
      item.subitems &&
      item.subitems.length > 0

    if (hasSubitems) {
      setExpandedItem((prev) =>
        prev === item.id ? null : item.id
      )
    } else {
      onSectionChange(item.id)
    }
  }

  return {
    expandedItem,
    handleItemClick,
  }
}
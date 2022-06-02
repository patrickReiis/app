import { FOCUSABLE_BUT_NOT_TABBABLE } from '@/Constants/Constants'
import { FunctionComponent } from 'react'

type HistoryListItemProps = {
  isSelected: boolean
  onClick: () => void
}

const HistoryListItem: FunctionComponent<HistoryListItemProps> = ({ children, isSelected, onClick }) => {
  return (
    <button
      tabIndex={FOCUSABLE_BUT_NOT_TABBABLE}
      className={`sn-dropdown-item py-2.5 focus:bg-contrast focus:shadow-none ${isSelected ? 'bg-info-backdrop' : ''}`}
      onClick={onClick}
      data-selected={isSelected}
    >
      <div className={`pseudo-radio-btn ${isSelected ? 'pseudo-radio-btn--checked' : ''} mr-2`}></div>
      {children}
    </button>
  )
}

export default HistoryListItem

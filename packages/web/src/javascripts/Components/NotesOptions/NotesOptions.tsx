import Icon from '@/Components/Icon/Icon'
import Switch from '@/Components/Switch/Switch'
import { observer } from 'mobx-react-lite'
import { useState, useEffect, useMemo, useCallback } from 'react'
import { NoteType, Platform, SNNote } from '@standardnotes/snjs'
import {
  OPEN_NOTE_HISTORY_COMMAND,
  PIN_NOTE_COMMAND,
  SHOW_HIDDEN_OPTIONS_KEYBOARD_COMMAND,
  STAR_NOTE_COMMAND,
  SUPER_SHOW_MARKDOWN_PREVIEW,
} from '@standardnotes/ui-services'
import ChangeEditorOption from './ChangeEditorOption'
import ListedActionsOption from './Listed/ListedActionsOption'
import AddTagOption from './AddTagOption'
import { addToast, dismissToast, ToastType } from '@standardnotes/toast'
import { NotesOptionsProps } from './NotesOptionsProps'
import HorizontalSeparator from '../Shared/HorizontalSeparator'
import { useResponsiveAppPane } from '../ResponsivePane/ResponsivePaneProvider'
import { AppPaneId } from '../ResponsivePane/AppPaneMetadata'
import { getNoteBlob, getNoteFileName } from '@/Utils/NoteExportUtils'
import { shareSelectedNotes } from '@/NativeMobileWeb/ShareSelectedNotes'
import { downloadSelectedNotesOnAndroid } from '@/NativeMobileWeb/DownloadSelectedNotesOnAndroid'
import ProtectedUnauthorizedLabel from '../ProtectedItemOverlay/ProtectedUnauthorizedLabel'
import { classNames } from '@standardnotes/utils'
import { MenuItemIconSize } from '@/Constants/TailwindClassNames'
import { KeyboardShortcutIndicator } from '../KeyboardShortcutIndicator/KeyboardShortcutIndicator'
import { NoteAttributes } from './NoteAttributes'
import { SpellcheckOptions } from './SpellcheckOptions'
import { NoteSizeWarning } from './NoteSizeWarning'
import { DeletePermanentlyButton } from './DeletePermanentlyButton'
import { useCommandService } from '../ApplicationView/CommandProvider'

const iconSize = MenuItemIconSize
export const iconClass = `text-neutral mr-2 ${iconSize}`
const iconClassDanger = `text-danger mr-2 ${iconSize}`
const iconClassWarning = `text-warning mr-2 ${iconSize}`
const iconClassSuccess = `text-success mr-2 ${iconSize}`

const NotesOptions = ({
  application,
  navigationController,
  notesController,
  historyModalController,
  closeMenu,
}: NotesOptionsProps) => {
  const [altKeyDown, setAltKeyDown] = useState(false)
  const { toggleAppPane } = useResponsiveAppPane()
  const commandService = useCommandService()

  const markdownShortcut = useMemo(
    () => commandService.keyboardShortcutForCommand(SUPER_SHOW_MARKDOWN_PREVIEW),
    [commandService],
  )

  const toggleOn = (condition: (note: SNNote) => boolean) => {
    const notesMatchingAttribute = notes.filter(condition)
    const notesNotMatchingAttribute = notes.filter((note) => !condition(note))
    return notesMatchingAttribute.length > notesNotMatchingAttribute.length
  }

  const notes = notesController.selectedNotes
  const hidePreviews = toggleOn((note) => note.hidePreview)
  const locked = toggleOn((note) => note.locked)
  const protect = toggleOn((note) => note.protected)
  const archived = notes.some((note) => note.archived)
  const unarchived = notes.some((note) => !note.archived)
  const trashed = notes.some((note) => note.trashed)
  const notTrashed = notes.some((note) => !note.trashed)
  const pinned = notes.some((note) => note.pinned)
  const unpinned = notes.some((note) => !note.pinned)
  const starred = notes.some((note) => note.starred)

  const editorForNote = useMemo(
    () => (notes[0] ? application.componentManager.editorForNote(notes[0]) : undefined),
    [application.componentManager, notes],
  )

  useEffect(() => {
    const removeAltKeyObserver = application.keyboardService.addCommandHandler({
      command: SHOW_HIDDEN_OPTIONS_KEYBOARD_COMMAND,
      onKeyDown: () => {
        setAltKeyDown(true)
      },
      onKeyUp: () => {
        setAltKeyDown(false)
      },
    })

    return () => {
      removeAltKeyObserver()
    }
  }, [application])

  const downloadSelectedItems = useCallback(async () => {
    if (notes.length === 1) {
      const note = notes[0]
      const blob = getNoteBlob(application, note)
      application.getArchiveService().downloadData(blob, getNoteFileName(application, note))
      return
    }

    if (notes.length > 1) {
      const loadingToastId = addToast({
        type: ToastType.Loading,
        message: `Exporting ${notes.length} notes...`,
      })
      await application.getArchiveService().downloadDataAsZip(
        notes.map((note) => {
          return {
            name: getNoteFileName(application, note),
            content: getNoteBlob(application, note),
          }
        }),
      )
      dismissToast(loadingToastId)
      addToast({
        type: ToastType.Success,
        message: `Exported ${notes.length} notes`,
      })
    }
  }, [application, notes])

  const closeMenuAndToggleNotesList = useCallback(() => {
    toggleAppPane(AppPaneId.Items)
    closeMenu()
  }, [closeMenu, toggleAppPane])

  const duplicateSelectedItems = useCallback(async () => {
    await Promise.all(notes.map((note) => application.mutator.duplicateItem(note).catch(console.error)))
    closeMenuAndToggleNotesList()
  }, [application.mutator, closeMenuAndToggleNotesList, notes])

  const openRevisionHistoryModal = useCallback(() => {
    historyModalController.openModal(notesController.firstSelectedNote)
  }, [historyModalController, notesController.firstSelectedNote])

  const historyShortcut = useMemo(
    () => application.keyboardService.keyboardShortcutForCommand(OPEN_NOTE_HISTORY_COMMAND),
    [application],
  )

  const pinShortcut = useMemo(
    () => application.keyboardService.keyboardShortcutForCommand(PIN_NOTE_COMMAND),
    [application],
  )

  const starShortcut = useMemo(
    () => application.keyboardService.keyboardShortcutForCommand(STAR_NOTE_COMMAND),
    [application],
  )

  const enableSuperMarkdownPreview = useCallback(() => {
    commandService.triggerCommand(SUPER_SHOW_MARKDOWN_PREVIEW)
  }, [commandService])

  const unauthorized = notes.some((note) => !application.isAuthorizedToRenderItem(note))
  if (unauthorized) {
    return <ProtectedUnauthorizedLabel />
  }

  const textClassNames = 'text-mobile-menu-item md:text-tablet-menu-item lg:text-menu-item'

  const defaultClassNames = classNames(
    textClassNames,
    'flex w-full cursor-pointer items-center border-0 bg-transparent px-3 py-1.5 text-left text-text hover:bg-contrast hover:text-foreground focus:bg-info-backdrop focus:shadow-none',
  )

  const switchClassNames = classNames(textClassNames, defaultClassNames, 'justify-between')

  const firstItemClass = 'pt-4'

  return (
    <>
      {notes.length === 1 && (
        <>
          <button className={classNames(defaultClassNames, firstItemClass)} onClick={openRevisionHistoryModal}>
            <div className="flex w-full items-center justify-between">
              <span className="flex">
                <Icon type="history" className={iconClass} />
                Note history
              </span>
              {historyShortcut && <KeyboardShortcutIndicator className={''} shortcut={historyShortcut} />}
            </div>
          </button>
          <HorizontalSeparator classes="my-2" />
        </>
      )}
      <button
        className={switchClassNames}
        onClick={() => {
          notesController.setLockSelectedNotes(!locked)
        }}
      >
        <span className="flex items-center">
          <Icon type="pencil-off" className={iconClass} />
          Prevent editing
        </span>
        <Switch className="px-0" checked={locked} />
      </button>
      <button
        className={switchClassNames}
        onClick={() => {
          notesController.setHideSelectedNotePreviews(!hidePreviews)
        }}
      >
        <span className="flex items-center">
          <Icon type="rich-text" className={iconClass} />
          Show preview
        </span>
        <Switch className="px-0" checked={!hidePreviews} />
      </button>
      <button
        className={switchClassNames}
        onClick={() => {
          notesController.setProtectSelectedNotes(!protect).catch(console.error)
        }}
      >
        <span className="flex items-center">
          <Icon type="lock" className={iconClass} />
          Password protect
        </span>
        <Switch className="px-0" checked={protect} />
      </button>
      {notes.length === 1 && (
        <>
          <HorizontalSeparator classes="my-2" />
          <ChangeEditorOption
            iconClassName={iconClass}
            className={switchClassNames}
            application={application}
            note={notes[0]}
          />
        </>
      )}
      <HorizontalSeparator classes="my-2" />
      {navigationController.tagsCount > 0 && (
        <AddTagOption
          iconClassName={iconClass}
          className={switchClassNames}
          navigationController={navigationController}
          notesController={notesController}
        />
      )}

      <button
        className={defaultClassNames}
        onClick={() => {
          notesController.setStarSelectedNotes(!starred)
        }}
      >
        <div className="flex w-full items-center justify-between">
          <span className="flex">
            <Icon type="star" className={iconClass} />
            {starred ? 'Unstar' : 'Star'}
          </span>
          {starShortcut && <KeyboardShortcutIndicator className={''} shortcut={starShortcut} />}
        </div>
      </button>

      {unpinned && (
        <button
          className={defaultClassNames}
          onClick={() => {
            notesController.setPinSelectedNotes(true)
          }}
        >
          <div className="flex w-full items-center justify-between">
            <span className="flex">
              <Icon type="pin" className={iconClass} />
              Pin to top
            </span>
            {pinShortcut && <KeyboardShortcutIndicator className={''} shortcut={pinShortcut} />}
          </div>
        </button>
      )}
      {pinned && (
        <button
          className={defaultClassNames}
          onClick={() => {
            notesController.setPinSelectedNotes(false)
          }}
        >
          <div className="flex w-full items-center justify-between">
            <span className="flex">
              <Icon type="unpin" className={iconClass} />
              Unpin
            </span>
            {pinShortcut && <KeyboardShortcutIndicator className={''} shortcut={pinShortcut} />}
          </div>
        </button>
      )}
      <button
        className={defaultClassNames}
        onClick={() => {
          application.isNativeMobileWeb() ? void shareSelectedNotes(application, notes) : void downloadSelectedItems()
        }}
      >
        <Icon type={application.platform === Platform.Android ? 'share' : 'download'} className={iconClass} />
        {application.platform === Platform.Android ? 'Share' : 'Export'}
      </button>
      {application.platform === Platform.Android && (
        <button className={defaultClassNames} onClick={() => downloadSelectedNotesOnAndroid(application, notes)}>
          <Icon type="download" className={iconClass} />
          Export
        </button>
      )}
      <button className={defaultClassNames} onClick={duplicateSelectedItems}>
        <Icon type="copy" className={iconClass} />
        Duplicate
      </button>
      {unarchived && (
        <button
          className={defaultClassNames}
          onClick={async () => {
            await notesController.setArchiveSelectedNotes(true).catch(console.error)
            closeMenuAndToggleNotesList()
          }}
        >
          <Icon type="archive" className={iconClassWarning} />
          <span className="text-warning">Archive</span>
        </button>
      )}
      {archived && (
        <button
          className={defaultClassNames}
          onClick={async () => {
            await notesController.setArchiveSelectedNotes(false).catch(console.error)
            closeMenuAndToggleNotesList()
          }}
        >
          <Icon type="unarchive" className={iconClassWarning} />
          <span className="text-warning">Unarchive</span>
        </button>
      )}
      {notTrashed &&
        (altKeyDown ? (
          <DeletePermanentlyButton
            onClick={async () => {
              await notesController.deleteNotesPermanently()
              closeMenuAndToggleNotesList()
            }}
          />
        ) : (
          <button
            className={defaultClassNames}
            onClick={async () => {
              await notesController.setTrashSelectedNotes(true)
              closeMenuAndToggleNotesList()
            }}
          >
            <Icon type="trash" className={iconClassDanger} />
            <span className="text-danger">Move to trash</span>
          </button>
        ))}
      {trashed && (
        <>
          <button
            className={defaultClassNames}
            onClick={async () => {
              await notesController.setTrashSelectedNotes(false)
              closeMenuAndToggleNotesList()
            }}
          >
            <Icon type="restore" className={iconClassSuccess} />
            <span className="text-success">Restore</span>
          </button>
          <DeletePermanentlyButton
            onClick={async () => {
              await notesController.deleteNotesPermanently()
              closeMenuAndToggleNotesList()
            }}
          />
          <button
            className={defaultClassNames}
            onClick={async () => {
              await notesController.emptyTrash()
              closeMenuAndToggleNotesList()
            }}
          >
            <div className="flex items-start">
              <Icon type="trash-sweep" className="mr-2 text-danger" />
              <div className="flex-row">
                <div className="text-danger">Empty Trash</div>
                <div className="text-xs">{notesController.trashedNotesCount} notes in Trash</div>
              </div>
            </div>
          </button>
        </>
      )}

      {notes.length === 1 ? (
        <>
          {notes[0].noteType === NoteType.Super && (
            <>
              <HorizontalSeparator classes="my-2" />

              <div className="my-1 px-3 text-base font-semibold uppercase text-text lg:text-xs">Super</div>

              <button className={defaultClassNames} onClick={enableSuperMarkdownPreview}>
                <div className="flex w-full items-center justify-between">
                  <span className="flex">
                    <Icon type="markdown" className={iconClass} />
                    Show Markdown
                  </span>
                  {markdownShortcut && <KeyboardShortcutIndicator className={''} shortcut={markdownShortcut} />}
                </div>
              </button>
            </>
          )}
          <HorizontalSeparator classes="my-2" />

          <ListedActionsOption
            iconClassName={iconClass}
            className={switchClassNames}
            application={application}
            note={notes[0]}
          />

          <HorizontalSeparator classes="my-2" />

          <SpellcheckOptions
            className={switchClassNames}
            editorForNote={editorForNote}
            notesController={notesController}
            note={notes[0]}
          />

          <HorizontalSeparator classes="my-2" />

          <NoteAttributes application={application} note={notes[0]} />

          <NoteSizeWarning note={notes[0]} />
        </>
      ) : null}
    </>
  )
}

export default observer(NotesOptions)

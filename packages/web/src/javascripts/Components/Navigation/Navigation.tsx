import SmartViewsSection from '@/Components/Tags/SmartViewsSection'
import TagsSection from '@/Components/Tags/TagsSection'
import { WebApplication } from '@/Application/Application'
import { PANEL_NAME_NAVIGATION } from '@/Constants/Constants'
import { ApplicationEvent, PrefKey } from '@standardnotes/snjs'
import { observer } from 'mobx-react-lite'
import { FunctionComponent, useCallback, useEffect, useMemo, useState } from 'react'
import PanelResizer, { PanelSide, ResizeFinishCallback, PanelResizeType } from '@/Components/PanelResizer/PanelResizer'
import ResponsivePaneContent from '@/Components/ResponsivePane/ResponsivePaneContent'
import { AppPaneId } from '@/Components/ResponsivePane/AppPaneMetadata'
import { classNames } from '@/Utils/ConcatenateClassNames'
import Icon from '../Icon/Icon'
import { useResponsiveAppPane } from '../ResponsivePane/ResponsivePaneProvider'
import { isIOS } from '@/Utils'
import UpgradeNow from '../Footer/UpgradeNow'

type Props = {
  application: WebApplication
}

const Navigation: FunctionComponent<Props> = ({ application }) => {
  const viewControllerManager = useMemo(() => application.getViewControllerManager(), [application])
  const [panelElement, setPanelElement] = useState<HTMLDivElement>()
  const [panelWidth, setPanelWidth] = useState<number>(0)
  const { selectedPane, toggleAppPane } = useResponsiveAppPane()

  const [hasPasscode, setHasPasscode] = useState(() => application.hasPasscode())
  useEffect(() => {
    const removeObserver = application.addEventObserver(async () => {
      setHasPasscode(application.hasPasscode())
    }, ApplicationEvent.KeyStatusChanged)

    return removeObserver
  }, [application])

  useEffect(() => {
    const removeObserver = application.addEventObserver(async () => {
      const width = application.getPreference(PrefKey.TagsPanelWidth)
      if (width) {
        setPanelWidth(width)
      }
    }, ApplicationEvent.PreferencesChanged)

    return () => {
      removeObserver()
    }
  }, [application])

  const panelResizeFinishCallback: ResizeFinishCallback = useCallback(
    (width, _lastLeft, _isMaxWidth, isCollapsed) => {
      application.setPreference(PrefKey.TagsPanelWidth, width).catch(console.error)
      application.publishPanelDidResizeEvent(PANEL_NAME_NAVIGATION, isCollapsed)
    },
    [application],
  )

  return (
    <div
      id="navigation"
      className={classNames(
        'sn-component section app-column h-screen max-h-screen overflow-hidden pt-safe-top md:h-full md:max-h-full md:min-h-0 md:pb-0',
        'w-[220px] xl:w-[220px] xsm-only:!w-full sm-only:!w-full',
        selectedPane === AppPaneId.Navigation
          ? 'pointer-coarse:md-only:!w-48 pointer-coarse:lg-only:!w-48'
          : 'pointer-coarse:md-only:!w-0 pointer-coarse:lg-only:!w-0',
        isIOS() ? 'pb-safe-bottom' : 'pb-2.5',
      )}
      ref={(element) => {
        if (element) {
          setPanelElement(element)
        }
      }}
    >
      <ResponsivePaneContent paneId={AppPaneId.Navigation} contentElementId="navigation-content">
        <div
          className={classNames(
            'flex-grow overflow-y-auto overflow-x-hidden md:overflow-y-hidden md:hover:overflow-y-auto pointer-coarse:md:overflow-y-auto',
            'md:hover:[overflow-y:_overlay]',
          )}
        >
          <div className={'section-title-bar'}>
            <div className="section-title-bar-header">
              <div className="title text-sm">
                <span className="font-bold">Views</span>
              </div>
            </div>
          </div>
          <SmartViewsSection viewControllerManager={viewControllerManager} />
          <TagsSection viewControllerManager={viewControllerManager} />
        </div>
        <div className="flex items-center border-t border-border px-3.5 pt-2.5 md:hidden">
          <button
            className="mr-auto flex h-8 min-w-8 cursor-pointer items-center justify-center rounded-full border border-solid border-border bg-default text-neutral hover:bg-contrast focus:bg-contrast"
            onClick={() => {
              toggleAppPane(AppPaneId.Items)
            }}
            title="Go to items list"
            aria-label="Go to items list"
          >
            <Icon type="chevron-left" />
          </button>
          <UpgradeNow application={application} featuresController={viewControllerManager.featuresController} />
          <button
            className="ml-2.5 flex h-8 min-w-8 cursor-pointer items-center justify-center rounded-full border border-solid border-border bg-default text-neutral hover:bg-contrast focus:bg-contrast"
            onClick={() => {
              viewControllerManager.accountMenuController.toggleShow()
            }}
            title="Go to account menu"
            aria-label="Go to account menu"
          >
            <Icon type="account-circle" />
          </button>
          {hasPasscode && (
            <button
              id="lock-item"
              onClick={() => application.lock()}
              title="Locks application and wipes unencrypted data from memory."
              aria-label="Locks application and wipes unencrypted data from memory."
              className="ml-2.5 flex h-8 min-w-8 cursor-pointer items-center justify-center rounded-full border border-solid border-border bg-default text-neutral hover:bg-contrast focus:bg-contrast"
            >
              <Icon type="lock-filled" size="custom" className="h-4.5 w-4.5" />
            </button>
          )}
          <button
            className="ml-2.5 flex h-8 min-w-8 cursor-pointer items-center justify-center rounded-full border border-solid border-border bg-default text-neutral hover:bg-contrast focus:bg-contrast"
            onClick={() => {
              viewControllerManager.preferencesController.openPreferences()
            }}
            title="Go to preferences"
            aria-label="Go to preferences"
          >
            <Icon type="tune" />
          </button>
          <button
            className="ml-2.5 flex h-8 min-w-8 cursor-pointer items-center justify-center rounded-full border border-solid border-border bg-default text-neutral hover:bg-contrast focus:bg-contrast"
            onClick={() => {
              viewControllerManager.quickSettingsMenuController.toggle()
            }}
            title="Go to quick settings menu"
            aria-label="Go to quick settings menu"
          >
            <Icon type="themes" />
          </button>
        </div>
      </ResponsivePaneContent>
      {panelElement && (
        <PanelResizer
          collapsable={true}
          defaultWidth={150}
          panel={panelElement}
          hoverable={true}
          side={PanelSide.Right}
          type={PanelResizeType.WidthOnly}
          resizeFinishCallback={panelResizeFinishCallback}
          width={panelWidth}
          left={0}
        />
      )}
    </div>
  )
}

export default observer(Navigation)

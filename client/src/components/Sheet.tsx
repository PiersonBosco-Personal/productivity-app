import type { ReactNode } from 'react'
import { Dialog } from '@base-ui/react/dialog'
import { cn } from 'cn'

// A bottom sheet on a phone; a centred dialog from md up. Every sheet in the app
// goes through here, so the breakpoint switch lives in exactly one place.
export function Sheet({
  open,
  onOpenChange,
  children,
  className,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  children: ReactNode
  className?: string
}) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Backdrop
          className="fixed inset-0 z-50 bg-scrim duration-[260ms] data-open:animate-in data-open:fade-in-0 data-closed:animate-out data-closed:fade-out-0"
        />
        <Dialog.Popup
          className={cn(
            'fixed z-50 flex flex-col bg-popover text-popover-foreground outline-none',
            // phone: pinned to the bottom edge, slides up
            'inset-x-0 bottom-0 max-h-[92svh] rounded-t-[22px] pb-[calc(env(safe-area-inset-bottom)+10px)]',
            'shadow-[0_-1px_2px_rgb(15_17_22/0.04),0_-12px_32px_rgb(15_17_22/0.10)]',
            'duration-[340ms] data-open:animate-in data-open:slide-in-from-bottom data-closed:animate-out data-closed:slide-out-to-bottom',
            // md and up: a centred dialog that scales in instead
            'md:inset-x-auto md:bottom-auto md:top-1/2 md:left-1/2 md:w-[432px] md:max-h-[82svh]',
            'md:-translate-x-1/2 md:-translate-y-1/2 md:rounded-[18px] md:pb-3',
            'md:data-open:slide-in-from-bottom-0 md:data-closed:slide-out-to-bottom-0',
            'md:data-open:zoom-in-95 md:data-closed:zoom-out-95',
            className,
          )}
        >
          {/* Grab handle: a phone affordance, meaningless on a centred dialog. */}
          <div className="mx-auto mt-[9px] h-1 w-9 shrink-0 rounded-full bg-input md:hidden" />
          {children}
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  )
}

// Sticky header: a cancel action, a centred title, and a primary action.
export function SheetHeader({
  title,
  onCancel,
  action,
  actionLabel,
  actionDisabled,
}: {
  title: string
  onCancel: () => void
  action?: () => void
  actionLabel?: string
  actionDisabled?: boolean
}) {
  return (
    <div className="flex shrink-0 items-center gap-2 px-[18px] pt-2.5 pb-2">
      <button type="button" onClick={onCancel} className="rounded-lg px-2.5 py-1.5 text-sm text-muted-foreground">
        Cancel
      </button>
      <h3 className="flex-1 text-center text-[15.5px] font-semibold tracking-tight">{title}</h3>
      {action ? (
        <button
          type="button"
          onClick={action}
          disabled={actionDisabled}
          className="rounded-full bg-primary px-[15px] py-1.5 text-sm font-semibold text-primary-foreground disabled:pointer-events-none disabled:opacity-30"
        >
          {actionLabel}
        </button>
      ) : (
        // Keeps the title optically centred when there is no action.
        <span className="w-[68px]" />
      )}
    </div>
  )
}

export function SheetBody({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn('min-h-0 overflow-y-auto px-[18px]', className)}>{children}</div>
}

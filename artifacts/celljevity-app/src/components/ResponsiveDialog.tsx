import * as React from "react"
import { useIsMobile } from "@/hooks/use-mobile"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer"

export function ResponsiveDialog({
  children,
  open,
  onOpenChange,
}: {
  children: React.ReactNode
  open?: boolean
  onOpenChange?: (open: boolean) => void
}) {
  const isMobile = useIsMobile()

  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={onOpenChange}>
        {children}
      </Drawer>
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {children}
    </Dialog>
  )
}

export function ResponsiveDialogTrigger({
  children,
  asChild,
  className,
}: {
  children: React.ReactNode
  asChild?: boolean
  className?: string
}) {
  const isMobile = useIsMobile()

  if (isMobile) {
    return (
      <DrawerTrigger asChild={asChild} className={className}>
        {children}
      </DrawerTrigger>
    )
  }

  return (
    <DialogTrigger asChild={asChild} className={className}>
      {children}
    </DialogTrigger>
  )
}

export function ResponsiveDialogClose({
  children,
  asChild,
  className,
}: {
  children: React.ReactNode
  asChild?: boolean
  className?: string
}) {
  const isMobile = useIsMobile()

  if (isMobile) {
    return (
      <DrawerClose asChild={asChild} className={className}>
        {children}
      </DrawerClose>
    )
  }

  return (
    <DialogClose asChild={asChild} className={className}>
      {children}
    </DialogClose>
  )
}

export function ResponsiveDialogContent({
  children,
  className,
}: {
  children: React.ReactNode
  className?: string
}) {
  const isMobile = useIsMobile()

  if (isMobile) {
    return (
      <DrawerContent className={className}>
        {children}
      </DrawerContent>
    )
  }

  return <DialogContent className={className}>{children}</DialogContent>
}

export function ResponsiveDialogHeader({
  children,
  className,
}: {
  children: React.ReactNode
  className?: string
}) {
  const isMobile = useIsMobile()

  if (isMobile) {
    return <DrawerHeader className={className}>{children}</DrawerHeader>
  }

  return <DialogHeader className={className}>{children}</DialogHeader>
}

export function ResponsiveDialogFooter({
  children,
  className,
}: {
  children: React.ReactNode
  className?: string
}) {
  const isMobile = useIsMobile()

  if (isMobile) {
    return <DrawerFooter className={className}>{children}</DrawerFooter>
  }

  return <DialogFooter className={className}>{children}</DialogFooter>
}

export function ResponsiveDialogTitle({
  children,
  className,
}: {
  children: React.ReactNode
  className?: string
}) {
  const isMobile = useIsMobile()

  if (isMobile) {
    return <DrawerTitle className={className}>{children}</DrawerTitle>
  }

  return <DialogTitle className={className}>{children}</DialogTitle>
}

export function ResponsiveDialogDescription({
  children,
  className,
}: {
  children: React.ReactNode
  className?: string
}) {
  const isMobile = useIsMobile()

  if (isMobile) {
    return <DrawerDescription className={className}>{children}</DrawerDescription>
  }

  return <DialogDescription className={className}>{children}</DialogDescription>
}

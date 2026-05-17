"use client"

import * as React from "react"
import * as TooltipPrimitive from "@radix-ui/react-tooltip"

import { cn } from "@/lib/utils"

// Radix tooltip primitives have incomplete prop types in this version.
/* eslint-disable @typescript-eslint/no-explicit-any */
const TooltipContent_ = TooltipPrimitive.Content as React.ComponentType<any>
const TooltipTrigger_ = TooltipPrimitive.Trigger as React.ComponentType<any>
const TooltipArrow_ = TooltipPrimitive.Arrow as React.ComponentType<any>
/* eslint-enable @typescript-eslint/no-explicit-any */

type BaseProps = React.HTMLAttributes<HTMLElement> & {
  children?: React.ReactNode
  className?: string
  asChild?: boolean
}

function TooltipProvider({
  delayDuration = 0,
  ...props
}: React.ComponentProps<typeof TooltipPrimitive.Provider>) {
  return (
    <TooltipPrimitive.Provider
      data-slot="tooltip-provider"
      delayDuration={delayDuration}
      {...props}
    />
  )
}

function Tooltip({
  ...props
}: React.ComponentProps<typeof TooltipPrimitive.Root>) {
  return (
    <TooltipProvider>
      <TooltipPrimitive.Root data-slot="tooltip" {...props} />
    </TooltipProvider>
  )
}

function TooltipTrigger({
  children,
  ...props
}: BaseProps) {
  return (
    <TooltipTrigger_
      data-slot="tooltip-trigger"
      {...props}
    >
      {children}
    </TooltipTrigger_>
  )
}

function TooltipContent({
  className,
  sideOffset = 0,
  children,
  ...props
}: BaseProps & {
  sideOffset?: number
  side?: "top" | "right" | "bottom" | "left"
  align?: "start" | "center" | "end"
  alignOffset?: number
  hidden?: boolean
}) {
  return (
    <TooltipPrimitive.Portal>
      <TooltipContent_
        data-slot="tooltip-content"
        sideOffset={sideOffset}
        className={cn(
          "bg-primary text-primary-foreground animate-in fade-in-0 zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 z-50 w-fit origin-(--radix-tooltip-content-transform-origin) rounded-md px-3 py-1.5 text-xs text-balance",
          className
        )}
        {...props}
      >
        {children}
        <TooltipArrow_ className="bg-primary fill-primary z-50 size-2.5 translate-y-[calc(-50%_-_2px)] rotate-45 rounded-[2px]" />
      </TooltipContent_>
    </TooltipPrimitive.Portal>
  )
}

export { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider }

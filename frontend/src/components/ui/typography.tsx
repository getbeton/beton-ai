"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

/**
 * Typography primitives aligned with our tokenized Tailwind theme.
 * Use these instead of raw <h1>, <p>, etc. to ensure consistent spacing,
 * font sizing, and dark mode contrast across the app.
 */

export interface TypographyProps extends React.HTMLAttributes<HTMLDivElement> {}

export const H1 = React.forwardRef<HTMLHeadingElement, React.HTMLAttributes<HTMLHeadingElement>>(
  ({ className, ...props }, ref) => (
    <h1
      ref={ref}
      className={cn(
        "scroll-m-20 text-3xl font-bold tracking-tight lg:text-4xl",
        className
      )}
      {...props}
    />
  )
)
H1.displayName = "H1"

export const H2 = React.forwardRef<HTMLHeadingElement, React.HTMLAttributes<HTMLHeadingElement>>(
  ({ className, ...props }, ref) => (
    <h2
      ref={ref}
      className={cn(
        "mt-8 scroll-m-20 pb-2 text-2xl font-semibold tracking-tight first:mt-0",
        className
      )}
      {...props}
    />
  )
)
H2.displayName = "H2"

export const H3 = React.forwardRef<HTMLHeadingElement, React.HTMLAttributes<HTMLHeadingElement>>(
  ({ className, ...props }, ref) => (
    <h3
      ref={ref}
      className={cn("mt-6 scroll-m-20 text-xl font-semibold tracking-tight", className)}
      {...props}
    />
  )
)
H3.displayName = "H3"

export const H4 = React.forwardRef<HTMLHeadingElement, React.HTMLAttributes<HTMLHeadingElement>>(
  ({ className, ...props }, ref) => (
    <h4
      ref={ref}
      className={cn("mt-4 scroll-m-20 text-lg font-semibold tracking-tight", className)}
      {...props}
    />
  )
)
H4.displayName = "H4"

export const P = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLParagraphElement>>(
  ({ className, ...props }, ref) => (
    <p ref={ref} className={cn("leading-7 text-foreground", className)} {...props} />
  )
)
P.displayName = "P"

export const Lead = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLParagraphElement>>(
  ({ className, ...props }, ref) => (
    <p ref={ref} className={cn("text-lg text-muted-foreground", className)} {...props} />
  )
)
Lead.displayName = "Lead"

export const Muted = React.forwardRef<HTMLSpanElement, React.HTMLAttributes<HTMLSpanElement>>(
  ({ className, ...props }, ref) => (
    <span ref={ref} className={cn("text-sm text-muted-foreground", className)} {...props} />
  )
)
Muted.displayName = "Muted"

export const Small = React.forwardRef<HTMLSpanElement, React.HTMLAttributes<HTMLSpanElement>>(
  ({ className, ...props }, ref) => (
    <small ref={ref} className={cn("text-xs font-medium leading-none", className)} {...props} />
  )
)
Small.displayName = "Small"

export const Blockquote = React.forwardRef<HTMLQuoteElement, React.HTMLAttributes<HTMLQuoteElement>>(
  ({ className, ...props }, ref) => (
    <blockquote
      ref={ref}
      className={cn("mt-6 border-l-2 border-border pl-6 italic text-muted-foreground", className)}
      {...props}
    />
  )
)
Blockquote.displayName = "Blockquote"

export const InlineCode = React.forwardRef<HTMLElement, React.HTMLAttributes<HTMLElement>>(
  ({ className, ...props }, ref) => (
    <code
      ref={ref}
      className={cn(
        "relative rounded bg-muted px-[0.3rem] py-[0.2rem] font-mono text-sm",
        className
      )}
      {...props}
    />
  )
)
InlineCode.displayName = "InlineCode"

export const UL = React.forwardRef<HTMLUListElement, React.HTMLAttributes<HTMLUListElement>>(
  ({ className, ...props }, ref) => (
    <ul ref={ref} className={cn("my-6 ml-6 list-disc [&>li]:mt-2", className)} {...props} />
  )
)
UL.displayName = "UL"

export const OL = React.forwardRef<HTMLOListElement, React.HTMLAttributes<HTMLOListElement>>(
  ({ className, ...props }, ref) => (
    <ol ref={ref} className={cn("my-6 ml-6 list-decimal [&>li]:mt-2", className)} {...props} />
  )
)
OL.displayName = "OL"

export const HR = React.forwardRef<HTMLHRElement, React.HTMLAttributes<HTMLHRElement>>(
  ({ className, ...props }, ref) => (
    <hr ref={ref} className={cn("my-6 border-t border-border", className)} {...props} />
  )
)
HR.displayName = "HR"

export const Typography = {
  H1,
  H2,
  H3,
  H4,
  P,
  Lead,
  Muted,
  Small,
  Blockquote,
  InlineCode,
  UL,
  OL,
  HR,
}



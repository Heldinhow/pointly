import type * as React from "react";
import { BrandMark, BrandWordmark } from "@/components/brand-mark";
import { cn } from "@/lib/utils";

/** Auditoria #158: atalho de teclado para pular direto ao conteúdo. */
export function SkipLink({
  label = "Pular para o conteúdo",
  className,
  ...props
}: React.ComponentProps<"a"> & { label?: string }): React.ReactElement {
  return (
    <a
      data-slot="skip-link"
      href="#conteudo"
      className={cn(
        "sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-50 focus:rounded-lg focus:bg-primary focus:px-4 focus:py-2 focus:text-sm focus:font-medium focus:text-primary-foreground focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background focus:outline-none",
        className,
      )}
      {...props}
    >
      {label}
    </a>
  );
}

export function ShellHeader({
  className,
  ...props
}: React.ComponentProps<"header">): React.ReactElement {
  return (
    <header
      data-slot="shell-header"
      className={cn(
        "site-header mx-auto flex h-[var(--header-h)] w-full items-center justify-between px-5 sm:px-8",
        className,
      )}
      {...props}
    />
  );
}

export function ShellMain({
  className,
  ...props
}: React.ComponentProps<"main">): React.ReactElement {
  return (
    <main
      data-slot="shell-main"
      className={cn(
        "site-main mx-auto flex w-full flex-1 flex-col px-5 pb-10 sm:px-8",
        className,
      )}
      {...props}
    />
  );
}

export function Brand({
  className,
  ...props
}: React.ComponentProps<"span">): React.ReactElement {
  return (
    <span
      data-slot="brand"
      className={cn(
        "brand-lockup font-heading text-2xl font-bold tracking-tighter",
        className,
      )}
      {...props}
    >
      <BrandMark size={26} className="brand-mark" />
      <BrandWordmark />
    </span>
  );
}

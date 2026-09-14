import type * as React from "react";
import { cn } from "@/lib/utils";

/** Auditoria #158: atalho de teclado para pular direto ao conteúdo. */
export function SkipLink({
  className,
  ...props
}: React.ComponentProps<"a">): React.ReactElement {
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
      Pular para o conteúdo
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
        "site-header mx-auto flex h-20 w-full items-center justify-between px-5 sm:px-8",
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
        "font-heading text-2xl font-bold tracking-tighter",
        className,
      )}
      {...props}
    >
      Pointly
    </span>
  );
}

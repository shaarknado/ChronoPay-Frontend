"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { ChevronRight, MoreHorizontal } from "lucide-react";

type BreadcrumbItem = {
  label: string;
  href?: string;
  icon?: React.ReactNode;
};

type BreadcrumbOverflowProps = {
  items: BreadcrumbItem[];
  className?: string;
};

const MOBILE_BREAKPOINT = 640;

function isMobileViewport() {
  if (typeof window === "undefined") return false;
  return window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT}px)`).matches;
}

export function BreadcrumbOverflow({ items, className }: BreadcrumbOverflowProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(isMobileViewport());
  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const menuId = useId();

  useEffect(() => {
    const mediaQuery = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT}px)`);
    const update = () => setIsMobile(mediaQuery.matches);
    update();
    mediaQuery.addEventListener("change", update);
    return () => mediaQuery.removeEventListener("change", update);
  }, []);

  useEffect(() => {
    if (!isOpen) return;

    const firstMenuItem = menuRef.current?.querySelector<HTMLElement>("[role='menuitem']");
    firstMenuItem?.focus();

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        setIsOpen(false);
        buttonRef.current?.focus();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen]);

  const visibleItems = useMemo(() => {
    if (!isMobile || items.length <= 2) {
      return items;
    }

    return [items[0], items[items.length - 1]];
  }, [isMobile, items]);

  const overflowItems = useMemo(() => {
    if (!isMobile || items.length <= 2) {
      return [];
    }

    return items.slice(1, -1);
  }, [isMobile, items]);

  const hasOverflow = overflowItems.length > 0;

  const handleOpenChange = (nextOpen: boolean) => {
    setIsOpen(nextOpen);
  };

  const liveAnnouncement = isOpen ? "Hidden breadcrumb items expanded." : "";

  if (items.length === 1) {
    return (
      <nav aria-label="Breadcrumb" className={className}>
        <ol className="flex flex-wrap items-center gap-2 text-sm">
          <li className="flex items-center gap-1.5 text-slate-200">
            {items[0].icon && <span aria-hidden="true" className="inline-flex items-center">{items[0].icon}</span>}
            <span>{items[0].label}</span>
          </li>
        </ol>
      </nav>
    );
  }

  return (
    <nav aria-label="Breadcrumb" className={className}>
      <ol className="flex flex-wrap items-center gap-2 text-sm">
        {visibleItems.map((item, index) => {
          const isLast = index === visibleItems.length - 1;
          const shouldRenderOverflow = hasOverflow && index === 0 && isMobile;

          return (
            <li key={`${item.label}-${index}`} className="flex items-center gap-2">
              {shouldRenderOverflow ? (
                <>
                  <button
                    ref={buttonRef}
                    type="button"
                    className="inline-flex items-center rounded-full border border-white/10 bg-slate-950/50 px-2.5 py-1 text-sm font-medium text-slate-300 transition hover:border-cyan-300/30 hover:bg-slate-900 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300"
                    aria-haspopup="menu"
                    aria-expanded={isOpen}
                    aria-controls={menuId}
                    onClick={() => handleOpenChange(!isOpen)}
                    aria-label="Show hidden breadcrumb items"
                  >
                    <MoreHorizontal className="mr-1 h-4 w-4" aria-hidden="true" />
                    More
                  </button>
                  {isOpen && (
                    <div
                      ref={menuRef}
                      id={menuId}
                      role="menu"
                      className="absolute z-20 mt-2 min-w-[10rem] rounded-xl border border-white/10 bg-slate-950/95 p-2 shadow-2xl"
                      aria-label="Hidden breadcrumb items"
                    >
                      {overflowItems.map((overflowItem) => (
                        <div key={overflowItem.label} role="none">
                          {overflowItem.href ? (
                            <Link
                              href={overflowItem.href}
                              role="menuitem"
                              className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-slate-200 hover:bg-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300"
                              onClick={() => setIsOpen(false)}
                            >
                              {overflowItem.icon && <span aria-hidden="true" className="inline-flex items-center">{overflowItem.icon}</span>}
                              <span>{overflowItem.label}</span>
                            </Link>
                          ) : (
                            <span className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-slate-400">
                              {overflowItem.icon && <span aria-hidden="true" className="inline-flex items-center">{overflowItem.icon}</span>}
                              <span>{overflowItem.label}</span>
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                  <ChevronRight className="h-4 w-4 text-slate-500" aria-hidden="true" />
                </>
              ) : (
                <>
                  {item.href && !isLast ? (
                    <Link
                      href={item.href}
                      className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-sm font-medium text-slate-300 transition hover:bg-slate-900 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300"
                    >
                      {item.icon && <span aria-hidden="true" className="inline-flex items-center">{item.icon}</span>}
                      <span>{item.label}</span>
                    </Link>
                  ) : (
                    <span className={`inline-flex items-center gap-1.5 ${isLast ? "font-semibold text-white" : "text-slate-300"}`}>
                      {item.icon && <span aria-hidden="true" className="inline-flex items-center">{item.icon}</span>}
                      <span>{item.label}</span>
                    </span>
                  )}
                  {!isLast && <ChevronRight className="h-4 w-4 text-slate-500" aria-hidden="true" />}
                </>
              )}
            </li>
          );
        })}
      </ol>
      <div className="sr-only" aria-live="polite" aria-atomic="true">
        {liveAnnouncement}
      </div>
    </nav>
  );
}

"use client";

import { useEffect, useState } from "react";
import { FiHelpCircle } from "react-icons/fi";

export function InfoHint({
  title,
  description,
  buttonClassName,
  panelClassName,
  align = "left",
}: {
  title: string;
  description: string;
  buttonClassName?: string;
  panelClassName?: string;
  align?: "left" | "right";
}) {
  const [open, setOpen] = useState(false);
  const [usesHover, setUsesHover] = useState(false);

  useEffect(() => {
    if (typeof window.matchMedia !== "function") {
      return;
    }

    const mediaQuery = window.matchMedia("(hover: hover) and (pointer: fine)");

    function syncInteractionMode() {
      setUsesHover(mediaQuery.matches);
      setOpen(false);
    }

    syncInteractionMode();

    if (typeof mediaQuery.addEventListener === "function") {
      mediaQuery.addEventListener("change", syncInteractionMode);
    } else {
      mediaQuery.addListener(syncInteractionMode);
    }

    return () => {
      if (typeof mediaQuery.removeEventListener === "function") {
        mediaQuery.removeEventListener("change", syncInteractionMode);
      } else {
        mediaQuery.removeListener(syncInteractionMode);
      }
    };
  }, []);

  const positionClassName =
    align === "right"
      ? "left-1/2 -translate-x-1/2 sm:left-auto sm:right-0 sm:translate-x-0 sm:origin-top-right"
      : "left-1/2 -translate-x-1/2 sm:left-0 sm:translate-x-0 sm:origin-top-left";
  const resolvedButtonClassName =
    buttonClassName ??
    "text-muted-foreground transition-colors hover:text-foreground";
  const resolvedPanelClassName =
    panelClassName ??
    "top-full border bg-popover text-popover-foreground";

  return (
    <div
      className="relative inline-flex"
      onMouseEnter={() => {
        if (usesHover) {
          setOpen(true);
        }
      }}
      onMouseLeave={() => {
        if (usesHover) {
          setOpen(false);
        }
      }}
    >
      <button
        type="button"
        onClick={() => {
          if (!usesHover) {
            setOpen((current) => !current);
          }
        }}
        onFocus={() => setOpen(true)}
        onBlur={() => {
          if (usesHover) {
            setOpen(false);
          }
        }}
        aria-label={title}
        aria-expanded={open}
        className={`inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${resolvedButtonClassName}`}
      >
        <FiHelpCircle size={15} />
      </button>

      {open ? (
        <div
          className={`absolute top-full z-10 mt-2 w-[calc(100vw-1.5rem)] max-w-80 rounded-lg p-3 text-sm shadow-md sm:w-72 sm:max-w-[calc(100vw-4rem)] ${positionClassName} ${resolvedPanelClassName}`}
        >
          <p className="font-medium">{title}</p>
          <p className="mt-1 whitespace-pre-line opacity-90">{description}</p>
        </div>
      ) : null}
    </div>
  );
}

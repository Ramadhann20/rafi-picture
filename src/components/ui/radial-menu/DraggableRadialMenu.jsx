"use client";

import {
  AnimatePresence,
  animate,
  motion,
  useMotionValue,
  useReducedMotion,
} from "framer-motion";
import { useDrag } from "@use-gesture/react";
import { createPortal } from "react-dom";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import styles from "./DraggableRadialMenu.module.css";

import AppIcon from "@/components/global/AppIcon";

const EDGES = ["left", "right", "top", "bottom"];

const DEFAULTS = Object.freeze({
  buttonSize: 58,
  actionSize: 46,
  radius: 94,
  arcDegrees: 118,
  edgeOffset: 18,
  viewportPadding: 14,
  tapThreshold: 7,
  initialEdge: "right",
  initialEdgeRatio: 0.72,
});

function clamp(value, min, max) {
  if (min > max) return (min + max) / 2;
  return Math.min(Math.max(value, min), max);
}

function normalizeEdge(edge) {
  return EDGES.includes(edge) ? edge : DEFAULTS.initialEdge;
}

function normalizeRatio(value, fallback = DEFAULTS.initialEdgeRatio) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? clamp(parsed, 0, 1) : fallback;
}

function centerAngleForEdge(edge) {
  switch (edge) {
    case "left":
      return 0;
    case "right":
      return 180;
    case "top":
      return 90;
    case "bottom":
      return -90;
    default:
      return 180;
  }
}

function getAngles(count, edge, arcDegrees) {
  if (!count) return [];

  const center = centerAngleForEdge(edge);
  if (count === 1) return [center];

  const start = center - arcDegrees / 2;
  const step = arcDegrees / (count - 1);
  return Array.from({ length: count }, (_, index) => start + step * index);
}

function getActionOffsets(count, edge, radius, arcDegrees) {
  return getAngles(count, edge, arcDegrees).map((angle) => {
    const radians = (angle * Math.PI) / 180;
    return {
      x: Math.cos(radians) * radius,
      y: Math.sin(radians) * radius,
    };
  });
}

function getBoundsForEdge({
  edge,
  itemCount,
  viewportWidth,
  viewportHeight,
  buttonSize,
  actionSize,
  radius,
  arcDegrees,
  edgeOffset,
  viewportPadding,
}) {
  const halfButton = buttonSize / 2;
  const halfAction = actionSize / 2;
  const offsets = getActionOffsets(itemCount, edge, radius, arcDegrees);

  // The label sits above each action. Reserve a little extra vertical room.
  const labelReserve = 34;

  let minRelX = -halfButton;
  let maxRelX = halfButton;
  let minRelY = -halfButton;
  let maxRelY = halfButton;

  offsets.forEach(({ x, y }) => {
    minRelX = Math.min(minRelX, x - halfAction);
    maxRelX = Math.max(maxRelX, x + halfAction);
    minRelY = Math.min(minRelY, y - halfAction - labelReserve);
    maxRelY = Math.max(maxRelY, y + halfAction);
  });

  const minCenterX = viewportPadding - minRelX;
  const maxCenterX = viewportWidth - viewportPadding - maxRelX;
  const minCenterY = viewportPadding - minRelY;
  const maxCenterY = viewportHeight - viewportPadding - maxRelY;

  const edgeCenterX =
    edge === "left"
      ? edgeOffset + halfButton
      : edge === "right"
        ? viewportWidth - edgeOffset - halfButton
        : null;

  const edgeCenterY =
    edge === "top"
      ? edgeOffset + halfButton
      : edge === "bottom"
        ? viewportHeight - edgeOffset - halfButton
        : null;

  return {
    minCenterX,
    maxCenterX,
    minCenterY,
    maxCenterY,
    edgeCenterX,
    edgeCenterY,
  };
}

function positionForEdge({
  edge,
  ratio,
  itemCount,
  viewportWidth,
  viewportHeight,
  buttonSize,
  actionSize,
  radius,
  arcDegrees,
  edgeOffset,
  viewportPadding,
}) {
  const normalizedEdge = normalizeEdge(edge);
  const normalizedRatio = normalizeRatio(ratio);
  const halfButton = buttonSize / 2;
  const bounds = getBoundsForEdge({
    edge: normalizedEdge,
    itemCount,
    viewportWidth,
    viewportHeight,
    buttonSize,
    actionSize,
    radius,
    arcDegrees,
    edgeOffset,
    viewportPadding,
  });

  let centerX;
  let centerY;

  if (normalizedEdge === "left" || normalizedEdge === "right") {
    centerX = bounds.edgeCenterX;
    centerY = clamp(
      viewportHeight * normalizedRatio,
      bounds.minCenterY,
      bounds.maxCenterY,
    );
  } else {
    centerX = clamp(
      viewportWidth * normalizedRatio,
      bounds.minCenterX,
      bounds.maxCenterX,
    );
    centerY = bounds.edgeCenterY;
  }

  return {
    x: centerX - halfButton,
    y: centerY - halfButton,
  };
}

function clampDraggedPosition({
  x,
  y,
  viewportWidth,
  viewportHeight,
  buttonSize,
  edgeOffset,
}) {
  return {
    x: clamp(x, edgeOffset, viewportWidth - edgeOffset - buttonSize),
    y: clamp(y, edgeOffset, viewportHeight - edgeOffset - buttonSize),
  };
}

function nearestEdge({ x, y, viewportWidth, viewportHeight, buttonSize }) {
  const cx = x + buttonSize / 2;
  const cy = y + buttonSize / 2;

  const distances = {
    left: cx,
    right: viewportWidth - cx,
    top: cy,
    bottom: viewportHeight - cy,
  };

  return Object.entries(distances).reduce((nearest, [edge, distance]) => {
    return distance < nearest.distance ? { edge, distance } : nearest;
  }, { edge: "right", distance: Number.POSITIVE_INFINITY }).edge;
}

function ratioForEdge({ edge, x, y, viewportWidth, viewportHeight, buttonSize }) {
  const cx = x + buttonSize / 2;
  const cy = y + buttonSize / 2;

  if (edge === "left" || edge === "right") {
    return normalizeRatio(cy / viewportHeight);
  }

  return normalizeRatio(cx / viewportWidth);
}

function readSavedPosition(storageKey) {
  if (!storageKey || typeof window === "undefined") return null;

  try {
    const parsed = JSON.parse(window.localStorage.getItem(storageKey) || "null");
    if (!parsed) return null;
    return {
      edge: normalizeEdge(parsed.edge),
      ratio: normalizeRatio(parsed.ratio),
    };
  } catch {
    return null;
  }
}

function writeSavedPosition(storageKey, edge, ratio) {
  if (!storageKey || typeof window === "undefined") return;

  try {
    window.localStorage.setItem(
      storageKey,
      JSON.stringify({ edge: normalizeEdge(edge), ratio: normalizeRatio(ratio) }),
    );
  } catch {
    // Storage is optional. Ignore private-mode/quota errors.
  }
}

function DefaultToggleIcon({ open }) {
  return (
    <span
      className={`${styles.defaultToggleIcon} ${open ? styles.defaultToggleIconOpen : ""}`}
      aria-hidden="true"
    >
      <span />
      <span />
    </span>
  );
}


function RadialActionItem({
  item,
  index,
  offset,
  prefersReducedMotion,
  onAction,
}) {
  return (
    <motion.div
      className={styles.actionSlot}
      initial={{ x: 0, y: 0, opacity: 0, scale: 0.62 }}
      animate={{
        x: offset.x,
        y: offset.y,
        opacity: 1,
        scale: 1,
      }}
      exit={{ x: 0, y: 0, opacity: 0, scale: 0.62 }}
      transition={
        prefersReducedMotion
          ? { duration: 0 }
          : {
              type: "spring",
              stiffness: 520,
              damping: 30,
              mass: 0.55,
              delay: index * 0.035,
            }
      }
    >
      <button
        type="button"
        className={styles.actionButton}
        aria-label={item.ariaLabel || item.label || String(item.id)}
        disabled={item.disabled}
        onClick={() => onAction(item)}
        style={{
          "--ram-pulse-delay": `${index * 180}ms`,
        }}
      >
        <span className={styles.actionIcon} aria-hidden="true">
          {item.icon}
        </span>

        {item.label ? (
          <span className={styles.actionLabel}>{item.label}</span>
        ) : null}
      </button>
    </motion.div>
  );
}

/**
 * Fixed, draggable radial action menu.
 *
 * Important implementation detail:
 * only the MAIN BUTTON owns the drag gesture. The radial action buttons are
 * normal clickable buttons and are never covered by a drag-capture wrapper.
 */
export default function DraggableRadialMenu({
  items = [],
  buttonSize = DEFAULTS.buttonSize,
  actionSize = DEFAULTS.actionSize,
  radius = DEFAULTS.radius,
  arcDegrees = DEFAULTS.arcDegrees,
  edgeOffset = DEFAULTS.edgeOffset,
  viewportPadding = DEFAULTS.viewportPadding,
  tapThreshold = DEFAULTS.tapThreshold,
  initialEdge = DEFAULTS.initialEdge,
  initialEdgeRatio = DEFAULTS.initialEdgeRatio,
  storageKey,
  defaultOpen = false,
  closeOnAction = true,
  closeOnOutsideClick = true,
  mainLabel = "Quick actions",
  openIcon,
  closeIcon,
  className = "",
  zIndex = 80,
  disabled = false,
  onOpenChange,
  onEdgeChange,
}) {
  const prefersReducedMotion = useReducedMotion();
  const rootRef = useRef(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const snapXRef = useRef(null);
  const snapYRef = useRef(null);
  const currentEdgeRef = useRef(normalizeEdge(initialEdge));
  const currentRatioRef = useRef(normalizeRatio(initialEdgeRatio));

  const [mounted, setMounted] = useState(false);
  const [ready, setReady] = useState(false);
  const [open, setOpen] = useState(defaultOpen);
  const [dragging, setDragging] = useState(false);
  const [edge, setEdge] = useState(normalizeEdge(initialEdge));

  const validItems = useMemo(
    () => items.filter((item) => item && item.id != null),
    [items],
  );

  const actionOffsets = useMemo(
    () => getActionOffsets(validItems.length, edge, radius, arcDegrees),
    [validItems.length, edge, radius, arcDegrees],
  );

  const setMenuOpen = useCallback(
    (nextValue) => {
      setOpen((previous) => {
        const next = typeof nextValue === "function" ? nextValue(previous) : nextValue;
        if (next !== previous) onOpenChange?.(next);
        return next;
      });
    },
    [onOpenChange],
  );

  const commitEdge = useCallback(
    (nextEdge, nextRatio) => {
      const normalizedEdge = normalizeEdge(nextEdge);
      const normalizedRatio = normalizeRatio(nextRatio);

      currentEdgeRef.current = normalizedEdge;
      currentRatioRef.current = normalizedRatio;
      setEdge(normalizedEdge);
      writeSavedPosition(storageKey, normalizedEdge, normalizedRatio);
      onEdgeChange?.({ edge: normalizedEdge, ratio: normalizedRatio });
    },
    [storageKey, onEdgeChange],
  );

  const placeOnSavedEdge = useCallback(
    ({ animatePosition = false } = {}) => {
      if (typeof window === "undefined") return;

      const target = positionForEdge({
        edge: currentEdgeRef.current,
        ratio: currentRatioRef.current,
        itemCount: validItems.length,
        viewportWidth: window.innerWidth,
        viewportHeight: window.innerHeight,
        buttonSize,
        actionSize,
        radius,
        arcDegrees,
        edgeOffset,
        viewportPadding,
      });

      snapXRef.current?.stop?.();
      snapYRef.current?.stop?.();

      if (animatePosition && !prefersReducedMotion) {
        snapXRef.current = animate(x, target.x, {
          type: "spring",
          stiffness: 520,
          damping: 38,
          mass: 0.72,
        });
        snapYRef.current = animate(y, target.y, {
          type: "spring",
          stiffness: 520,
          damping: 38,
          mass: 0.72,
        });
      } else {
        x.set(target.x);
        y.set(target.y);
      }
    },
    [
      validItems.length,
      buttonSize,
      actionSize,
      radius,
      arcDegrees,
      edgeOffset,
      viewportPadding,
      prefersReducedMotion,
      x,
      y,
    ],
  );

  useEffect(() => {
    setMounted(true);

    const saved = readSavedPosition(storageKey);
    const nextEdge = saved?.edge ?? normalizeEdge(initialEdge);
    const nextRatio = saved?.ratio ?? normalizeRatio(initialEdgeRatio);

    currentEdgeRef.current = nextEdge;
    currentRatioRef.current = nextRatio;
    setEdge(nextEdge);

    requestAnimationFrame(() => {
      placeOnSavedEdge({ animatePosition: false });
      setReady(true);
    });
  }, [storageKey, initialEdge, initialEdgeRatio, placeOnSavedEdge]);

  useEffect(() => {
    if (!mounted) return undefined;

    let frame = null;
    const handleResize = () => {
      if (frame) cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        setMenuOpen(false);
        placeOnSavedEdge({ animatePosition: false });
      });
    };

    window.addEventListener("resize", handleResize);
    return () => {
      if (frame) cancelAnimationFrame(frame);
      window.removeEventListener("resize", handleResize);
    };
  }, [mounted, placeOnSavedEdge, setMenuOpen]);

  useEffect(() => {
    if (!open || !closeOnOutsideClick) return undefined;

    const handlePointerDown = (event) => {
      if (!rootRef.current?.contains(event.target)) {
        setMenuOpen(false);
      }
    };

    document.addEventListener("pointerdown", handlePointerDown, true);
    return () => document.removeEventListener("pointerdown", handlePointerDown, true);
  }, [open, closeOnOutsideClick, setMenuOpen]);

  useEffect(() => {
    if (!open) return undefined;

    const handleKeyDown = (event) => {
      if (event.key === "Escape") setMenuOpen(false);
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [open, setMenuOpen]);

  useEffect(() => {
    return () => {
      snapXRef.current?.stop?.();
      snapYRef.current?.stop?.();
    };
  }, []);

  const snapToNearestEdge = useCallback(
    (currentX, currentY) => {
      if (typeof window === "undefined") return;

      const nextEdge = nearestEdge({
        x: currentX,
        y: currentY,
        viewportWidth: window.innerWidth,
        viewportHeight: window.innerHeight,
        buttonSize,
      });

      const nextRatio = ratioForEdge({
        edge: nextEdge,
        x: currentX,
        y: currentY,
        viewportWidth: window.innerWidth,
        viewportHeight: window.innerHeight,
        buttonSize,
      });

      const target = positionForEdge({
        edge: nextEdge,
        ratio: nextRatio,
        itemCount: validItems.length,
        viewportWidth: window.innerWidth,
        viewportHeight: window.innerHeight,
        buttonSize,
        actionSize,
        radius,
        arcDegrees,
        edgeOffset,
        viewportPadding,
      });

      const finalRatio = ratioForEdge({
        edge: nextEdge,
        x: target.x,
        y: target.y,
        viewportWidth: window.innerWidth,
        viewportHeight: window.innerHeight,
        buttonSize,
      });

      commitEdge(nextEdge, finalRatio);

      snapXRef.current?.stop?.();
      snapYRef.current?.stop?.();

      if (prefersReducedMotion) {
        x.set(target.x);
        y.set(target.y);
        return;
      }

      snapXRef.current = animate(x, target.x, {
        type: "spring",
        stiffness: 520,
        damping: 38,
        mass: 0.72,
      });
      snapYRef.current = animate(y, target.y, {
        type: "spring",
        stiffness: 520,
        damping: 38,
        mass: 0.72,
      });
    },
    [
      buttonSize,
      validItems.length,
      actionSize,
      radius,
      arcDegrees,
      edgeOffset,
      viewportPadding,
      commitEdge,
      prefersReducedMotion,
      x,
      y,
    ],
  );

  const bindDrag = useDrag(
    ({ first, last, movement: [mx, my], memo, tap }) => {
      if (disabled) return memo;

      // filterTaps makes a clean click arrive here as tap=true.
      // We deliberately do NOT attach a competing onClick handler.
      if (tap) {
        setMenuOpen((value) => !value);
        return memo;
      }

      let origin = memo;

      if (first) {
        snapXRef.current?.stop?.();
        snapYRef.current?.stop?.();
        setMenuOpen(false);
        setDragging(true);
        origin = [x.get(), y.get()];
      }

      if (!origin) origin = [x.get(), y.get()];

      if (typeof window !== "undefined") {
        const next = clampDraggedPosition({
          x: origin[0] + mx,
          y: origin[1] + my,
          viewportWidth: window.innerWidth,
          viewportHeight: window.innerHeight,
          buttonSize,
          edgeOffset,
        });

        x.set(next.x);
        y.set(next.y);

        if (last) {
          setDragging(false);
          snapToNearestEdge(next.x, next.y);
        }
      }

      return origin;
    },
    {
      filterTaps: true,
      tapsThreshold: tapThreshold,
      pointer: { capture: true },
      eventOptions: { passive: false },
    },
  );

  const handleMainKeyDown = (event) => {
    if (disabled) return;
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      setMenuOpen((value) => !value);
    }
  };

  const handleAction = (item) => {
    if (item.disabled) return;
    item.onClick?.(item);
    if (closeOnAction) setMenuOpen(false);
  };

  if (!mounted) return null;

  const menu = (
    <motion.div
      ref={rootRef}
      className={`${styles.root} ${className}`}
      style={{
        x,
        y,
        width: buttonSize,
        height: buttonSize,
        zIndex,
        opacity: ready ? 1 : 0,
        "--ram-button-size": `${buttonSize}px`,
        "--ram-action-size": `${actionSize}px`,
      }}
      data-open={open ? "true" : "false"}
      data-dragging={dragging ? "true" : "false"}
    >
      <AnimatePresence>
        {open &&
          validItems.map((item, index) => {
            const offset = actionOffsets[index] ?? { x: 0, y: 0 };

            return (
              <RadialActionItem
                key={item.id}
                item={item}
                index={index}
                offset={offset}
                prefersReducedMotion={prefersReducedMotion}
                onAction={handleAction}
              />
            );
          })}
      </AnimatePresence>

      <motion.button
        {...bindDrag()}
        type="button"
        className={styles.mainButton}
        aria-label={open ? `Close ${mainLabel}` : mainLabel}
        aria-expanded={open}
        disabled={disabled}
        onKeyDown={handleMainKeyDown}
        whileTap={dragging || prefersReducedMotion ? undefined : { scale: 0.94 }}
        animate={
          dragging
            ? { scale: 1.08 }
            : open
              ? { scale: 1.03 }
              : { scale: 1 }
        }
        transition={{ type: "spring", stiffness: 520, damping: 30 }}
      >
        <span className={styles.mainButtonIcon} aria-hidden="true">
          {open
            ? closeIcon ?? <DefaultToggleIcon open />
            : openIcon ?? <DefaultToggleIcon open={false} />}
        </span>
      </motion.button>
    </motion.div>
  );

  // Portal is intentional: fixed positioning and radial children should not be
  // clipped by page containers, transforms, overflow:hidden, or stacking contexts.
  return createPortal(menu, document.body);
}

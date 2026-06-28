"use client";

/**
 * Centered animated box loader (Uiverse-inspired)
 * - fully centered (x + y)
 * - responsive container-based sizing
 * - dark soft background
 */

export default function BoxLoader({ className = "" }) {
  return (
    <div
      className={`
        flex items-center justify-center
        w-full h-full
        bg-neutral-900/10
        ${className}
      `}
    >
      <div className="relative w-24 h-24">
        {/* BOX 1 */}
        <span className="absolute border-[10px] border-neutral-200 box1" />

        {/* BOX 2 */}
        <span className="absolute border-[10px] border-neutral-200 box2" />

        {/* BOX 3 */}
        <span className="absolute border-[10px] border-neutral-200 box3" />
      </div>

      {/* ANIMATIONS */}
      <style jsx>{`
        .box1,
        .box2,
        .box3 {
          box-sizing: border-box;
          display: block;
          position: absolute;
        }

        .box1 {
          width: 100%;
          height: 40%;
          bottom: 0;
          left: 0;
          animation: abox1 4s 1s ease-in-out infinite;
        }

        .box2 {
          width: 40%;
          height: 40%;
          top: 0;
          left: 0;
          animation: abox2 4s 1s ease-in-out infinite;
        }

        .box3 {
          width: 40%;
          height: 40%;
          top: 0;
          right: 0;
          animation: abox3 4s 1s ease-in-out infinite;
        }

        @keyframes abox1 {
          0% {
            transform: scaleX(1);
          }
          25% {
            transform: scaleX(0.4);
          }
          75% {
            transform: scaleY(2.2);
          }
          100% {
            transform: scaleX(1);
          }
        }

        @keyframes abox2 {
          0% {
            transform: translate(0, 0);
          }
          50% {
            transform: translate(60%, 0);
          }
          100% {
            transform: translate(60%, 60%);
          }
        }

        @keyframes abox3 {
          0% {
            transform: translate(0, 0);
          }
          50% {
            transform: translate(0, 60%);
          }
          100% {
            transform: translate(-60%, 60%);
          }
        }
      `}</style>
    </div>
  );
}
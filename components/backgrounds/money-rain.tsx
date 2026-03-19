import type { CSSProperties } from "react";

type MoneyRainBackgroundProps = {
  billAmounts: readonly string[];
  billCode: string;
  currencySymbol: string;
};

const billPresets = [
  {
    className: "hidden sm:block",
    delay: "-4s",
    duration: "15s",
    left: "8%",
    rotate: "-14deg",
    scale: "0.9",
    top: "8%",
  },
  {
    className: "block",
    delay: "-10s",
    duration: "18s",
    left: "76%",
    rotate: "12deg",
    scale: "1",
    top: "12%",
  },
  {
    className: "hidden md:block",
    delay: "-2s",
    duration: "14s",
    left: "16%",
    rotate: "10deg",
    scale: "0.94",
    top: "44%",
  },
  {
    className: "hidden lg:block",
    delay: "-13s",
    duration: "21s",
    left: "62%",
    rotate: "-9deg",
    scale: "1.08",
    top: "34%",
  },
  {
    className: "block sm:hidden",
    delay: "-6s",
    duration: "16s",
    left: "70%",
    rotate: "-11deg",
    scale: "0.8",
    top: "54%",
  },
  {
    className: "hidden xl:block",
    delay: "-15s",
    duration: "19s",
    left: "24%",
    rotate: "8deg",
    scale: "0.9",
    top: "66%",
  },
] as const;

const coinPresets = [
  {
    className: "block",
    delay: "-7s",
    duration: "12s",
    left: "20%",
    scale: "0.85",
    top: "18%",
  },
  {
    className: "hidden sm:block",
    delay: "-3s",
    duration: "16s",
    left: "86%",
    scale: "1",
    top: "28%",
  },
  {
    className: "hidden lg:block",
    delay: "-11s",
    duration: "14s",
    left: "10%",
    scale: "0.72",
    top: "62%",
  },
  {
    className: "hidden md:block",
    delay: "-14s",
    duration: "17s",
    left: "68%",
    scale: "0.92",
    top: "70%",
  },
  {
    className: "block",
    delay: "-9s",
    duration: "13s",
    left: "42%",
    scale: "0.66",
    top: "10%",
  },
  {
    className: "hidden sm:block",
    delay: "-1s",
    duration: "15s",
    left: "56%",
    scale: "0.82",
    top: "52%",
  },
  {
    className: "hidden md:block",
    delay: "-12s",
    duration: "14s",
    left: "31%",
    scale: "0.74",
    top: "78%",
  },
  {
    className: "hidden lg:block",
    delay: "-5s",
    duration: "16s",
    left: "90%",
    scale: "0.7",
    top: "58%",
  },
] as const;

function BillGraphic({
  amount,
  billCode,
  currencySymbol,
}: {
  amount: string;
  billCode: string;
  currencySymbol: string;
}) {
  return (
    <svg
      viewBox="0 0 176 96"
      className="h-auto w-32 drop-shadow-[0_18px_35px_rgba(1,12,20,0.34)] sm:w-36"
      role="presentation"
    >
      <rect
        x="6"
        y="8"
        width="164"
        height="80"
        rx="18"
        fill="#b9dc87"
        opacity="0.24"
      />
      <rect
        x="8"
        y="10"
        width="160"
        height="76"
        rx="18"
        fill="#a7d472"
        stroke="#d8f0a7"
        strokeWidth="2"
      />
      <rect x="15" y="17" width="146" height="62" rx="14" fill="#88be57" />
      <rect x="22" y="23" width="132" height="50" rx="12" fill="#94cb62" />
      <circle cx="88" cy="48" r="24" fill="#6ca347" />
      <circle cx="88" cy="48" r="16" fill="#82ba55" />
      <circle cx="34" cy="48" r="7" fill="#5d9141" opacity="0.95" />
      <circle cx="142" cy="48" r="7" fill="#5d9141" opacity="0.95" />
      <path d="M27 25h16a10 10 0 0 1-10 10h-6z" fill="#cce89b" opacity="0.7" />
      <path d="M149 25h-16a10 10 0 0 0 10 10h6z" fill="#cce89b" opacity="0.7" />
      <path d="M27 71h16a10 10 0 0 0-10-10h-6z" fill="#cce89b" opacity="0.7" />
      <path d="M149 71h-16a10 10 0 0 1 10-10h6z" fill="#cce89b" opacity="0.7" />
      <text
        x="88"
        y="56"
        textAnchor="middle"
        fontSize="29"
        fontWeight="800"
        fill="#c9ef98"
      >
        {currencySymbol}
      </text>
      <text
        x="22"
        y="22"
        fontSize="8"
        fontWeight="700"
        fill="#dff7b3"
        letterSpacing="1.8"
      >
        {billCode}
      </text>
      <text
        x="154"
        y="22"
        textAnchor="end"
        fontSize="8"
        fontWeight="700"
        fill="#dff7b3"
      >
        {currencySymbol}
        {amount}
      </text>
      <rect x="59" y="66" width="58" height="3" rx="1.5" fill="#78ab51" />
    </svg>
  );
}

function CoinGraphic({ currencySymbol }: { currencySymbol: string }) {
  return (
    <svg
      viewBox="0 0 72 72"
      className="h-auto w-11 drop-shadow-[0_16px_30px_rgba(252,188,16,0.16)] sm:w-12"
      role="presentation"
    >
      <circle cx="36" cy="36" r="33" fill="#ffd84a" />
      <circle
        cx="36"
        cy="36"
        r="31"
        fill="#ffcc24"
        stroke="#ffb300"
        strokeWidth="2"
      />
      <circle
        cx="36"
        cy="36"
        r="24"
        fill="#ffdc4f"
        stroke="#f0ae09"
        strokeWidth="2.5"
      />
      <circle cx="36" cy="36" r="16" fill="#ffd02c" opacity="0.95" />
      <path
        d="M15 27c6-10 19-15 31-11"
        fill="none"
        stroke="#fff3a8"
        strokeLinecap="round"
        strokeWidth="3"
        opacity="0.7"
      />
      <text
        x="36"
        y="45"
        textAnchor="middle"
        fontSize="28"
        fontWeight="900"
        fill="#ef9f00"
      >
        {currencySymbol}
      </text>
    </svg>
  );
}

export function MoneyRainBackground({
  billAmounts,
  billCode,
  currencySymbol,
}: MoneyRainBackgroundProps) {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 overflow-hidden"
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_15%_0%,rgba(124,255,142,0.16),transparent_26%),radial-gradient(circle_at_84%_12%,rgba(76,175,255,0.16),transparent_30%),radial-gradient(circle_at_50%_100%,rgba(55,214,195,0.08),transparent_34%)]" />
      <div className="absolute inset-0 opacity-30 bg-[linear-gradient(to_right,rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-size-[72px_72px]" />
      <div className="absolute inset-x-[8%] top-[8%] h-44 rounded-full bg-[radial-gradient(circle,rgba(126,255,163,0.16),transparent_70%)] blur-3xl" />
      <div className="absolute inset-x-[35%] bottom-[6%] h-52 rounded-full bg-[radial-gradient(circle,rgba(77,169,255,0.08),transparent_72%)] blur-3xl" />

      {billPresets.map((preset, index) => {
        const amount = billAmounts[index % billAmounts.length] ?? "100";
        const style = {
          "--bill-rotate": preset.rotate,
          "--bill-scale": preset.scale,
          animationDelay: preset.delay,
          animationDuration: preset.duration,
          left: preset.left,
          top: preset.top,
        } as CSSProperties;

        return (
          <div
            key={`bill-${preset.left}-${preset.top}-${amount}`}
            className={`money-rain-bill absolute ${preset.className}`}
            style={style}
          >
            <BillGraphic
              amount={amount}
              billCode={billCode}
              currencySymbol={currencySymbol}
            />
          </div>
        );
      })}

      {coinPresets.map((preset) => {
        const style = {
          "--coin-scale": preset.scale,
          animationDelay: preset.delay,
          animationDuration: preset.duration,
          left: preset.left,
          top: preset.top,
        } as CSSProperties;

        return (
          <div
            key={`coin-${preset.left}-${preset.top}`}
            className={`money-rain-coin absolute ${preset.className}`}
            style={style}
          >
            <CoinGraphic currencySymbol={currencySymbol} />
          </div>
        );
      })}

      <style jsx>{`
        .money-rain-bill,
        .money-rain-coin {
          animation-iteration-count: infinite;
          animation-timing-function: linear;
          will-change: opacity, transform;
        }

        .money-rain-bill {
          animation-name: money-rain-bill;
          filter: saturate(1.08);
        }

        .money-rain-coin {
          animation-name: money-rain-coin;
        }

        .money-rain-bill :global(svg) {
          transform: rotate(var(--bill-rotate)) scale(var(--bill-scale));
        }

        .money-rain-coin :global(svg) {
          transform: scale(var(--coin-scale));
        }

        @keyframes money-rain-bill {
          0% {
            opacity: 0;
            transform: translate3d(0, -15vh, 0);
          }

          10% {
            opacity: 0.86;
          }

          55% {
            opacity: 0.98;
            transform: translate3d(18px, 19vh, 0);
          }

          100% {
            opacity: 0;
            transform: translate3d(-20px, 43vh, 0);
          }
        }

        @keyframes money-rain-coin {
          0% {
            opacity: 0;
            transform: translate3d(0, -12vh, 0) rotate(0deg);
          }

          14% {
            opacity: 0.9;
          }

          60% {
            opacity: 0.98;
            transform: translate3d(10px, 20vh, 0) rotate(120deg);
          }

          100% {
            opacity: 0;
            transform: translate3d(-8px, 38vh, 0) rotate(220deg);
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .money-rain-bill,
          .money-rain-coin {
            animation: none;
            opacity: 0.18;
            transform: none;
          }
        }
      `}</style>
    </div>
  );
}

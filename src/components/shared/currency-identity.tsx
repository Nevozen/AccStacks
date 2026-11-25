import { currencyDetails, type Currency } from "@/lib/money";

function CurrencyFlag({ currency }: { currency: Currency }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 26 18"
      className="h-[18px] w-[26px] shrink-0 rounded-[3px] ring-1 ring-foreground/10"
    >
      <path fill="white" d="M0 0h26v18H0z" />
      {currency === "IDR" ? (
        <path fill="#ce2134" d="M0 0h26v9H0z" />
      ) : (
        <>
          <path
            stroke="#b63242"
            strokeWidth="1.38"
            d="M0 .69h26m-26 2.77h26m-26 2.77h26m-26 2.77h26m-26 2.77h26m-26 2.77h26m-26 2.77h26"
          />
          <path fill="#283963" d="M0 0h11v9.69H0z" />
          <path
            stroke="white"
            strokeWidth="1.1"
            strokeLinecap="round"
            strokeDasharray=".1 2.7"
            d="M2 2.1h8M2 4.8h8M2 7.5h8"
          />
        </>
      )}
    </svg>
  );
}

export function CurrencyIdentity({ currency }: { currency: Currency }) {
  const { name, region, symbol } = currencyDetails[currency];
  return (
    <span className="flex min-w-0 items-center gap-3">
      <span
        aria-hidden="true"
        className="grid size-9 shrink-0 place-items-center rounded-lg bg-accent text-sm font-semibold text-accent-foreground"
      >
        {symbol}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-semibold">{name}</span>
        <span className="mt-0.5 block font-mono text-xs text-muted-foreground">
          {currency} / {region}
        </span>
      </span>
      <CurrencyFlag currency={currency} />
    </span>
  );
}

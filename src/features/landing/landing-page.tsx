import Link from "next/link";
import {
  ArrowDown,
  ArrowRight,
  ArrowUpRight,
  ChartNoAxesCombined,
  Layers3,
  LockKeyhole,
  PackagePlus,
  ReceiptText,
  Store,
  Wallet,
} from "lucide-react";
import { PublicBrand } from "@/components/layout/public-brand";
import { calculateNetProfit } from "@/lib/finance";
import { formatMoney } from "@/lib/money";
import { HeroContours } from "./hero-contours";
import styles from "./landing.module.css";

const workflow = [
  {
    title: "Add stock",
    description: "Log a purchased account and what you paid for it.",
    icon: PackagePlus,
  },
  {
    title: "Track listings",
    description: "Attach each marketplace listing and its asking price to the same account.",
    icon: Store,
  },
  {
    title: "Record a sale",
    description: "Enter the final price and fees. AccStacks closes your other listing records.",
    icon: ReceiptText,
  },
  {
    title: "Review profit",
    description: "See net profit, margins, and how sales change over time.",
    icon: ChartNoAxesCombined,
  },
];

const features = [
  {
    title: "One stock record, many listings",
    description: "Track the same account across different marketplaces without duplicating it.",
    icon: Layers3,
  },
  {
    title: "Real profit, not asking prices",
    description:
      "Keep estimated profits apart from completed sales, with fees accounted for in IDR.",
    icon: Wallet,
  },
  {
    title: "A private workspace",
    description: "Your inventory, sales, and financial reports stay behind your sign-in.",
    icon: LockKeyhole,
  },
];

function SalePreview() {
  const sellingPrice = 800_000n;
  const purchasePrice = 500_000n;
  const fees = 25_000n;
  const netProfit = calculateNetProfit({ sellingPrice, purchasePrice, expenses: [fees] });

  return (
    <figure className={styles.preview}>
      <figcaption className={styles.previewHeader}>
        <span className="inline-flex items-center gap-2 font-semibold">
          <ChartNoAxesCombined className="size-4" aria-hidden="true" />
          Sale breakdown
        </span>
        <span className={styles.sampleLabel}>Sample transaction</span>
      </figcaption>
      <dl className={styles.previewStats}>
        <div>
          <dt>Sale price</dt>
          <dd>{formatMoney(sellingPrice)}</dd>
        </div>
        <div>
          <dt>Purchase cost</dt>
          <dd>{formatMoney(purchasePrice)}</dd>
        </div>
        <div>
          <dt>Fees</dt>
          <dd>{formatMoney(fees)}</dd>
        </div>
        <div className={styles.previewProfit}>
          <dt>
            Net profit <ArrowUpRight className="size-4" aria-hidden="true" />
          </dt>
          <dd>{formatMoney(netProfit)}</dd>
        </div>
      </dl>
    </figure>
  );
}

export function LandingPage({ signedIn }: { signedIn: boolean }) {
  const actionHref = signedIn ? "/overview" : "/register";
  const actionLabel = signedIn ? "Open workspace" : "Create account";

  return (
    <div className={styles.landing}>
      <header className={styles.header}>
        <nav className={`${styles.frame} ${styles.nav}`} aria-label="Primary navigation">
          <PublicBrand />
          <div className={styles.navSections}>
            <a href="#workflow">How it works</a>
            <a href="#features">Features</a>
          </div>
          <div className={styles.navActions}>
            {signedIn ? null : (
              <Link className={styles.signIn} href="/login">
                Sign in
              </Link>
            )}
            <Link className={`${styles.button} ${styles.navButton}`} href={actionHref}>
              {actionLabel}
              <ArrowUpRight className="hidden size-3.5 sm:block" aria-hidden="true" />
            </Link>
          </div>
        </nav>
      </header>

      <main>
        <section className={styles.hero} aria-labelledby="landing-title">
          <HeroContours className={styles.contours} />
          <div className={`${styles.frame} ${styles.heroContent}`}>
            <div className={styles.heroCopy}>
              <h1 id="landing-title">
                Stack accounts. <span>Know your profit.</span>
              </h1>
              <p className={styles.heroDescription}>
                Track stock, marketplace listings, and sales from purchase to payout. See what you
                actually earn after fees.
              </p>
              <div className={styles.heroActions}>
                <Link className={`${styles.button} ${styles.primaryButton}`} href={actionHref}>
                  {actionLabel}
                  <ArrowRight className="size-4" aria-hidden="true" />
                </Link>
                <a className={`${styles.button} ${styles.secondaryButton}`} href="#workflow">
                  See how it works
                  <ArrowDown className="size-4" aria-hidden="true" />
                </a>
              </div>
            </div>
            <SalePreview />
          </div>
        </section>

        <section
          className={`${styles.frame} ${styles.workflow}`}
          id="workflow"
          aria-labelledby="workflow-title"
        >
          <p className={styles.kicker}>01 / The workflow</p>
          <h2 id="workflow-title">One account. One clear trail.</h2>
          <p className={styles.sectionDescription}>
            Follow every account from the day you buy it to the day you close the sale.
          </p>
          <ol className={styles.steps} role="list">
            {workflow.map(({ title, description, icon: Icon }, index) => (
              <li key={title}>
                <div className={styles.stepTop}>
                  <span className={styles.stepIcon}>
                    <Icon className="size-5" aria-hidden="true" />
                  </span>
                  <span className={styles.kicker} aria-hidden="true">
                    0{index + 1}
                  </span>
                </div>
                <h3>{title}</h3>
                <p>{description}</p>
              </li>
            ))}
          </ol>
        </section>

        <section
          className={`${styles.frame} ${styles.features}`}
          id="features"
          aria-labelledby="features-title"
        >
          <div>
            <p className={styles.kicker}>02 / The workspace</p>
            <h2 id="features-title">Sell where you want. Keep the books here.</h2>
            <p className={styles.sectionDescription}>
              AccStacks tracks the listings and sales you record. It doesn&apos;t publish or remove
              ads on external marketplaces.
            </p>
            <Link className={`${styles.button} ${styles.navButton}`} href={actionHref}>
              {actionLabel}
              <ArrowRight className="size-4" aria-hidden="true" />
            </Link>
          </div>
          <ul className={styles.featureList} role="list">
            {features.map(({ title, description, icon: Icon }) => (
              <li key={title}>
                <span className={styles.stepIcon}>
                  <Icon className="size-5" aria-hidden="true" />
                </span>
                <div>
                  <h3>{title}</h3>
                  <p>{description}</p>
                </div>
              </li>
            ))}
          </ul>
        </section>
      </main>

      <footer className={`${styles.frame} ${styles.footer}`}>
        <PublicBrand />
        <p>Private reseller tools by Wardana Dev</p>
      </footer>
    </div>
  );
}

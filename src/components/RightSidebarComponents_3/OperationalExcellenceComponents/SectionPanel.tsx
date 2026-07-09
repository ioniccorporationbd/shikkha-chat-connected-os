"use client";

type Stat = { value: string; label: string };

type SectionPanelProps = {
  id: string;
  pill: string;
  pillStyle?: "solid" | "outline";
  title: string;
  description: string;
  stats?: Stat[];
  quote?: string;
  author?: string;
  role?: string;
  image?: string;
  logo?: string;
  showButtons?: boolean;
  productDetailsText?: string;
  saveProductText?: string;
  activeProductText?: string;
  imageAlt?: string;
};

export default function SectionPanel({
  id,
  pill,
  pillStyle = "outline",
  title,
  description,
  stats = [],
  quote,
  author,
  role,
  image,
  logo,
  showButtons = true,
  productDetailsText = "Product Details",
  saveProductText = "Save Product",
  activeProductText = "Active Product",
  imageAlt,
}: SectionPanelProps) {
  const isSolid = pillStyle === "solid";

  return (
    <aside
      id={id}
      className="relative min-h-screen w-full bg-[var(--color-white)] px-5 py-5 text-[var(--color-black)] sm:px-6 md:px-8 lg:px-9 lg:py-7"
    >
      <div className="sticky top-4 z-30 pb-4 pt-1 sm:top-5">
        <div className="rounded-[24px] bg-[var(--color-white)] p-1.5 shadow-[0_18px_46px_color-mix(in_srgb,var(--color-primary)_14%,transparent)]">
          <div
            className={[
              "group relative flex min-h-[58px] w-full items-center gap-3 overflow-hidden rounded-[20px] border",
              "border-[var(--color-primary)] bg-[var(--color-primary)] px-4 py-3 text-[var(--color-white)]",
              "shadow-[inset_0_0_0_1px_color-mix(in_srgb,var(--color-white)_12%,transparent)]",
              "transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_22px_52px_color-mix(in_srgb,var(--color-primary)_20%,transparent)]",
              "sm:min-h-[62px] sm:px-5",
            ].join(" ")}
          >
            <span className="pointer-events-none absolute -right-10 -top-10 h-28 w-28 rounded-full bg-[var(--color-secondary)] opacity-20 blur-2xl" />
            <span className="pointer-events-none absolute -bottom-12 left-10 h-24 w-24 rounded-full bg-[var(--color-white)] opacity-10 blur-2xl" />

            <span className="relative z-10 grid h-10 w-10 shrink-0 place-items-center rounded-2xl border border-[var(--color-white)] bg-[var(--color-secondary)] text-[15px] font-black text-[var(--color-primary)] shadow-[0_12px_24px_color-mix(in_srgb,var(--color-black)_18%,transparent)] transition duration-300 group-hover:scale-105">
              ✦
            </span>

            <span className="relative z-10 min-w-0 flex-1">
              <span className="block text-[9.5px] font-black uppercase tracking-[0.18em] text-[var(--color-secondary)] sm:text-[10px]">
                {activeProductText}
              </span>

              <span className="mt-0.5 block truncate text-[15px] font-black leading-[1.1] tracking-[-0.025em] text-[var(--color-white)] sm:text-[16px] lg:text-[16.5px]">
                {pill}
              </span>
            </span>

            <span className="relative z-10 hidden h-8 min-w-8 place-items-center rounded-full border border-[var(--color-white)] bg-[var(--color-white)] px-3 text-[12px] font-black text-[var(--color-primary)] sm:grid">
              →
            </span>
          </div>
        </div>
      </div>

      <div className="flex min-h-[calc(100vh-112px)] flex-col justify-center pb-10 pt-8 sm:pt-9">
        <h2 className="max-w-[455px] text-[27px] font-black leading-[1.08] tracking-[-0.045em] text-[var(--color-black)] sm:text-[30px] md:text-[34px]">
          {title}
        </h2>

        <p className="mt-4 max-w-[455px] text-[15px] font-medium leading-[1.65] text-[color-mix(in_srgb,var(--color-black)_78%,var(--color-white))] md:text-[16px]">
          {description}
        </p>

        {showButtons ? (
          <div className="mt-8 flex flex-col items-start gap-4 sm:flex-row sm:flex-wrap sm:items-center">
            <a
              href="#"
              className="inline-flex h-[48px] items-center justify-center gap-3 rounded-lg border border-[var(--color-primary)] bg-[var(--color-white)] px-5 text-[15px] font-black text-[var(--color-primary)] transition-all duration-300 hover:-translate-y-1 hover:bg-[var(--color-primary)] hover:text-[var(--color-white)]"
            >
              <span className="text-[18px]">→</span>
              {productDetailsText}
            </a>
            <button
              type="button"
              className="inline-flex items-center gap-3 text-[15px] font-black text-[var(--color-primary)] transition-all duration-300 hover:translate-x-1 hover:text-[var(--color-black)]"
            >
              <span>☆</span>
              {saveProductText}
            </button>
          </div>
        ) : null}

        {stats.length ? (
          <div className="mt-9 space-y-7">
            {stats.map((stat) => (
              <div key={`${stat.value}-${stat.label}`}>
                <h3 className="text-[44px] font-black leading-none tracking-[-0.06em] text-[var(--color-primary)] md:text-[54px]">
                  {stat.value}
                </h3>
                <p className="mt-2 max-w-[450px] text-[14px] font-black leading-6 text-[var(--color-black)] md:text-[15px]">
                  {stat.label}
                </p>
              </div>
            ))}
          </div>
        ) : null}

        {quote ? (
          <div className="mt-8 overflow-hidden rounded-[18px] bg-[var(--color-secondary)] p-5 shadow-[0_18px_45px_color-mix(in_srgb,var(--color-primary)_14%,transparent)] sm:p-6">
            <p className="text-[17px] font-medium leading-[1.5] text-[var(--color-black)] md:text-[18px]">
              “{quote}”
            </p>
            <div className="relative mt-6 flex min-h-[130px] items-center justify-center overflow-hidden rounded-2xl">
              <div className="absolute inset-0 bg-[radial-gradient(circle,var(--color-primary)_1.25px,transparent_1.25px)] [background-size:17px_17px] opacity-55" />
              <div className="relative z-10 flex flex-col items-center gap-5 sm:flex-row sm:gap-8">
                {image ? (
                  <img
                    src={image}
                    alt={imageAlt || author || "School leader"}
                    className="h-[78px] w-[78px] rounded-2xl object-cover grayscale shadow-[0_12px_28px_color-mix(in_srgb,var(--color-black)_18%,transparent)]"
                  />
                ) : null}
                <div className="flex h-[84px] w-[140px] items-center justify-center rounded-xl bg-[color-mix(in_srgb,var(--color-white)_46%,transparent)] px-4 text-center text-[13px] font-black uppercase leading-tight text-[var(--color-black)]">
                  {logo || "School Logo"}
                </div>
              </div>
            </div>
            {author ? (
              <div className="mt-6">
                <h3 className="text-[16px] font-black text-[var(--color-black)]">
                  {author}
                </h3>
                {role ? (
                  <p className="mt-1 text-[14px] font-medium leading-6 text-[color-mix(in_srgb,var(--color-black)_72%,var(--color-white))]">
                    {role}
                  </p>
                ) : null}
              </div>
            ) : null}
          </div>
        ) : null}
      </div>
    </aside>
  );
}

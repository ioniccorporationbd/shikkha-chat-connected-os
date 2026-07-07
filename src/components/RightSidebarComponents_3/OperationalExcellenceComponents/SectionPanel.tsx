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
  themeColor?: string;
  darkColor?: string;
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
  themeColor = "#ECC6FE",
  darkColor = "#5B1276",
}: SectionPanelProps) {
  const isSolid = pillStyle === "solid";

  return (
    <aside
      id={id}
      className="relative min-h-screen w-full bg-white px-6 py-6 md:px-8 lg:px-9 lg:py-7"
    >
      <div className="sticky top-5 z-30 bg-white/90 pb-4 pt-1 backdrop-blur-xl supports-[backdrop-filter]:bg-white/75">
        <div
          className="group relative flex min-h-[60px] w-full items-center gap-3 overflow-hidden rounded-[22px] border px-5 text-[15px] font-normal leading-[1.15] tracking-[-0.02em] shadow-[0_18px_45px_rgba(15,23,42,0.11)] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_24px_60px_rgba(15,23,42,0.16)]"
          style={{
            borderColor: isSolid ? "transparent" : `${themeColor}88`,
            background: isSolid
              ? `linear-gradient(135deg, ${themeColor}, rgba(255,255,255,0.9))`
              : `linear-gradient(135deg, rgba(255,255,255,0.96), ${themeColor}24)`,
            color: darkColor,
          }}
        >
          <span className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_15%_10%,rgba(255,255,255,0.9),transparent_34%),linear-gradient(120deg,rgba(255,255,255,0.54),transparent_52%)]" />
          <span
            className="relative z-10 grid h-9 w-9 shrink-0 place-items-center rounded-2xl text-[15px] text-white shadow-[0_12px_24px_rgba(15,23,42,0.16)]"
            style={{ background: darkColor }}
          >
            ✦
          </span>
          <span className="relative z-10 min-w-0">
            <span className="block text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-500">
              Active Product
            </span>
            <span className="mt-0.5 block text-[15.5px] font-normal text-[#202833]">
              {pill}
            </span>
          </span>
        </div>
      </div>

      <div className="flex min-h-[calc(100vh-112px)] flex-col justify-center pb-10 pt-9">
        <h2 className="max-w-[455px] text-[28px] font-black leading-[1.08] tracking-[-0.045em] text-[#202833] md:text-[34px]">
          {title}
        </h2>

        <p className="mt-4 max-w-[455px] text-[15px] font-medium leading-[1.65] text-[#202833] md:text-[16px]">
          {description}
        </p>

        {showButtons ? (
          <div className="mt-8 flex flex-col items-start gap-4">
            <a
              href="#"
              className="inline-flex h-[48px] items-center justify-center gap-3 rounded-lg border bg-white px-5 text-[15px] font-black transition-all duration-300 hover:-translate-y-1 hover:text-white"
              style={{ borderColor: darkColor, color: darkColor }}
            >
              <span className="text-[18px]">→</span>
              Product Details
            </a>
            <button
              type="button"
              className="inline-flex items-center gap-3 text-[15px] font-black transition-all duration-300 hover:translate-x-1"
              style={{ color: darkColor }}
            >
              <span>☆</span>
              Save Product
            </button>
          </div>
        ) : null}

        {stats.length ? (
          <div className="mt-9 space-y-7">
            {stats.map((stat) => (
              <div key={stat.value}>
                <h3
                  className="text-[46px] font-black leading-none tracking-[-0.06em] md:text-[54px]"
                  style={{ color: darkColor }}
                >
                  {stat.value}
                </h3>
                <p className="mt-2 max-w-[450px] text-[14px] font-black leading-6 text-[#202833] md:text-[15px]">
                  {stat.label}
                </p>
              </div>
            ))}
          </div>
        ) : null}

        {quote ? (
          <div
            className="mt-8 overflow-hidden rounded-[18px] p-6 shadow-[0_18px_45px_rgba(15,23,42,0.12)]"
            style={{ background: themeColor }}
          >
            <p className="text-[17px] font-medium leading-[1.5] text-[#23140e] md:text-[18px]">
              “{quote}”
            </p>
            <div className="relative mt-6 flex min-h-[130px] items-center justify-center overflow-hidden rounded-2xl">
              <div
                className="absolute inset-0 opacity-55"
                style={{
                  backgroundImage: `radial-gradient(circle, ${darkColor} 1.25px, transparent 1.25px)`,
                  backgroundSize: "17px 17px",
                }}
              />
              <div className="relative z-10 flex items-center gap-8">
                {image ? (
                  <img
                    src={image}
                    alt={author || "School leader"}
                    className="h-[78px] w-[78px] rounded-2xl object-cover grayscale shadow-[0_12px_28px_rgba(0,0,0,0.15)]"
                  />
                ) : null}
                <div className="flex h-[84px] w-[140px] items-center justify-center rounded-xl bg-white/35 px-4 text-center text-[13px] font-black uppercase leading-tight text-[#111827]">
                  {logo || "School Logo"}
                </div>
              </div>
            </div>
            {author ? (
              <div className="mt-6">
                <h3 className="text-[16px] font-black text-black">{author}</h3>
                {role ? (
                  <p className="mt-1 text-[14px] font-medium leading-6 text-[#2f2118]">
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

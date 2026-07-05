"use client";

export default function MiddleSection() {
  return (
    <div className="relative h-screen w-full overflow-hidden bg-[#f7fbff]">
      {/* dotted background */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle,#b8c8d8_1px,transparent_1px)] [background-size:18px_18px] opacity-70" />

      {/* soft glow */}
      <div className="pointer-events-none absolute left-[18%] top-[18%] h-[280px] w-[280px] rounded-full bg-[#ff7438]/10 blur-[90px]" />
      <div className="pointer-events-none absolute bottom-[16%] right-[14%] h-[320px] w-[320px] rounded-full bg-[#0068ff]/10 blur-[100px]" />

      {/* still visual area */}
      <div className="relative flex h-screen items-center justify-center p-10">
        <div className="relative h-[420px] w-[420px] rounded-full border border-dashed border-[#b8c8d8]/60 bg-white/20 backdrop-blur-[1px]">
          <div className="absolute inset-10 rounded-full border border-[#ff7438]/20" />
          <div className="absolute inset-24 rounded-full bg-[#ff7438]/10 blur-xl" />
        </div>
      </div>
    </div>
  );
}
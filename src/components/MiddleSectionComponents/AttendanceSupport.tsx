"use client";

import { FaRegCalendarCheck, FaRegEnvelope, FaRegStar } from "react-icons/fa6";

export default function AttendanceSupport() {
  return (
    <div className="relative flex h-full w-full items-center justify-center px-6">
      {/* background glow */}
      <div className="pointer-events-none absolute left-1/2 top-1/2 h-[520px] w-[520px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#ff7438]/10 blur-[110px]" />

      <div className="relative w-full max-w-[620px]">
        {/* top pill */}
        <div className="mx-auto mb-7 flex w-fit items-center gap-2 rounded-full border border-[#ff7438]/25 bg-white/75 px-5 py-2 text-[12px] font-black uppercase tracking-[0.16em] text-[#ff7438] shadow-[0_14px_34px_rgba(15,23,42,0.06)] backdrop-blur-md">
          <FaRegCalendarCheck className="text-[14px]" />
          Attendance Support
        </div>

        {/* main card */}
        <div className="relative overflow-hidden rounded-[34px] border border-[#ff7438]/25 bg-white/70 p-8 shadow-[0_28px_80px_rgba(15,23,42,0.09)] backdrop-blur-xl">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle,#ff7438_1px,transparent_1px)] [background-size:18px_18px] opacity-[0.14]" />

          <div className="relative z-10">
            <div className="mb-7 grid grid-cols-3 gap-4">
              <div className="rounded-[22px] bg-[#ffd09a] p-5 shadow-[0_14px_30px_rgba(255,116,56,0.18)]">
                <FaRegCalendarCheck className="mb-4 text-[28px] text-[#7a270b]" />
                <h3 className="text-[28px] font-black tracking-[-0.05em] text-[#202833]">
                  600+
                </h3>
                <p className="mt-1 text-[10px] font-bold uppercase leading-4 text-[#7a270b]">
                  Organizations
                </p>
              </div>

              <div className="rounded-[22px] bg-[#eaf4ff] p-5 shadow-[0_14px_30px_rgba(0,104,255,0.1)]">
                <FaRegStar className="mb-4 text-[28px] text-[#0068ff]" />
                <h3 className="text-[28px] font-black tracking-[-0.05em] text-[#202833]">
                  2.2M+
                </h3>
                <p className="mt-1 text-[10px] font-bold uppercase leading-4 text-[#0050c8]">
                  Students
                </p>
              </div>

              <div className="rounded-[22px] bg-white p-5 shadow-[0_14px_30px_rgba(15,23,42,0.08)]">
                <FaRegEnvelope className="mb-4 text-[28px] text-[#ff7438]" />
                <h3 className="text-[28px] font-black tracking-[-0.05em] text-[#202833]">
                  80M+
                </h3>
                <p className="mt-1 text-[10px] font-bold uppercase leading-4 text-slate-600">
                  Messages
                </p>
              </div>
            </div>

            <div className="rounded-[26px] border border-slate-200/70 bg-white/72 p-7">
              <p className="text-[13px] font-black uppercase tracking-[0.18em] text-[#ff7438]">
                Attendance Intelligence
              </p>

              <h2 className="mt-3 max-w-[500px] text-[38px] font-black leading-[1.02] tracking-[-0.06em] text-[#202833]">
                Spot the Signs Early. Step in Sooner.
              </h2>

              <p className="mt-4 max-w-[500px] text-[14px] font-medium leading-7 text-slate-600">
                Detect early attendance patterns, support family outreach, and
                help staff respond before small issues become chronic
                absenteeism problems.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
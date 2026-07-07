"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { motion, Variants } from "framer-motion";

type SectionKey = "orange" | "green" | "purple";

type VisiblePeople = Record<SectionKey, boolean>;

const impactVariants: Variants = {
  hidden: { opacity: 0, scale: 0.94, y: 18, filter: "blur(6px)" },
  visible: { opacity: 1, scale: 1, y: 0, filter: "blur(0px)", transition: { duration: 0.65, ease: [0.22, 1, 0.36, 1] } },
};

const peopleVariants: Variants = {
  hidden: { opacity: 0, scale: 0.78, y: 72, filter: "blur(10px)" },
  visible: {
    opacity: 1,
    scale: [0.78, 1.08, 0.98, 1],
    y: [72, -18, 6, 0],
    filter: "blur(0px)",
    transition: { duration: 1.05, ease: [0.22, 1, 0.36, 1] },
  },
};

const floatVariants: Variants = {
  float: {
    y: [0, -8, 0],
    transition: { duration: 4.8, repeat: Infinity, ease: "easeInOut" },
  },
};

export default function Banner() {
  const [visiblePeople, setVisiblePeople] = useState<VisiblePeople>({
    orange: false,
    green: false,
    purple: false,
  });
  const [pulse, setPulse] = useState<SectionKey | null>(null);

  useEffect(() => {
    const schedule = (section: SectionKey, delay: number) =>
      window.setTimeout(() => {
        setPulse(section);
        window.setTimeout(() => setVisiblePeople((prev) => ({ ...prev, [section]: true })), 220);
        window.setTimeout(() => setPulse(null), 1100);
      }, delay);

    const timers = [schedule("orange", 900), schedule("green", 1350), schedule("purple", 1800)];
    return () => timers.forEach((timer) => window.clearTimeout(timer));
  }, []);

  const impactAnimate = (section: SectionKey): any =>
    pulse === section
      ? {
          opacity: 1,
          scale: [1, 1.08, 0.98, 1.02, 1],
          y: [0, -12, 4, -2, 0],
          filter: "blur(0px)",
          transition: { duration: 1.1, ease: [0.22, 1, 0.36, 1] },
        }
      : {
          opacity: 1,
          scale: 1,
          y: 0,
          filter: "blur(0px)",
          transition: { duration: 0.65, ease: [0.22, 1, 0.36, 1] },
        };

  return (
    <section id="intro" className="relative min-h-[100svh] overflow-hidden bg-[var(--sc-surface)]">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle,#b8c8d8_1px,transparent_1px)] [background-size:18px_18px] opacity-70" />
      <div className="pointer-events-none absolute left-1/2 top-0 h-[300px] w-[760px] -translate-x-1/2 rounded-full bg-[var(--sc-primary)]/10 blur-[120px]" />

      <div className="relative z-10 mx-auto flex min-h-[100svh] max-w-[1540px] flex-col px-4 pb-6 pt-7 md:px-7 lg:px-10">
        <motion.div
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55 }}
          className="mx-auto text-center"
        >
          <p className="mb-2 text-[7px] font-bold uppercase tracking-[0.17em] text-[var(--sc-primary)] md:text-[9px]">
            UNIFY THE HOME, CLASSROOM, AND CENTRAL OFFICE
          </p>
          <h1 className="text-[24px] font-black leading-[1.04] tracking-[-0.05em] text-[var(--sc-primary)] md:text-[38px] lg:text-[48px] xl:text-[54px]">
            The K–12 Connected Operating System
          </h1>
        </motion.div>

        <div className="relative mt-5 flex flex-1 items-center justify-center lg:mt-8">
          <div className="relative h-[560px] w-full max-w-[1420px] md:h-[610px] lg:h-[650px]">
            <motion.div initial={{ opacity: 0, scale: 0.94, y: 18, filter: "blur(6px)" }} animate={impactAnimate("orange")} className="absolute left-[0%] top-[2%] h-[390px] w-[35%] md:h-[430px]">
              <Image src="/Banner-imaes/orange-impact.png" alt="Home Connections" fill priority className="object-contain object-top" />
            </motion.div>
            <motion.div variants={peopleVariants} initial="hidden" animate={visiblePeople.orange ? "visible" : "hidden"} className="absolute bottom-[5%] left-[1%] h-[350px] w-[28%] md:h-[430px]">
              <motion.div variants={floatVariants} animate={visiblePeople.orange ? "float" : undefined} className="relative h-full w-full">
                <Image src="/Banner-imaes/orange-people.png" alt="Home Connections people" fill priority className="object-contain object-bottom drop-shadow-[0_22px_18px_rgba(15,23,42,0.16)]" />
              </motion.div>
            </motion.div>

            <motion.div initial={{ opacity: 0, scale: 0.94, y: 18, filter: "blur(6px)" }} animate={impactAnimate("green")} className="absolute left-1/2 top-[2%] h-[360px] w-[34%] -translate-x-1/2 md:h-[395px]">
              <Image src="/Banner-imaes/green-impact.png" alt="Student Achievement" fill priority className="object-contain object-top" />
            </motion.div>
            <motion.div variants={peopleVariants} initial="hidden" animate={visiblePeople.green ? "visible" : "hidden"} className="absolute bottom-[4%] left-1/2 h-[380px] w-[20%] -translate-x-1/2 md:h-[455px]">
              <motion.div variants={floatVariants} animate={visiblePeople.green ? "float" : undefined} className="relative h-full w-full">
                <Image src="/Banner-imaes/green-people.png" alt="Student Achievement person" fill priority className="object-contain object-bottom drop-shadow-[0_22px_18px_rgba(15,23,42,0.16)]" />
              </motion.div>
            </motion.div>

            <motion.div initial={{ opacity: 0, scale: 0.94, y: 18, filter: "blur(6px)" }} animate={impactAnimate("purple")} className="absolute right-[0%] top-[2%] h-[395px] w-[35%] md:h-[440px]">
              <Image src="/Banner-imaes/purple-impact.png" alt="Operational Excellence" fill priority className="object-contain object-top" />
            </motion.div>
            <motion.div variants={peopleVariants} initial="hidden" animate={visiblePeople.purple ? "visible" : "hidden"} className="absolute bottom-[4%] right-[5%] h-[350px] w-[26%] md:h-[430px]">
              <motion.div variants={floatVariants} animate={visiblePeople.purple ? "float" : undefined} className="relative h-full w-full">
                <Image src="/Banner-imaes/purple-people.png" alt="Operational Excellence people" fill priority className="object-contain object-bottom drop-shadow-[0_22px_18px_rgba(15,23,42,0.16)]" />
              </motion.div>
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
}

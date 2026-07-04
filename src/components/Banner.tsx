"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { FaArrowDownLong } from "react-icons/fa6";
import { motion, Variants } from "framer-motion";

type SectionKey = "orange" | "green" | "purple";

type VisiblePeople = {
  orange: boolean;
  green: boolean;
  purple: boolean;
};

type ActivePulse = SectionKey | null;

const impactVariants: Variants = {
  hidden: {
    opacity: 0,
    scale: 0.9,
    y: 22,
    filter: "blur(8px)",
  },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    filter: "blur(0px)",
    transition: {
      duration: 0.7,
      ease: [0.22, 1, 0.36, 1],
    },
  },
};

const peopleVariants: Variants = {
  hidden: {
    opacity: 0,
    scale: 0.72,
    y: 90,
    rotateX: 12,
    filter: "blur(12px)",
  },
  visible: {
    opacity: 1,
    scale: [0.72, 1.14, 0.95, 1.04, 1],
    y: [90, -30, 12, -7, 0],
    rotateX: [12, 0, 0, 0, 0],
    filter: "blur(0px)",
    transition: {
      duration: 1.25,
      ease: [0.22, 1, 0.36, 1],
    },
  },
};

const peopleFloat: Variants = {
  float: {
    y: [0, -9, 0],
    scale: [1, 1.008, 1],
    transition: {
      duration: 4.8,
      repeat: Infinity,
      ease: "easeInOut",
    },
  },
};

export default function Banner() {
  const [visiblePeople, setVisiblePeople] = useState<VisiblePeople>({
    orange: false,
    green: false,
    purple: false,
  });

  const [activePulse, setActivePulse] = useState<ActivePulse>(null);

  useEffect(() => {
    const playSection = (section: SectionKey, delay: number) => {
      const startTimer = window.setTimeout(() => {
        setActivePulse(section);

        window.setTimeout(() => {
          setVisiblePeople((prev) => ({
            ...prev,
            [section]: true,
          }));
        }, 280);

        window.setTimeout(() => {
          setActivePulse(null);
        }, 1350);
      }, delay);

      return startTimer;
    };

    const orangeTimer = playSection("orange", 3000);
    const greenTimer = playSection("green", 3950);
    const purpleTimer = playSection("purple", 4900);

    return () => {
      window.clearTimeout(orangeTimer);
      window.clearTimeout(greenTimer);
      window.clearTimeout(purpleTimer);
    };
  }, []);

  const getImpactPulse = (section: SectionKey) => {
    if (activePulse !== section) return {};

    return {
      scale: [1, 1.12, 0.96, 1.04, 1],
      y: [0, -18, 8, -4, 0],
      filter: [
        "drop-shadow(0 0 0 rgba(0,104,255,0))",
        "drop-shadow(0 24px 34px rgba(0,104,255,0.18))",
        "drop-shadow(0 10px 20px rgba(0,104,255,0.1))",
        "drop-shadow(0 18px 28px rgba(0,104,255,0.15))",
        "drop-shadow(0 0 0 rgba(0,104,255,0))",
      ],
      transition: {
        duration: 1.25,
        ease: [0.22, 1, 0.36, 1],
      },
    };
  };

  return (
    <section className="relative min-h-screen overflow-hidden bg-[#f8fbff]">
      <style jsx>{`
        @keyframes arrowJump {
          0%,
          100% {
            transform: translateY(0);
          }

          10% {
            transform: translateY(-14px);
          }

          20% {
            transform: translateY(0);
          }

          30% {
            transform: translateY(-8px);
          }

          40% {
            transform: translateY(0);
          }
        }

        @keyframes arrowRing {
          0% {
            opacity: 0.55;
            transform: scale(0.86);
          }

          70% {
            opacity: 0;
            transform: scale(1.45);
          }

          100% {
            opacity: 0;
            transform: scale(1.45);
          }
        }

        .arrow-jump {
          animation: arrowJump 2s ease-in-out infinite;
        }

        .arrow-ring {
          animation: arrowRing 2s ease-in-out infinite;
        }
      `}</style>

      {/* dotted background */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle,#b8c8d8_1px,transparent_1px)] [background-size:18px_18px] opacity-70" />

      {/* soft blue light */}
      <motion.div
        initial={{ opacity: 0, scale: 0.85 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
        className="pointer-events-none absolute left-1/2 top-0 h-[280px] w-[760px] -translate-x-1/2 rounded-full bg-[#0068ff]/10 blur-[120px]"
      />

      <div className="relative z-10 mx-auto flex min-h-screen max-w-[1600px] flex-col px-5 pb-8 pt-7 lg:px-10">
        {/* header text small */}
        <motion.div
          initial={{ opacity: 0, y: -14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
          className="mx-auto text-center"
        >
          <p className="mb-2 text-[7px] font-semibold uppercase tracking-[0.17em] text-[#111827] md:text-[8px] lg:text-[9px]">
            UNIFY THE HOME, CLASSROOM, AND CENTRAL OFFICE
          </p>

          <h1 className="text-[22px] font-extrabold leading-[1.05] tracking-[-0.045em] text-[#0068ff] md:text-[34px] lg:text-[43px] xl:text-[48px]">
            The K–12 Connected Operating System
          </h1>
        </motion.div>

        {/* banner visual */}
        <div className="relative mt-6 flex flex-1 items-center justify-center lg:mt-9">
          <div className="relative h-[650px] w-full max-w-[1500px]">
            {/* Orange impact/background */}
            <motion.div
              variants={impactVariants}
              initial="hidden"
              animate={{
                ...impactVariants.visible,
                ...getImpactPulse("orange"),
              }}
              className="absolute left-[0%] top-[2%] h-[430px] w-[34%]"
            >
              <Image
                src="/Banner-imaes/orange-impact.png"
                alt="Home Connections"
                fill
                priority
                className="object-contain object-top"
              />
            </motion.div>

            {/* Orange people */}
            <motion.div
              variants={peopleVariants}
              initial="hidden"
              animate={visiblePeople.orange ? "visible" : "hidden"}
              className="absolute bottom-[1%] left-[1%] h-[430px] w-[27%]"
            >
              <motion.div
                variants={peopleFloat}
                animate={visiblePeople.orange ? "float" : undefined}
                className="relative h-full w-full"
              >
                <Image
                  src="/Banner-imaes/orange-people.png"
                  alt="Home Connections People"
                  fill
                  priority
                  className="object-contain object-bottom drop-shadow-[0_24px_18px_rgba(15,23,42,0.18)]"
                />
              </motion.div>
            </motion.div>

            {/* Green impact/background */}
            <motion.div
              variants={impactVariants}
              initial="hidden"
              animate={{
                ...impactVariants.visible,
                ...getImpactPulse("green"),
              }}
              className="absolute left-1/2 top-[2%] h-[395px] w-[34%] -translate-x-1/2"
            >
              <Image
                src="/Banner-imaes/green-impact.png"
                alt="Student Achievement"
                fill
                priority
                className="object-contain object-top"
              />
            </motion.div>

            {/* Green people */}
            <motion.div
              variants={peopleVariants}
              initial="hidden"
              animate={visiblePeople.green ? "visible" : "hidden"}
              className="absolute bottom-[0%] left-1/2 h-[455px] w-[20%] -translate-x-1/2"
            >
              <motion.div
                variants={peopleFloat}
                animate={visiblePeople.green ? "float" : undefined}
                className="relative h-full w-full"
              >
                <Image
                  src="/Banner-imaes/green-people.png"
                  alt="Student Achievement People"
                  fill
                  priority
                  className="object-contain object-bottom drop-shadow-[0_24px_18px_rgba(15,23,42,0.18)]"
                />
              </motion.div>
            </motion.div>

            {/* Purple impact/background */}
            <motion.div
              variants={impactVariants}
              initial="hidden"
              animate={{
                ...impactVariants.visible,
                ...getImpactPulse("purple"),
              }}
              className="absolute right-[0%] top-[2%] h-[440px] w-[34%]"
            >
              <Image
                src="/Banner-imaes/purple-impact.png"
                alt="Operational Excellence"
                fill
                priority
                className="object-contain object-top"
              />
            </motion.div>

            {/* Purple people */}
            <motion.div
              variants={peopleVariants}
              initial="hidden"
              animate={visiblePeople.purple ? "visible" : "hidden"}
              className="absolute bottom-[0%] right-[6%] h-[430px] w-[25%]"
            >
              <motion.div
                variants={peopleFloat}
                animate={visiblePeople.purple ? "float" : undefined}
                className="relative h-full w-full"
              >
                <Image
                  src="/Banner-imaes/purple-people.png"
                  alt="Operational Excellence People"
                  fill
                  priority
                  className="object-contain object-bottom drop-shadow-[0_24px_18px_rgba(15,23,42,0.18)]"
                />
              </motion.div>
            </motion.div>
          </div>
        </div>

        {/* interactive arrow with react icon */}
        <div className="relative z-20 flex justify-center pb-3">
          <a
            href="#my-connected-os"
            aria-label="Scroll down"
            className="arrow-jump group relative flex h-[56px] w-[56px] items-center justify-center rounded-full border border-[#0068ff]/15 bg-white/90 text-[#0068ff] shadow-[0_18px_42px_rgba(0,104,255,0.24)] backdrop-blur-xl transition-all duration-500 hover:scale-110 hover:bg-[#0068ff] hover:text-white hover:shadow-[0_28px_65px_rgba(0,104,255,0.36)]"
          >
            <span className="arrow-ring absolute inset-0 rounded-full border border-[#0068ff]/25" />
            <span className="arrow-ring absolute inset-[-10px] rounded-full border border-[#0068ff]/15 [animation-delay:0.35s]" />

            <FaArrowDownLong className="relative z-10 text-[22px] transition-transform duration-500 group-hover:translate-y-1" />

            <span className="absolute bottom-[8px] h-[5px] w-[18px] rounded-full bg-[#0068ff]/18 blur-[2px] transition-all duration-500 group-hover:bg-white/30" />
          </a>
        </div>
      </div>
    </section>
  );
}
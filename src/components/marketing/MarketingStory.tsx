"use client";

import { useMemo, useState } from "react";
import { motion, type Variants } from "framer-motion";
import {
  MdAdd,
  MdArrowForward,
  MdContentCopy,
  MdOutlineAccountTree,
  MdOutlineBarChart,
  MdOutlineCastForEducation,
  MdOutlineChat,
  MdOutlineDashboard,
  MdOutlineForum,
  MdOutlineGroups,
  MdOutlineHub,
  MdOutlineMenuBook,
  MdOutlinePublic,
  MdOutlineSchedule,
  MdOutlineSchool,
  MdOutlineStorage,
  MdOutlineTune,
  MdRemove,
  MdShield,
  MdTrendingUp,
  MdVerified,
} from "react-icons/md";
import { FaGraduationCap } from "react-icons/fa6";
import { useLanguage } from "@/lib/i18n/LanguageProvider";

type Lang = "bn" | "en";

const revealParent: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.07 } },
};

const revealItem: Variants = {
  hidden: { opacity: 0, y: 26 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.62, ease: [0.22, 1, 0.36, 1] },
  },
};

const COPY: Record<Lang, {
  problem: {
    eyebrow: string;
    title: string;
    lead: string;
    items: { title: string; body: string }[];
    closing: string;
  };
  solution: {
    eyebrow: string;
    title: string;
    lead: string;
    pillars: { title: string; body: string }[];
  };
  features: {
    eyebrow: string;
    title: string;
    lead: string;
    items: { title: string; body: string }[];
  };
  audiences: {
    eyebrow: string;
    title: string;
    lead: string;
    items: { title: string; body: string }[];
  };
  why: {
    eyebrow: string;
    title: string;
    lead: string;
    items: { title: string; body: string }[];
  };
  how: {
    eyebrow: string;
    title: string;
    lead: string;
    steps: { title: string; body: string }[];
  };
  faq: {
    eyebrow: string;
    title: string;
    lead: string;
    items: { q: string; a: string }[];
  };
  cta: {
    eyebrow: string;
    title: string;
    lead: string;
    primary: string;
    secondary: string;
    formTitle: string;
    formLead: string;
    fields: {
      name: string;
      institution: string;
      type: string;
      mobile: string;
      email: string;
      district: string;
      students: string;
      message: string;
    };
    typeOptions: string[];
    submit: string;
    sent: string;
  };
}> = {
  bn: {
    problem: {
      eyebrow: "সমস্যা",
      title: "আপনার শিক্ষা প্রতিষ্ঠানের তথ্য কি এখনো বিভিন্ন জায়গায় ছড়িয়ে আছে?",
      lead:
        "Student information এক জায়গায়, employee information অন্য জায়গায়, attendance register কাগজে, notice Facebook বা Messenger-এ, accounts Excel-এ, আর website আবার আলাদা। এই fragmented process institution management-কে অপ্রয়োজনীয়ভাবে জটিল করে তোলে।",
      items: [
        { title: "ছড়িয়ে থাকা তথ্য", body: "একই প্রতিষ্ঠানের বিভিন্ন তথ্য বিভিন্ন জায়গায় থাকে।" },
        { title: "ডুপ্লিকেট কাজ", body: "একই তথ্য একাধিক জায়গায় লিখতে হয়।" },
        { title: "রিপোর্টিং সমস্যা", body: "প্রয়োজনের সময় accurate report তৈরি করা কঠিন হয়ে পড়ে।" },
        { title: "যোগাযোগের দূরত্ব", body: "Administrator, staff, student ও guardian-এর মধ্যে timely information flow বাধাগ্রস্ত হয়।" },
        { title: "নিরাপত্তা ঝুঁকি", body: "কে কোন তথ্য দেখতে বা পরিবর্তন করতে পারবে তা নিয়ন্ত্রণ কঠিন।" },
        { title: "ম্যানুয়াল নির্ভরতা", body: "একজন নির্দিষ্ট employee অনুপস্থিত থাকলে গুরুত্বপূর্ণ কাজ বন্ধ হয়ে যেতে পারে।" },
      ],
      closing: "শিক্ষা চ্যাট সবকিছুকে একটি connected digital ecosystem-এর মধ্যে আনার জন্য তৈরি।",
    },
    solution: {
      eyebrow: "সমাধান",
      title: "One Institution. One Connected System.",
      lead:
        "শিক্ষা চ্যাট একটি centralized digital platform তৈরি করে যেখানে institution-এর users, operations এবং data organisedভাবে পরিচালিত হতে পারে — একটি প্রতিষ্ঠান, একটি সংযুক্ত ব্যবস্থা, কিন্তু প্রত্যেকের জন্য আলাদা role-based অভিজ্ঞতা।",
      pillars: [
        { title: "Role-Based Experience", body: "Admin, staff ও user প্রত্যেকে তার কাজ অনুযায়ী আলাদা interface পায়।" },
        { title: "Centralized Information", body: "গুরুত্বপূর্ণ তথ্য fragmented না হয়ে এক জায়গায় সংরক্ষিত থাকে।" },
        { title: "ERP-Backed Architecture", body: "শক্তিশালী enterprise-grade data management ভিত্তি।" },
      ],
    },
    features: {
      eyebrow: "ফিচার",
      title: "আপনার প্রতিষ্ঠানের দৈনন্দিন কাজের জন্য সংযুক্ত ফিচার",
      lead: "একটি প্রতিষ্ঠান। একটি Platform। Connected Management — সবকিছু একসাথে।",
      items: [
        { title: "Smart Dashboard", body: "গুরুত্বপূর্ণ operation ও information একটি organised dashboard থেকে access করুন।" },
        { title: "Secure User Access", body: "প্রত্যেক user-এর জন্য role-based এবং authenticated access।" },
        { title: "Employee Attendance", body: "Digital check-in/check-out workflow দিয়ে employee attendance manage করুন।" },
        { title: "User Management", body: "প্রতিষ্ঠানের প্রয়োজন অনুযায়ী user ও profile manage করুন।" },
        { title: "Communication Ready", body: "SMS, email এবং portal-based communication integration-এর জন্য প্রস্তুত architecture।" },
        { title: "Customizable", body: "আপনার institution-এর process অনুযায়ী system customize করুন।" },
      ],
    },
    audiences: {
      eyebrow: "কাদের জন্য",
      title: "সব ধরনের শিক্ষা প্রতিষ্ঠানের জন্য তৈরি",
      lead: "Primary school থেকে training institute পর্যন্ত — প্রতিটি প্রতিষ্ঠানের প্রয়োজন আলাদা, platform উভয়কেই মানিয়ে নিতে পারে।",
      items: [
        { title: "School", body: "Primary, secondary ও higher secondary institution।" },
        { title: "College", body: "Academic ও administrative operation manage করার জন্য।" },
        { title: "Madrasa", body: "General অথবা specialized madrasa management-এর জন্য।" },
        { title: "Coaching Centre", body: "Student, fees, batch ও administrative management-এর জন্য।" },
        { title: "Training Institute", body: "Learner ও course administration-এর জন্য।" },
        { title: "Technical Institute", body: "Student, employee ও operational management-এর জন্য।" },
        { title: "Educational Organization", body: "Multiple programs অথবা branches পরিচালনাকারী organization-এর জন্য।" },
      ],
    },
    why: {
      eyebrow: "কেন শিক্ষা চ্যাট",
      title: "কেন Shikkha Chat?",
      lead: "শুধু সুন্দর interface যথেষ্ট নয় — প্রতিষ্ঠানের software-এ প্রয়োজন reliable data, simple workflow, সঠিক permission এবং নিরাপদ login।",
      items: [
        { title: "Built for Real Operations", body: "শুধু static website নয় — daily operational workflow-এর জন্য design করা।" },
        { title: "Role-Based Experience", body: "প্রত্যেক user তার কাজ অনুযায়ী interface পেতে পারে।" },
        { title: "Centralized Information", body: "গুরুত্বপূর্ণ information এক জায়গায় রাখা যায়।" },
        { title: "Flexible & Customizable", body: "প্রতিষ্ঠানের workflow অনুযায়ী feature customize করার সুযোগ।" },
        { title: "ERP-Backed Architecture", body: "Powerful enterprise data management foundation।" },
        { title: "Secure Authentication", body: "OTP এবং authenticated user workflow।" },
      ],
    },
    how: {
      eyebrow: "কিভাবে কাজ করে",
      title: "কিভাবে কাজ করে",
      lead: "Institution consultation থেকে go-live পর্যন্ত — একটি স্পষ্ট, ধাপে ধাপে প্রক্রিয়া।",
      steps: [
        { title: "Institution Consultation", body: "প্রতিষ্ঠানের বর্তমান workflow এবং প্রয়োজন বোঝা হয়।" },
        { title: "System Configuration", body: "Institution অনুযায়ী modules এবং access configure করা হয়।" },
        { title: "Data Setup", body: "প্রয়োজনীয় organizational information system-এ setup করা হয়।" },
        { title: "User Setup", body: "Administrator, employees এবং প্রয়োজনীয় users create করা হয়।" },
        { title: "Training", body: "Relevant users-কে system ব্যবহার শেখানো হয়।" },
        { title: "Go Live", body: "Institution real operation-এ platform ব্যবহার শুরু করে।" },
        { title: "Support & Improvement", body: "প্রয়োজন অনুযায়ী configuration, support এবং enhancement দেওয়া হয়।" },
      ],
    },
    faq: {
      eyebrow: "FAQ",
      title: "সাধারণ জিজ্ঞাসা",
      lead: "Shikkha Chat সম্পর্কে সবচেয়ে বেশি জিজ্ঞাসিত প্রশ্নগুলোর উত্তর।",
      items: [
        { q: "Shikkha Chat কী?", a: "Shikkha Chat একটি web-based education institution management platform যা বিভিন্ন administrative ও digital operation একটি connected system-এর মধ্যে পরিচালনা করতে সাহায্য করে।" },
        { q: "কোন ধরনের প্রতিষ্ঠান Shikkha Chat ব্যবহার করতে পারে?", a: "School, college, madrasa, coaching centre, training institute এবং অন্যান্য educational organization।" },
        { q: "Software install করতে হবে?", a: "Platform web-based হওয়ায় supported browser থেকে ব্যবহার করা যায় — আলাদা install লাগে না।" },
        { q: "আলাদা user-এর আলাদা permission দেওয়া যাবে?", a: "হ্যাঁ। Platformটি role-based user access architecture সমর্থন করে।" },
        { q: "Employee attendance নেওয়া যাবে?", a: "বর্তমান system-এ Employee Check-In/Check-Out workflow রয়েছে।" },
        { q: "আমাদের প্রয়োজন অনুযায়ী feature পরিবর্তন করা যাবে?", a: "Shikkha Chat customizable architecture-এর উপর তৈরি, তাই project scope অনুযায়ী configuration ও customization করা সম্ভব।" },
        { q: "Mobile থেকে ব্যবহার করা যাবে?", a: "Interface responsive web design-এর মাধ্যমে mobile, tablet এবং desktop experience-এর জন্য তৈরি।" },
        { q: "Demo পাওয়া যাবে?", a: "হ্যাঁ। Institution-এর requirement বুঝে product demonstration দেওয়া যেতে পারে।" },
      ],
    },
    cta: {
      eyebrow: "পরবর্তী পদক্ষেপ",
      title: "আপনার শিক্ষা প্রতিষ্ঠানকে Digital করার পরবর্তী পদক্ষেপ নিন",
      lead: "Shikkha Chat কীভাবে আপনার institution-এর daily operation simplify করতে পারে তা একটি live demonstration-এর মাধ্যমে দেখুন।",
      primary: "ডেমো রিকোয়েস্ট করুন",
      secondary: "আমাদের টিমের সাথে কথা বলুন",
      formTitle: "Demo রিকোয়েস্ট করুন",
      formLead: "ফর্মটি পূরণ করুন — আমাদের টিম আপনার প্রতিষ্ঠানের প্রয়োজন বুঝে যোগাযোগ করবে।",
      fields: {
        name: "নাম",
        institution: "প্রতিষ্ঠানের নাম",
        type: "প্রতিষ্ঠানের ধরন",
        mobile: "মোবাইল নম্বর",
        email: "ইমেইল",
        district: "জেলা",
        students: "শিক্ষার্থী সংখ্যা",
        message: "বার্তা",
      },
      typeOptions: ["School", "College", "Madrasa", "Coaching Centre", "Training Institute", "Technical Institute", "অন্যান্য"],
      submit: "Request My Demo",
      sent: "ধন্যবাদ! আপনার ডেমো রিকোয়েস্ট আমরা পেয়েছি — আমাদের টিম শীঘ্রই যোগাযোগ করবে।",
    },
  },
  en: {
    problem: {
      eyebrow: "The Problem",
      title: "Is your institution’s information still scattered everywhere?",
      lead:
        "Student information in one place, employee records somewhere else, attendance on paper registers, notices on Facebook or Messenger, accounts in Excel, and a website that is separate again. This fragmented process makes institution management needlessly complex.",
      items: [
        { title: "Scattered information", body: "The same institution’s data lives in many different places." },
        { title: "Duplicate work", body: "The same information has to be written down more than once." },
        { title: "Reporting gaps", body: "Building an accurate report when management needs it is hard." },
        { title: "Communication gaps", body: "Timely information flow between admin, staff, students and guardians breaks down." },
        { title: "Security risk", body: "Controlling who can view or change which data is difficult." },
        { title: "Manual dependency", body: "If one employee is absent, a critical operation can stop." },
      ],
      closing: "Shikkha Chat exists to bring all of this into one connected digital ecosystem.",
    },
    solution: {
      eyebrow: "The Solution",
      title: "One Institution. One Connected System.",
      lead:
        "Shikkha Chat builds a centralized digital platform where an institution’s users, operations and data are managed in an organized way — one institution, one connected system, yet a distinct role-based experience for everyone.",
      pillars: [
        { title: "Role-Based Experience", body: "Admins, staff and users each get an interface shaped around their work." },
        { title: "Centralized Information", body: "Important information is stored in one place instead of being fragmented." },
        { title: "ERP-Backed Architecture", body: "A powerful, enterprise-grade data management foundation." },
      ],
    },
    features: {
      eyebrow: "Features",
      title: "Connected features for your institution’s daily work",
      lead: "One institution. One platform. Connected management — everything together.",
      items: [
        { title: "Smart Dashboard", body: "Access important operations and information from one organized dashboard." },
        { title: "Secure User Access", body: "Role-based and authenticated access for every user." },
        { title: "Employee Attendance", body: "Manage employee attendance with a digital check-in/check-out workflow." },
        { title: "User Management", body: "Create and manage the users and profiles your institution needs." },
        { title: "Communication Ready", body: "Architecture ready for SMS, email and portal-based communication." },
        { title: "Customizable", body: "Customize the system around your institution’s processes." },
      ],
    },
    audiences: {
      eyebrow: "Who It’s For",
      title: "Built for every kind of education institution",
      lead: "From primary schools to training institutes — every institution is different, and the platform adapts to each.",
      items: [
        { title: "School", body: "Primary, secondary and higher secondary institutions." },
        { title: "College", body: "For managing academic and administrative operations." },
        { title: "Madrasa", body: "For general or specialized madrasa management." },
        { title: "Coaching Centre", body: "For student, fees, batch and administrative management." },
        { title: "Training Institute", body: "For learner and course administration." },
        { title: "Technical Institute", body: "For student, employee and operational management." },
        { title: "Educational Organization", body: "For organizations running multiple programs or branches." },
      ],
    },
    why: {
      eyebrow: "Why Shikkha Chat",
      title: "Why Shikkha Chat?",
      lead: "A polished interface is not enough — an institution needs reliable data, simple workflows, the right permissions and secure login.",
      items: [
        { title: "Built for Real Operations", body: "Not just a static website — designed for daily operational workflows." },
        { title: "Role-Based Experience", body: "Every user gets an interface based on their role." },
        { title: "Centralized Information", body: "Keep important information in one place." },
        { title: "Flexible & Customizable", body: "Room to customize features around your workflow." },
        { title: "ERP-Backed Architecture", body: "A powerful enterprise data management foundation." },
        { title: "Secure Authentication", body: "OTP and an authenticated user workflow." },
      ],
    },
    how: {
      eyebrow: "How It Works",
      title: "How it works",
      lead: "From institution consultation to go-live — a clear, step-by-step process.",
      steps: [
        { title: "Institution Consultation", body: "We understand your institution’s current workflow and needs." },
        { title: "System Configuration", body: "Modules and access are configured for your institution." },
        { title: "Data Setup", body: "The required organizational information is set up in the system." },
        { title: "User Setup", body: "Administrators, employees and the necessary users are created." },
        { title: "Training", body: "Relevant users are trained to use the system." },
        { title: "Go Live", body: "Your institution starts using the platform in real operations." },
        { title: "Support & Improvement", body: "Configuration, support and enhancements are provided as needed." },
      ],
    },
    faq: {
      eyebrow: "FAQ",
      title: "Frequently asked questions",
      lead: "Answers to the questions we hear most about Shikkha Chat.",
      items: [
        { q: "What is Shikkha Chat?", a: "Shikkha Chat is a web-based education institution management platform that helps you run administrative and digital operations inside one connected system." },
        { q: "Which institutions can use Shikkha Chat?", a: "Schools, colleges, madrasas, coaching centres, training institutes and other educational organizations." },
        { q: "Do we need to install software?", a: "The platform is web-based, so it can be used from a supported browser — no separate installation needed." },
        { q: "Can different users have different permissions?", a: "Yes. The platform supports a role-based user access architecture." },
        { q: "Can we track employee attendance?", a: "The current system includes an Employee Check-In/Check-Out workflow." },
        { q: "Can features be changed to fit our needs?", a: "Shikkha Chat is built on a customizable architecture, so configuration and customization are possible within the project scope." },
        { q: "Can it be used from mobile?", a: "The interface is built with responsive web design for mobile, tablet and desktop." },
        { q: "Can we get a demo?", a: "Yes. A product demonstration can be arranged after understanding your institution’s requirements." },
      ],
    },
    cta: {
      eyebrow: "Next Step",
      title: "Take the next step towards a digital institution",
      lead: "See how Shikkha Chat can simplify your institution’s daily operations with a live demonstration.",
      primary: "Request a Demo",
      secondary: "Talk to our team",
      formTitle: "Request a Demo",
      formLead: "Fill in the form — our team will reach out after understanding your institution’s needs.",
      fields: {
        name: "Name",
        institution: "Institution name",
        type: "Institution type",
        mobile: "Mobile number",
        email: "Email",
        district: "District",
        students: "Number of students",
        message: "Message",
      },
      typeOptions: ["School", "College", "Madrasa", "Coaching Centre", "Training Institute", "Technical Institute", "Other"],
      submit: "Request My Demo",
      sent: "Thank you! We’ve received your demo request — our team will be in touch shortly.",
    },
  },
};

const FEATURE_ICONS = [
  <MdOutlineDashboard key="0" />,
  <MdShield key="1" />,
  <MdOutlineSchedule key="2" />,
  <MdOutlineGroups key="3" />,
  <MdOutlineChat key="4" />,
  <MdOutlineTune key="5" />,
];

const AUDIENCE_ICONS = [
  <MdOutlineSchool key="0" />,
  <FaGraduationCap key="1" />,
  <MdOutlineMenuBook key="2" />,
  <MdOutlineGroups key="3" />,
  <MdOutlineCastForEducation key="4" />,
  <MdOutlineHub key="5" />,
  <MdOutlineAccountTree key="6" />,
];

const WHY_ICONS = [
  <MdOutlineStorage key="0" />,
  <MdOutlineGroups key="1" />,
  <MdOutlinePublic key="2" />,
  <MdOutlineTune key="3" />,
  <MdVerified key="4" />,
  <MdOutlineChat key="5" />,
];

const PROBLEM_ICONS = [
  <MdOutlineHub key="0" />,
  <MdContentCopy key="1" />,
  <MdOutlineBarChart key="2" />,
  <MdOutlineForum key="3" />,
  <MdShield key="4" />,
  <MdTrendingUp key="5" />,
];

function Reveal({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <motion.div
      className={className}
      variants={revealItem}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, amount: 0.25 }}
    >
      {children}
    </motion.div>
  );
}

export default function MarketingStory() {
  const { language } = useLanguage();
  const c = useMemo(() => COPY[language], [language]);
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const [sent, setSent] = useState(false);

  return (
    <div className="mk-root" data-no-translate="true">
      {/* ---------------- Problem ---------------- */}
      <section id="mk-problem" className="mk-section mk-section--tint mk-dots">
        <div className="mk-container">
          <motion.div
            variants={revealParent}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, amount: 0.2 }}
            className="mk-stack"
          >
            <Reveal className="mk-head mk-head--center">
              <span className="mk-eyebrow">{c.problem.eyebrow}</span>
              <h2 className="mk-h2">{c.problem.title}</h2>
              <p className="mk-lead" style={{ marginInline: "auto" }}>
                {c.problem.lead}
              </p>
            </Reveal>

            <div className="mk-grid mk-grid--3">
              {c.problem.items.map((item, i) => (
                <Reveal key={item.title}>
                  <div className="mk-card mk-card--flat">
                    <span className="mk-icon-badge" aria-hidden>
                      {PROBLEM_ICONS[i]}
                    </span>
                    <h3 className="mk-h3" style={{ marginTop: "1rem" }}>
                      {item.title}
                    </h3>
                    <p style={{ marginTop: "0.5rem", color: "var(--mk-ink-soft)", lineHeight: 1.7 }}>
                      {item.body}
                    </p>
                  </div>
                </Reveal>
              ))}
            </div>

            <Reveal className="mk-head mk-head--center">
              <span className="mk-chip">{c.problem.closing}</span>
            </Reveal>
          </motion.div>
        </div>
      </section>

      {/* ---------------- Solution ---------------- */}
      <section id="mk-solution" className="mk-section">
        <div className="mk-container">
          <div className="mk-split">
            <Reveal className="mk-head">
              <span className="mk-eyebrow">{c.solution.eyebrow}</span>
              <h2 className="mk-display">{c.solution.title}</h2>
              <p className="mk-lead">{c.solution.lead}</p>
            </Reveal>

            <div className="mk-stack" style={{ gap: "1rem" }}>
              {c.solution.pillars.map((p) => (
                <Reveal key={p.title}>
                  <div className="mk-card">
                    <h3 className="mk-h3">{p.title}</h3>
                    <p style={{ marginTop: "0.4rem", color: "var(--mk-ink-soft)", lineHeight: 1.7 }}>
                      {p.body}
                    </p>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ---------------- Features ---------------- */}
      <section id="mk-features" className="mk-section mk-section--tint">
        <div className="mk-container">
          <motion.div
            variants={revealParent}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, amount: 0.15 }}
            className="mk-stack"
          >
            <Reveal className="mk-head mk-head--center">
              <span className="mk-eyebrow">{c.features.eyebrow}</span>
              <h2 className="mk-h2">{c.features.title}</h2>
              <p className="mk-lead" style={{ marginInline: "auto" }}>
                {c.features.lead}
              </p>
            </Reveal>

            <div className="mk-grid mk-grid--3">
              {c.features.items.map((item, i) => (
                <Reveal key={item.title}>
                  <div className="mk-card">
                    <span className="mk-icon-badge" aria-hidden>
                      {FEATURE_ICONS[i]}
                    </span>
                    <h3 className="mk-h3" style={{ marginTop: "1.1rem" }}>
                      {item.title}
                    </h3>
                    <p style={{ marginTop: "0.5rem", color: "var(--mk-ink-soft)", lineHeight: 1.7 }}>
                      {item.body}
                    </p>
                  </div>
                </Reveal>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* ---------------- Audiences ---------------- */}
      <section id="mk-audiences" className="mk-section">
        <div className="mk-container">
          <motion.div
            variants={revealParent}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, amount: 0.15 }}
            className="mk-stack"
          >
            <Reveal className="mk-head mk-head--center">
              <span className="mk-eyebrow">{c.audiences.eyebrow}</span>
              <h2 className="mk-h2">{c.audiences.title}</h2>
              <p className="mk-lead" style={{ marginInline: "auto" }}>
                {c.audiences.lead}
              </p>
            </Reveal>

            <div className="mk-grid mk-grid--3">
              {c.audiences.items.map((item, i) => (
                <Reveal key={item.title}>
                  <div className="mk-card mk-card--flat" style={{ display: "flex", gap: "1rem" }}>
                    <span className="mk-icon-badge" aria-hidden style={{ flex: "none" }}>
                      {AUDIENCE_ICONS[i]}
                    </span>
                    <div>
                      <h3 className="mk-h3">{item.title}</h3>
                      <p style={{ marginTop: "0.35rem", color: "var(--mk-ink-soft)", lineHeight: 1.65, fontSize: "0.92rem" }}>
                        {item.body}
                      </p>
                    </div>
                  </div>
                </Reveal>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* ---------------- Why Shikkha Chat (dark) ---------------- */}
      <section id="mk-why" className="mk-section mk-section--dark">
        <div className="mk-container">
          <motion.div
            variants={revealParent}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, amount: 0.15 }}
            className="mk-stack"
          >
            <Reveal className="mk-head mk-head--center">
              <span className="mk-eyebrow mk-eyebrow--invert">{c.why.eyebrow}</span>
              <h2 className="mk-h2">{c.why.title}</h2>
              <p className="mk-lead" style={{ marginInline: "auto" }}>
                {c.why.lead}
              </p>
            </Reveal>

            <div className="mk-grid mk-grid--3">
              {c.why.items.map((item, i) => (
                <Reveal key={item.title}>
                  <div className="mk-card mk-card--glass">
                    <span className="mk-icon-badge" aria-hidden>
                      {WHY_ICONS[i]}
                    </span>
                    <h3 className="mk-h3" style={{ marginTop: "1.1rem" }}>
                      {item.title}
                    </h3>
                    <p style={{ marginTop: "0.5rem", color: "color-mix(in srgb, #ffffff 74%, transparent)", lineHeight: 1.7 }}>
                      {item.body}
                    </p>
                  </div>
                </Reveal>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* ---------------- How it works ---------------- */}
      <section id="mk-how" className="mk-section">
        <div className="mk-container">
          <motion.div
            variants={revealParent}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, amount: 0.15 }}
            className="mk-stack"
          >
            <Reveal className="mk-head">
              <span className="mk-eyebrow">{c.how.eyebrow}</span>
              <h2 className="mk-h2">{c.how.title}</h2>
              <p className="mk-lead">{c.how.lead}</p>
            </Reveal>

            <div className="mk-grid mk-grid--2">
              {c.how.steps.map((step, i) => (
                <Reveal key={step.title}>
                  <div className="mk-step">
                    <span className="mk-step-num">{i + 1}</span>
                    <div>
                      <h3 className="mk-h3">{step.title}</h3>
                      <p style={{ marginTop: "0.35rem", color: "var(--mk-ink-soft)", lineHeight: 1.7 }}>
                        {step.body}
                      </p>
                    </div>
                  </div>
                </Reveal>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* ---------------- FAQ ---------------- */}
      <section id="mk-faq" className="mk-section mk-section--tint">
        <div className="mk-container mk-container--narrow">
          <motion.div
            variants={revealParent}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, amount: 0.15 }}
            className="mk-stack"
          >
            <Reveal className="mk-head mk-head--center">
              <span className="mk-eyebrow">{c.faq.eyebrow}</span>
              <h2 className="mk-h2">{c.faq.title}</h2>
              <p className="mk-lead" style={{ marginInline: "auto" }}>
                {c.faq.lead}
              </p>
            </Reveal>

            <Reveal>
              <div>
                {c.faq.items.map((item, i) => {
                  const open = openFaq === i;
                  return (
                    <div key={item.q} className="mk-faq-item">
                      <button
                        type="button"
                        className="mk-faq-q"
                        aria-expanded={open}
                        onClick={() => setOpenFaq(open ? null : i)}
                      >
                        <span>{item.q}</span>
                        <span className="mk-faq-toggle" aria-hidden>
                          {open ? <MdRemove /> : <MdAdd />}
                        </span>
                      </button>
                      <motion.div
                        className="mk-faq-a"
                        initial={false}
                        animate={{ height: open ? "auto" : 0, opacity: open ? 1 : 0 }}
                        transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
                      >
                        <p style={{ paddingBottom: "1.35rem", paddingInlineEnd: "2.5rem" }}>{item.a}</p>
                      </motion.div>
                    </div>
                  );
                })}
              </div>
            </Reveal>
          </motion.div>
        </div>
      </section>

      {/* ---------------- Final CTA + demo form ---------------- */}
      <section id="mk-cta" className="mk-section mk-section--dark">
        <div className="mk-container">
          <div className="mk-split">
            <Reveal className="mk-head">
              <span className="mk-eyebrow mk-eyebrow--invert">{c.cta.eyebrow}</span>
              <h2 className="mk-display">{c.cta.title}</h2>
              <p className="mk-lead">{c.cta.lead}</p>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "0.9rem", marginTop: "1rem" }}>
                <a className="mk-btn mk-btn--onDark" href="#mk-demo-form">
                  {c.cta.primary}
                  <MdArrowForward />
                </a>
                <a className="mk-btn mk-btn--ghostOnDark" href="#mk-how">
                  {c.cta.secondary}
                </a>
              </div>
            </Reveal>

            <Reveal>
              <div id="mk-demo-form" className="mk-card mk-card--glass" style={{ scrollMarginTop: "90px" }}>
                <h3 className="mk-h3">{c.cta.formTitle}</h3>
                <p style={{ marginTop: "0.4rem", color: "color-mix(in srgb, #ffffff 70%, transparent)", lineHeight: 1.65, fontSize: "0.92rem" }}>
                  {c.cta.formLead}
                </p>

                {sent ? (
                  <div
                    role="status"
                    style={{
                      marginTop: "1.25rem",
                      padding: "1rem 1.1rem",
                      borderRadius: "14px",
                      background: "color-mix(in srgb, #ffffff 14%, transparent)",
                      border: "1px solid color-mix(in srgb, #ffffff 26%, transparent)",
                      lineHeight: 1.7,
                    }}
                  >
                    {c.cta.sent}
                  </div>
                ) : (
                  <form
                    className="mk-form"
                    style={{ marginTop: "1.25rem" }}
                    onSubmit={(e) => {
                      e.preventDefault();
                      setSent(true);
                    }}
                  >
                    <div className="mk-field">
                      <label className="mk-label" htmlFor="mk-name">
                        {c.cta.fields.name}
                      </label>
                      <input id="mk-name" name="name" className="mk-input" required />
                    </div>
                    <div className="mk-field">
                      <label className="mk-label" htmlFor="mk-institution">
                        {c.cta.fields.institution}
                      </label>
                      <input id="mk-institution" name="institution" className="mk-input" required />
                    </div>
                    <div className="mk-field">
                      <label className="mk-label" htmlFor="mk-type">
                        {c.cta.fields.type}
                      </label>
                      <select id="mk-type" name="type" className="mk-input" defaultValue="">
                        <option value="" disabled />
                        {c.cta.typeOptions.map((o) => (
                          <option key={o} value={o}>
                            {o}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="mk-field">
                      <label className="mk-label" htmlFor="mk-mobile">
                        {c.cta.fields.mobile}
                      </label>
                      <input id="mk-mobile" name="mobile" className="mk-input" required />
                    </div>
                    <div className="mk-field">
                      <label className="mk-label" htmlFor="mk-email">
                        {c.cta.fields.email}
                      </label>
                      <input id="mk-email" name="email" type="email" className="mk-input" />
                    </div>
                    <div className="mk-field">
                      <label className="mk-label" htmlFor="mk-district">
                        {c.cta.fields.district}
                      </label>
                      <input id="mk-district" name="district" className="mk-input" />
                    </div>
                    <div className="mk-field">
                      <label className="mk-label" htmlFor="mk-students">
                        {c.cta.fields.students}
                      </label>
                      <input id="mk-students" name="students" className="mk-input" />
                    </div>
                    <div className="mk-field" style={{ gridColumn: "1 / -1" }}>
                      <label className="mk-label" htmlFor="mk-message">
                        {c.cta.fields.message}
                      </label>
                      <textarea id="mk-message" name="message" rows={3} className="mk-input" />
                    </div>
                    <div style={{ gridColumn: "1 / -1" }}>
                      <button type="submit" className="mk-btn mk-btn--onDark" style={{ width: "100%" }}>
                        {c.cta.submit}
                      </button>
                    </div>
                  </form>
                )}
              </div>
            </Reveal>
          </div>
        </div>
      </section>
    </div>
  );
}
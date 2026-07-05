import SectionPanel from "./SectionPanel";

export default function SIS() {
  return (
    <SectionPanel
      id="sis"
      pill="SIS"
      title="Less Information Chaos. More Student Clarity."
      description="PowerSchool SIS centralizes enrollment, schedules, attendance, grades, and program data in one single source of truth. With accurate, accessible student information, staff spend less time fixing data and more time supporting students, families, and daily school operations."
      stats={[{ value: "5000+", label: "Organizations Using PowerSchool SIS" }, { value: "17M+", label: "Students Supported" }]}
      quote="Our systems are finally working together. That means our people can work together too."
      author="Sarah Miller"
      role="Technology Leader, Lorena Independent School District, Texas"
      image="https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?auto=format&fit=crop&w=220&q=80"
      logo="Lorena ISD"
    />
  );
}

import SectionPanel from "./SectionPanel";

export default function CollegeCareerLifeReadiness() {
  return (
    <SectionPanel
      id="college-career-life-readiness"
      pill="College, Career & Life Readiness"
      pillStyle="solid"
      title="Prepare students for meaningful next steps."
      description="Connect academic progress, interests, goals, planning, and readiness data so students can build stronger futures."
      showButtons={false}
      stats={[{ value: "Future", label: "Readiness planning for every learner" }]}
      quote="Connected data gives school teams the clarity to act faster, support people better, and build stronger outcomes."
      author="Shikkha Chat Team"
      role="Connected OS Implementation Partner"
      image="https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=220&q=80"
      logo="Readiness"
      themeColor="#9CF048"
      darkColor="#236000"
    />
  );
}

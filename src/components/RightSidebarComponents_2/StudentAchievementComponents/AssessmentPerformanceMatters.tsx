import SectionPanel from "./SectionPanel";

export default function AssessmentPerformanceMatters() {
  return (
    <SectionPanel
      id="assessment-performance-matters"
      pill="Assessment (Performance Matters)"
      pillStyle="solid"
      title="Turn assessment data into instructional action."
      description="Bring benchmark, formative, and performance data into clear views that help educators identify gaps, monitor mastery, and respond quickly."
      showButtons={false}
      stats={[{ value: "3x", label: "More actionable assessment conversations" }]}
      quote="Connected data gives school teams the clarity to act faster, support people better, and build stronger outcomes."
      author="Shikkha Chat Team"
      role="Connected OS Implementation Partner"
      image="https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=220&q=80"
      logo="Assessment"
      themeColor="#9CF048"
      darkColor="#236000"
    />
  );
}

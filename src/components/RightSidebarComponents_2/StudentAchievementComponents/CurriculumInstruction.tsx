import SectionPanel from "./SectionPanel";

export default function CurriculumInstruction() {
  return (
    <SectionPanel
      id="curriculum-instruction"
      pill="Curriculum & Instruction"
      pillStyle="solid"
      title="Align curriculum, teaching, and student outcomes."
      description="Support stronger instruction with connected curriculum planning, standards alignment, classroom resources, and progress visibility."
      showButtons={false}
      stats={[{ value: "100%", label: "Instruction aligned around student needs" }]}
      quote="Connected data gives school teams the clarity to act faster, support people better, and build stronger outcomes."
      author="Shikkha Chat Team"
      role="Connected OS Implementation Partner"
      image="https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=220&q=80"
      logo="Curriculum"
      themeColor="#9CF048"
      darkColor="#236000"
    />
  );
}

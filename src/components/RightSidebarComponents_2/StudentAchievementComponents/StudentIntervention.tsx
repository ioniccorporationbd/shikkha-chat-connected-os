import SectionPanel from "./SectionPanel";

export default function StudentIntervention() {
  return (
    <SectionPanel
      id="student-intervention"
      pill="Student Intervention"
      pillStyle="solid"
      title="Coordinate support before students fall behind."
      description="Identify learning risks, assign interventions, monitor support plans, and keep teams aligned around student success."
      showButtons={false}
      stats={[{ value: "Early", label: "Intervention signals connected to action" }]}
      quote="Connected data gives school teams the clarity to act faster, support people better, and build stronger outcomes."
      author="Shikkha Chat Team"
      role="Connected OS Implementation Partner"
      image="https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=220&q=80"
      logo="Intervention"
      themeColor="#9CF048"
      darkColor="#236000"
    />
  );
}

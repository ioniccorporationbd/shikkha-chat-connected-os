import SectionPanel from "./SectionPanel";

export default function LearningManagementSchoology() {
  return (
    <SectionPanel
      id="learning-management-schoology"
      pill="Learning Management (Schoology)"
      pillStyle="solid"
      title="Connect digital learning with student progress."
      description="Schoology-style learning management connects coursework, assignments, resources, and engagement data to the broader student achievement experience."
      showButtons={false}
      stats={[{ value: "24/7", label: "Digital learning access for students and families" }]}
      quote="Connected data gives school teams the clarity to act faster, support people better, and build stronger outcomes."
      author="Shikkha Chat Team"
      role="Connected OS Implementation Partner"
      image="https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=220&q=80"
      logo="Schoology"
      themeColor="#9CF048"
      darkColor="#236000"
    />
  );
}

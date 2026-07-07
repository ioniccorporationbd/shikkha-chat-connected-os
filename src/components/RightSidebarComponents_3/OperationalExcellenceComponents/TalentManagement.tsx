import SectionPanel from "./SectionPanel";

export default function TalentManagement() {
  return (
    <SectionPanel
      id="talent-management"
      pill="Talent Management"
      pillStyle="solid"
      title="Support people across the employee lifecycle."
      description="Connect staff growth, performance, learning, evaluation, and retention workflows so schools can support great teams."
      showButtons={false}
      stats={[{ value: "People", label: "Talent visibility and staff growth" }]}
      quote="Connected data gives school teams the clarity to act faster, support people better, and build stronger outcomes."
      author="Shikkha Chat Team"
      role="Connected OS Implementation Partner"
      image="https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=220&q=80"
      logo="Talent"
      themeColor="#ECC6FE"
      darkColor="#5B1276"
    />
  );
}

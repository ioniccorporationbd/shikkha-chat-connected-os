import SectionPanel from "./SectionPanel";

export default function ResourcePlanning() {
  return (
    <SectionPanel
      id="resource-planning"
      pill="Resource Planning"
      pillStyle="solid"
      title="Plan resources around real school needs."
      description="Give leaders clear visibility into programs, staffing, budgets, and priorities so resources can move where they matter most."
      showButtons={false}
      stats={[{ value: "Real-time", label: "Planning visibility across operations" }]}
      quote="Connected data gives school teams the clarity to act faster, support people better, and build stronger outcomes."
      author="Shikkha Chat Team"
      role="Connected OS Implementation Partner"
      image="https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=220&q=80"
      logo="Planning"
      themeColor="#ECC6FE"
      darkColor="#5B1276"
    />
  );
}

import SectionPanel from "./SectionPanel";

export default function ERPSystems() {
  return (
    <SectionPanel
      id="erp-systems"
      pill="ERP Systems"
      pillStyle="solid"
      title="Modernize the core business system."
      description="Connect finance, purchasing, HR, payroll, and administrative workflows in a reliable ERP experience for school operations."
      showButtons={false}
      stats={[{ value: "Core", label: "ERP workflows connected" }]}
      quote="Connected data gives school teams the clarity to act faster, support people better, and build stronger outcomes."
      author="Shikkha Chat Team"
      role="Connected OS Implementation Partner"
      image="https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=220&q=80"
      logo="ERP"
      themeColor="#ECC6FE"
      darkColor="#5B1276"
    />
  );
}

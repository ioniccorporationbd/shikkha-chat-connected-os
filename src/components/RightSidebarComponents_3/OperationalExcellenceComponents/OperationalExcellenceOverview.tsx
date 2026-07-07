import SectionPanel from "./SectionPanel";

export default function OperationalExcellenceOverview() {
  return (
    <SectionPanel
      id="operational-excellence"
      pill="Operational Excellence"
      pillStyle="solid"
      title="Run smarter school operations with connected data."
      description="Connect finance, HR, resource planning, ERP, enrollment forecasting, and educator support so leaders can plan and operate with confidence."
      showButtons={false}
      stats={[{ value: "1 OS", label: "Operations connected around decisions" }]}
      quote="Connected data gives school teams the clarity to act faster, support people better, and build stronger outcomes."
      author="Shikkha Chat Team"
      role="Connected OS Implementation Partner"
      image="https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=220&q=80"
      logo="OpsOS"
      themeColor="#ECC6FE"
      darkColor="#5B1276"
    />
  );
}

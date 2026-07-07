import SectionPanel from "./SectionPanel";

export default function FinancialStrategyAllovue() {
  return (
    <SectionPanel
      id="financial-strategy-allovue"
      pill="Financial Strategy (Allovue)"
      pillStyle="solid"
      title="Make every budget decision more strategic."
      description="Allovue-style financial strategy connects spending, planning, and outcomes so schools can align budgets with priorities."
      showButtons={false}
      stats={[{ value: "Budget", label: "Strategy aligned to impact" }]}
      quote="Connected data gives school teams the clarity to act faster, support people better, and build stronger outcomes."
      author="Shikkha Chat Team"
      role="Connected OS Implementation Partner"
      image="https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=220&q=80"
      logo="Allovue"
      themeColor="#ECC6FE"
      darkColor="#5B1276"
    />
  );
}

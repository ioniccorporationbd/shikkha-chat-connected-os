import SectionPanel from "./SectionPanel";

export default function RecruitingAndHR() {
  return (
    <SectionPanel
      id="recruiting-and-hr"
      pill="Recruiting and HR"
      pillStyle="solid"
      title="Make hiring and HR smoother for everyone."
      description="Streamline recruiting, onboarding, HR records, and staff workflows so schools can move faster and support teams better."
      showButtons={false}
      stats={[{ value: "Faster", label: "Recruiting and HR operations" }]}
      quote="Connected data gives school teams the clarity to act faster, support people better, and build stronger outcomes."
      author="Shikkha Chat Team"
      role="Connected OS Implementation Partner"
      image="https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=220&q=80"
      logo="HR"
      themeColor="#ECC6FE"
      darkColor="#5B1276"
    />
  );
}

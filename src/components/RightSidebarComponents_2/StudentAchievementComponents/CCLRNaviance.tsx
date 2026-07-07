import SectionPanel from "./SectionPanel";

export default function CCLRNaviance() {
  return (
    <SectionPanel
      id="cclr-naviance"
      pill="CCLR (Naviance)"
      pillStyle="solid"
      title="Guide students with planning that feels personal."
      description="Naviance-style readiness tools help students explore pathways, set goals, and connect learning to college, career, and life plans."
      showButtons={false}
      stats={[{ value: "Pathway", label: "College and career planning support" }]}
      quote="Connected data gives school teams the clarity to act faster, support people better, and build stronger outcomes."
      author="Shikkha Chat Team"
      role="Connected OS Implementation Partner"
      image="https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=220&q=80"
      logo="Naviance"
      themeColor="#9CF048"
      darkColor="#236000"
    />
  );
}

import SectionPanel from "./SectionPanel";

export default function MTSS() {
  return (
    <SectionPanel
      id="mtss"
      pill="MTSS"
      pillStyle="solid"
      title="Bring multi-tier support into one connected workflow."
      description="Connect academic, behavior, attendance, and intervention data so schools can coordinate supports across tiers with better clarity."
      showButtons={false}
      stats={[{ value: "Tier 1–3", label: "Support planning visibility" }]}
      quote="Connected data gives school teams the clarity to act faster, support people better, and build stronger outcomes."
      author="Shikkha Chat Team"
      role="Connected OS Implementation Partner"
      image="https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=220&q=80"
      logo="MTSS"
      themeColor="#9CF048"
      darkColor="#236000"
    />
  );
}

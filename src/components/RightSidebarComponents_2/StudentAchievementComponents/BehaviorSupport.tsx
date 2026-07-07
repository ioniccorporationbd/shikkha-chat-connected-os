import SectionPanel from "./SectionPanel";

export default function BehaviorSupport() {
  return (
    <SectionPanel
      id="behavior-support"
      pill="Behavior Support"
      pillStyle="solid"
      title="Support positive behavior with better context."
      description="Help staff understand behavior patterns, document supports, and coordinate student wellbeing workflows with connected information."
      showButtons={false}
      stats={[{ value: "360°", label: "Student support context" }]}
      quote="Connected data gives school teams the clarity to act faster, support people better, and build stronger outcomes."
      author="Shikkha Chat Team"
      role="Connected OS Implementation Partner"
      image="https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=220&q=80"
      logo="Behavior"
      themeColor="#9CF048"
      darkColor="#236000"
    />
  );
}

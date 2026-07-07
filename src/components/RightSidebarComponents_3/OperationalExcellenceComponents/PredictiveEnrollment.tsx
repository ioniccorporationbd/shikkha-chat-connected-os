import SectionPanel from "./SectionPanel";

export default function PredictiveEnrollment() {
  return (
    <SectionPanel
      id="predictive-enrollment"
      pill="Predictive Enrollment"
      pillStyle="solid"
      title="Forecast enrollment with confidence."
      description="Use enrollment trends and predictive signals to plan staffing, resources, facilities, and programs before pressure builds."
      showButtons={false}
      stats={[{ value: "Forecast", label: "Enrollment planning intelligence" }]}
      quote="Connected data gives school teams the clarity to act faster, support people better, and build stronger outcomes."
      author="Shikkha Chat Team"
      role="Connected OS Implementation Partner"
      image="https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=220&q=80"
      logo="Enrollment"
      themeColor="#ECC6FE"
      darkColor="#5B1276"
    />
  );
}

import SectionPanel from "./SectionPanel";

export default function HomeComponents() {
  return (
    <SectionPanel
      id="home-connections-panel"
      pill="Home Connections"
      pillStyle="solid"
      title="Connected family experience for every school."
      description="Shikkha Chat connects student information, family communication, attendance support, enrollment, and school operations in one trusted platform. Schools can share clear updates, families can stay informed, and every learner gets better support."
      showButtons={false}
      stats={[
        {
          value: "+70%",
          label: "Better data accuracy",
        },
        {
          value: "24/7",
          label: "Family access",
        },
        {
          value: "1 OS",
          label: "Unified school system",
        },
      ]}
      quote="Shikkha Chat helped us reduce communication gaps and create a smarter connected school experience."
      author="Dr. Angela Hargrave"
      role="Technology Leader, Connected School Community"
      image="https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=220&q=80"
      logo="Shikkha Chat"
    />
  );
}
import SectionPanel from "./SectionPanel";

export default function HomeComponents() {
  return (
    <SectionPanel
      id="home-connections-panel"
      pill="Home Connections"
      pillStyle="solid"
      title="Connect every family with trusted information."
      description="When student information and communications are clear and consistent, schools and families connect with confidence. Shikkha Chat brings together student and family operations in one connected system that helps school communities engage around trusted information."
      showButtons={false}
      stats={[{ value: "+70%", label: "Improvement in data accuracy" }]}
      quote="We improved data accuracy and helped families stay connected with clear, trusted updates."
      author="Dr. Angela Hargrave"
      role="Technology Leader, Connected School Community"
      image="https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=220&q=80"
      logo="School Logo"
    />
  );
}

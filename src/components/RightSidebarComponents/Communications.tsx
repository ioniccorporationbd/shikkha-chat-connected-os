import SectionPanel from "./SectionPanel";

export default function Communications() {
  return (
    <SectionPanel
      id="communications"
      pill="Communications (School Messenger)"
      title="Less Manual Outreach. More Connected Families."
      description="By connecting communications directly to student information, Shikkha Chat ensures every update is accurate, timely, and easy to deliver—saving staff time while keeping families informed and confident."
      stats={[{ value: "4000+", label: "Organizations using Shikkha Chat for communications" }, { value: "22M+", label: "Students supported" }, { value: "5B+", label: "Messages sent each school year" }]}
      quote="It’s built right into Shikkha Chat. I can send a message in seconds, without switching tools. That’s a big deal for busy administrators."
      author="Kale Blickenstaff"
      role="District Leader, Mill Creek Community School Corporation, Indiana"
      image="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=220&q=80"
      logo="Mill Creek"
    />
  );
}

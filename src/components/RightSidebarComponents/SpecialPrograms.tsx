import SectionPanel from "./SectionPanel";

export default function SpecialPrograms() {
  return (
    <SectionPanel
      id="special-programs"
      pill="Special Programs"
      title="Deliver the Support Students Deserve"
      description="Bring compliance workflows and data into one connected system. Ensure every student receives the right services on time by reducing manual tracking and improving team alignment."
      stats={[{ value: "1200+", label: "Organizations using Shikkha Chat for special programs" }, { value: "1.7M", label: "Student services forms completed each year" }, { value: "9M+", label: "Students supported" }]}
      quote="Two-way data flow between Shikkha Chat SIS and Special Programs ensures that data is always current. Teachers also get alerts for student accommodations."
      author="Paul Howard"
      role="Special Services Leader, School of Dreams Academy"
      logo="School of Dreams Academy"
    />
  );
}

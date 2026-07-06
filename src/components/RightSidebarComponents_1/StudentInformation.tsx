import SectionPanel from "./SectionPanel";

export default function StudentInformation() {
  return (
    <SectionPanel
      id="student-information"
      pill="STUDENT INFORMATION"
      pillStyle="solid"
      title="Give Educators Time Back"
      description="When data is scattered across systems, staff spend time fixing records instead of focusing on students. Shikkha Chat brings student information, enrollment, and special program management into one connected system so schools can operate confidently and meet every student’s needs."
      showButtons={false}
      stats={[{ value: "10–20 Hours", label: "Busy-work time saved by teachers every week" }]}
      quote="Shikkha Chat is saving our teachers time in manual grading, which is low-level work. You want them focused on teaching and measuring the students."
      author="Bart Banfield"
      role="Former School Leader, Epic Charter Schools, Oklahoma"
      image="https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=220&q=80"
      logo="Epic Charter Schools"
    />
  );
}

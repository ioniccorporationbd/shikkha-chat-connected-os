import SectionPanel from "./SectionPanel";

export default function ClassroomSolutions() {
  return (
    <SectionPanel
      id="classroom-solutions"
      pill="Classroom Solutions"
      pillStyle="solid"
      title="Give teachers a clearer daily classroom workflow."
      description="Bring instruction, participation, assignments, and student context together so teachers can spend more time teaching and less time switching systems."
      showButtons={false}
      stats={[{ value: "1 View", label: "Classroom tools connected around the learner" }]}
      quote="Connected data gives school teams the clarity to act faster, support people better, and build stronger outcomes."
      author="Shikkha Chat Team"
      role="Connected OS Implementation Partner"
      image="https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=220&q=80"
      logo="Classroom"
      themeColor="#9CF048"
      darkColor="#236000"
    />
  );
}

import SectionPanel from "./SectionPanel";

export default function StudentAchievementOverview() {
  return (
    <SectionPanel
      id="student-achievement"
      pill="Student Achievement"
      pillStyle="solid"
      title="Connected achievement intelligence for every learner."
      description="Unify classroom activity, assessment results, interventions, and readiness planning so educators can understand progress and support each student with confidence."
      showButtons={false}
      stats={[{ value: "+34%", label: "Faster visibility into learning progress" }]}
      quote="Connected data gives school teams the clarity to act faster, support people better, and build stronger outcomes."
      author="Shikkha Chat Team"
      role="Connected OS Implementation Partner"
      image="https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=220&q=80"
      logo="AchievementOS"
      themeColor="#9CF048"
      darkColor="#236000"
    />
  );
}

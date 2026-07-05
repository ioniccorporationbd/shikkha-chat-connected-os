import SectionPanel from "./SectionPanel";

export default function FamilyEngagement() {
  return (
    <SectionPanel
      id="family-engagement"
      pill="FAMILY ENGAGEMENT"
      pillStyle="solid"
      title="Bring Families Closer to Every School Day"
      description="Keeping families informed shouldn’t require juggling tools, data gaps, or mixed messages. PowerSchool makes communication clear, consistent, and accessible—saving staff time, keeping families connected, and ensuring students are in school."
      showButtons={false}
      stats={[{ value: "4%", label: "Improvement in chronic absenteeism districtwide" }]}
      quote="As more staff and teachers began using the platform, what started as a communication tool became an engagement engine."
      author="Dr. Matt Anderson"
      role="Climate and Culture Leader, Jefferson County Public Schools, Kentucky"
      image="https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&w=220&q=80"
      logo="JCPS"
    />
  );
}

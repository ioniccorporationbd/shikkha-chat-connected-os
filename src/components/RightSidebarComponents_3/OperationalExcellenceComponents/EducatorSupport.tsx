import SectionPanel from "./SectionPanel";

export default function EducatorSupport() {
  return (
    <SectionPanel
      id="educator-support"
      pill="Educator Support"
      pillStyle="solid"
      title="Give educators the operational support they deserve."
      description="Reduce administrative friction and connect support workflows so educators can focus more energy on students."
      showButtons={false}
      stats={[{ value: "More time", label: "Support for teachers and staff" }]}
      quote="Connected data gives school teams the clarity to act faster, support people better, and build stronger outcomes."
      author="Shikkha Chat Team"
      role="Connected OS Implementation Partner"
      image="https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=220&q=80"
      logo="Educator"
      themeColor="#ECC6FE"
      darkColor="#5B1276"
    />
  );
}

import SectionPanel from "./SectionPanel";

export default function Enrollment() {
  return (
    <SectionPanel
      id="enrollment"
      pill="Enrollment"
      title="A Smoother Start for Every Student"
      description="Keep all your student registration information accurate and up to date with seamless connections to your SIS. Shikkha Chat Enrollment reduces manual entry and paperwork, so your staff and families enjoy a smooth experience from first contact to graduation."
      stats={[{ value: "4500+", label: "Organizations using Shikkha Chat for enrollment and registrations" }, { value: "16M+", label: "Students enrolled every year." }]}
      quote="Instead of spending weeks—or even months—manually entering student information, staff could simply approve or reject entries, allowing them to move on to more critical tasks."
      author="Kristin Bowling"
      role="Technology Leader, Enterprise Elementary School District"
      image="https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=220&q=80"
      logo="Enterprise Elementary School District"
    />
  );
}

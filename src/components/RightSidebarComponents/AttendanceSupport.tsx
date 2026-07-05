import SectionPanel from "./SectionPanel";

export default function AttendanceSupport() {
  return (
    <SectionPanel
      id="attendance-support"
      pill="Attendance Support"
      title="Spot the Signs Early. Step in Sooner."
      description="Absenteeism starts with small signs long before it becomes a serious problem. PowerSchool Attendance Support detects those signs early and automates family outreach so staff can respond quickly and keep students on track."
      stats={[{ value: "600+", label: "Organizations using PowerSchool for attendance support" }, { value: "2.2M+", label: "Students supported" }, { value: "80M+", label: "Messages sent each school year" }]}
      quote="Haywood County Schools lowers chronic absenteeism with support from PowerSchool."
      author="Nicole Bond"
      role="Attendance and Enrollment Leader, Haywood County Schools, Tennessee"
      image="https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=220&q=80"
      logo="Haywood County Schools"
    />
  );
}

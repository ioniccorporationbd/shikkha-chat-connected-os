import DynamicError from "@/components/errors/DynamicError";

export default function NotFound() {
  return <DynamicError status={404} />;
}

import DynamicError from "@/components/errors/DynamicError";

export default function NotFound() {
  return <DynamicError kind="not-found" />;
}

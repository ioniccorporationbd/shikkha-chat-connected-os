import SegmentPanel from "@/components/hubs/home-connections/panels/SegmentPanels";
import { segmentOrder } from "@/components/hubs/home-connections/segmentData";

/**
 * The right-hand scroll stack for the segment between Video Banner 1 and
 * Video Banner 2. On desktop it is the locked, scroll-synced rail; on mobile
 * it becomes the single-column page content. Each panel carries its own
 * anchor id, in the same order the scroll engine expects.
 */
export default function HomeConnectionsSidePanels() {
  return (
    <div className="min-h-full bg-white">
      {segmentOrder.map((id) => (
        <SegmentPanel key={id} id={id} chapterId={id} />
      ))}
    </div>
  );
}

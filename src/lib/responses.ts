import type { LetterResponse } from "@/types/letter";

export function summarizeResponses(responses: LetterResponse[]) {
  const summary = {
    accepted: 0,
    declined: 0,
    attending: 0,
    guests: 0,
    notAttending: 0,
    poll: new Map<string, number>(),
  };
  for (const r of responses) {
    if (r.action_type === "accept") {
      if (r.status === "yes") summary.accepted++;
      else summary.declined++;
    } else if (r.action_type === "rsvp") {
      if (r.status === "attending") {
        summary.attending++;
        summary.guests += r.guest_count ?? 1;
      } else summary.notAttending++;
    } else if (r.poll_option) {
      summary.poll.set(r.poll_option, (summary.poll.get(r.poll_option) ?? 0) + 1);
    }
  }
  return summary;
}

export function describeResponse(r: LetterResponse): string {
  if (r.action_type === "accept") return r.status === "yes" ? "Đồng ý" : "Từ chối";
  if (r.action_type === "poll") return `Bình chọn: ${r.poll_option}`;
  return r.status === "attending" ? `Tham dự (${r.guest_count ?? 1} người)` : "Không tham dự";
}

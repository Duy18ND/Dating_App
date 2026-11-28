import { describe, expect, it } from "vitest";
import type { LetterResponse } from "@/types/letter";
import { describeResponse, isReplyResponse, summarizeResponses } from "./responses";

const response = (patch: Partial<LetterResponse>): LetterResponse => ({
  id: "x",
  responder_name: null,
  action_type: "accept",
  status: null,
  guest_count: null,
  poll_option: null,
  message: null,
  created_at: "2026-11-27T00:00:00Z",
  ...patch,
});

describe("tổng hợp phản hồi", () => {
  it("cộng số khách của người tham dự, đếm bình chọn và tách riêng hồi âm thư", () => {
    const replyRow = response({
      action_type: "accept",
      status: "reply",
      poll_option: "Đã nhận thư ❤️",
      message: "Cảm ơn cậu nhiều nhé!",
    });
    const summary = summarizeResponses([
      response({ status: "yes" }),
      response({ action_type: "rsvp", status: "attending", guest_count: 3 }),
      response({ action_type: "rsvp", status: "not_attending", guest_count: 0 }),
      response({ action_type: "poll", poll_option: "Lẩu" }),
      response({ action_type: "poll", poll_option: "Lẩu" }),
      replyRow,
    ]);
    expect(summary).toMatchObject({
      accepted: 1,
      declined: 0,
      attending: 1,
      guests: 3,
      notAttending: 1,
      replies: 1,
    });
    expect(summary.poll.get("Lẩu")).toBe(2);
    expect(isReplyResponse(replyRow)).toBe(true);
    expect(describeResponse(replyRow)).toBe("Hồi âm: Đã nhận thư ❤️");
  });
});

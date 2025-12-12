import { NextRequest, NextResponse } from "next/server";
import nodemailer from "nodemailer";
import { db } from "@/services/firebase/config";
import {
  collection,
  getDocs,
  query,
  where,
  doc,
  getDoc,
  addDoc,
} from "firebase/firestore";

// Helper to coerce Firestore Timestamp or string to ISO string
function toISO(input: any): string | undefined {
  if (!input) return undefined;
  if (input?.toDate) return input.toDate().toISOString();
  if (typeof input === "string") return new Date(input).toISOString();
  if (input instanceof Date) return input.toISOString();
  return String(input);
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      eventId,
      changes,
      event,
      onlyConfirmed = true,
    }: {
      eventId: string;
      changes?: Record<string, { before: any; after: any }>;
      event?: { title?: string; startDate?: any; endDate?: any; venue?: string };
      onlyConfirmed?: boolean;
    } = body || {};

    if (!eventId) {
      return NextResponse.json(
        { success: false, error: "eventId is required" },
        { status: 400 }
      );
    }

    // Build a query for orders of this event
    let ordersQ = query(collection(db, "orders"), where("eventId", "==", eventId));
    const ordersSnap = await getDocs(ordersQ);

    const emails = new Set<string>();
    const userIds = new Set<string>();
    const orders = ordersSnap.docs.map((d) => ({ id: d.id, ...(d.data() as any) }));

    for (const o of orders) {
      if (onlyConfirmed && o.status && o.status !== "confirmed") continue;
      const userEmail = o.userEmail || o.email;
      if (userEmail) emails.add(String(userEmail));
      if (o.userId) userIds.add(String(o.userId));
    }

    // If no recipients, exit early
    // Continue even if there are no email recipients; in-app notifications might still be created

    // Fetch event title if not provided
    let eventTitle = event?.title;
    if (!eventTitle) {
      try {
        const evSnap = await getDoc(doc(db, "events", eventId));
        if (evSnap.exists()) {
          eventTitle = (evSnap.data() as any)?.title || eventId;
        }
      } catch {}
    }

    // Format change list HTML
    const changeLines = Object.entries(changes || {}).map(([key, val]) => {
      const beforeStr = toISO(val?.before) ?? String(val?.before ?? "-");
      const afterStr = toISO(val?.after) ?? String(val?.after ?? "-");
      return `<li><strong>${key}</strong>: <span style="color:#991b1b">${beforeStr}</span> ➜ <span style="color:#166534">${afterStr}</span></li>`;
    });

    const evtDateStr = event?.startDate ? new Date(event.startDate).toLocaleString() : "";
    const changeSummary = Object.keys(changes || {}).join(", ") || "Details updated";

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.NEXT_MAIL_USER,
        pass: process.env.NEXT_MAIL_PASS,
      },
    });

    const html = `
      <div style="font-family: Arial, sans-serif; color: #333; line-height: 1.6; padding: 20px;">
        <h2 style="margin:0 0 8px;">🔔 Event Update Notification</h2>
        <p style="margin:0 0 16px;">The event <strong>${eventTitle || "(Untitled)"}</strong> has been updated.</p>
        ${evtDateStr ? `<p style="margin:0 0 12px;"><strong>Date:</strong> ${evtDateStr}</p>` : ""}
        ${changeLines.length > 0 ? `<p style="margin:12px 0 6px;">Changes:</p><ul>${changeLines.join("")}</ul>` : `<p style="margin:12px 0;">Details have been updated.</p>`}
        <p style="font-size:12px; color:#666; margin-top:20px;">This is an automated message. Please do not reply.</p>
      </div>
    `;

    // Send emails (sequentially to avoid provider limits)
    let sent = 0;
    for (const email of emails) {
      try {
        await transporter.sendMail({
          from: process.env.NEXT_MAIL_USER,
          to: email,
          subject: `Update: ${eventTitle || "Event"}`,
          html,
        });
        sent += 1;
      } catch (err) {
        console.warn("Failed to send update email to", email, err);
      }
    }

    let created = 0;
    for (const uid of userIds) {
      try {
        await addDoc(collection(db, "notifications"), {
          userId: uid,
          eventId,
          type: "event_update",
          title: eventTitle || "Event updated",
          message: changeSummary,
          changes: changes || {},
          createdAt: new Date().toISOString(),
          read: false,
        });
        created += 1;
      } catch (err) {
        console.warn("Failed to create in-app notification for user", uid, err);
      }
    }

    return NextResponse.json({ success: true, notified: sent, inAppCreated: created });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { success: false, error: (error as Error).message },
      { status: 500 }
    );
  }
}

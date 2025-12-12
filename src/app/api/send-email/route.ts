import { NextRequest, NextResponse } from "next/server";
import nodemailer from "nodemailer";
import QRCode from "qrcode";
import { db } from "@/services/firebase/config"; // adjust the import path
import { doc, updateDoc, getDoc } from "firebase/firestore";

export async function POST(req: NextRequest) {
  try {
    const { userEmail, eventName, eventDate, eventLocation, ticketId, ticketNumber: ticketNumberFromClient, orderId, userId, eventId } =
      await req.json();

    const localEventDate = eventDate ? new Date(eventDate).toLocaleString() : "";

    let ticketNumber: string | undefined = ticketNumberFromClient;
    if (!ticketNumber && ticketId) {
      const ticketSnap = await getDoc(doc(db, "tickets", ticketId));
      if (ticketSnap.exists()) {
        const t = ticketSnap.data() as any;
        ticketNumber = t?.ticketNumber;
      }
    }

    const qrPayloadObj = {
      type: "ticket",
      version: 1,
      ticket: {
        id: ticketId ?? "",
        number: ticketNumber ?? "",
      }
    };

    const qrCodeDataUrl = await QRCode.toDataURL(JSON.stringify(qrPayloadObj), {
      errorCorrectionLevel: "M",
      margin: 2,
      scale: 6,
    });
    console.log("Generated QR Code Data URL:", qrCodeDataUrl);

    const ticketRef = doc(db, "tickets", ticketId);
    await updateDoc(ticketRef, {
      qrCodeUrl: qrCodeDataUrl,
      updatedAt: new Date().toISOString(),
    });

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.NEXT_MAIL_USER,
        pass: process.env.NEXT_MAIL_PASS,
      },
    });

    await transporter.sendMail({
      from: process.env.NEXT_MAIL_USER,
      to: userEmail,
      subject: `Your Ticket for ${eventName}`,
      html: `
        <div style="font-family: Arial, sans-serif; color: #333; line-height: 1.5; padding: 20px;">
          <h1 style="color: #1e3a8a;">🎟️ Your Ticket for ${eventName}</h1>
          <p><strong>Date:</strong> ${localEventDate}</p>
          <p><strong>Location:</strong> ${eventLocation ?? "To be announced"}</p>
          <p style="margin-top: 20px; margin-bottom: 20px;">
            Please present this QR code at the entrance:
          </p>
          <div style="text-align: center; margin: 20px 0;">
            <img src="cid:ticketQr" alt="QR Code" style="width: 200px; height: 200px; border: 2px solid #1e3a8a; border-radius: 12px;" />
          </div>
          <p style="font-size: 14px; color: #555; margin-top: 20px;">
            Thank you for your purchase! We look forward to seeing you at the event.
          </p>
          <p style="font-size: 12px; color: #999;">
            This is an automated email. Please do not reply.
          </p>
        </div>
      `,
      attachments: [
        {
          filename: "ticket.png",
          content: qrCodeDataUrl.split("base64,")[1],
          cid: "ticketQr",
          encoding: "base64",
        },
      ],
    });

    return NextResponse.json({ success: true, qrCodeUrl: qrCodeDataUrl });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { success: false, error: (error as Error).message },
      { status: 500 }
    );
  }
}

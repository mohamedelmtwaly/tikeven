import { NextResponse } from "next/server";
import OpenAI from "openai";
import { collection, getDocs } from "firebase/firestore";
import { db } from "@/services/firebase/config";
import { getVenues } from "@/services/firebase/organizers/venues";

export async function POST(req: Request) {
  try {
    const { title } = await req.json();
    if (!title) {
      return NextResponse.json({ error: "Title is required" }, { status: 400 });
    }

    const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

    let categories: Array<{ id: string; name?: string }> = [];
    let venues: Array<{ id: string; title?: string }> = [];
    try {
      const [categoriesSnap, venuesList] = await Promise.all([
        getDocs(collection(db, "categories")),
        getVenues(),
      ]);

      categories = categoriesSnap.docs.map((docItem) => ({
        id: docItem.id,
        ...docItem.data(),
      }));

      venues = (venuesList as Array<{ id: string; title?: string }>) ?? [];
      console.log("generate-event-data: counts", {
        categories: categories.length,
        venues: venues.length,
      });
    } catch (e) {
      console.error("generate-event-data: fetch error", e);
    }

    const compactCategories = categories.slice(0, 30).map((c) => ({
      id: c.id,
      name: c.name,
    }));
    const compactVenues = venues.slice(0, 30).map((v) => ({
      id: v.id,
      title: v.title,
    }));

    const prompt = `
      You are helping to create an event.
      Event title: "${title}".

      Here is the list of available categories as JSON (id, name only, max 30):
      ${JSON.stringify(compactCategories)}

      Here is the list of available venues as JSON (id, title only, max 30):
      ${JSON.stringify(compactVenues)}

      1. Write a short, detailed, marketing-friendly description for this event.
      2. Choose the single most appropriate category from the provided list (by id).
      3. Choose venue for this event from the provided list (by id).
      4. Choose a reasonable ticketsCount depend on venue capacity and event title.

      Respond with a JSON object ONLY, ready to be parsed directly with JSON.parse in JavaScript.
      Do NOT include markdown, backticks, comments, or any explanatory text.

      The JSON object MUST have exactly the following keys:
      - description: string
      - categoryId: string (one of the provided category ids)
      - venueId: string (one of the provided venue ids)
      - ticketsCount: number
    `;

    const result = await client.responses.create({
      model: "gpt-4o",
      input: prompt,
    });

    const outputText =
      (result as { output_text?: unknown }).output_text ?? "";
    const rawOutput =
      typeof outputText === "string"
        ? outputText.trim()
        : outputText && typeof (outputText as { toString: () => string }).toString === "function"
        ? (outputText as { toString: () => string }).toString().trim()
        : "";

    if (!rawOutput) {
      return NextResponse.json(
        { error: "AI returned empty description" },
        { status: 500 }
      );
    }

    let description = "";
    let chosenCategoryId = "";
    let chosenVenueId = "";
    let ticketsCount: number | null = null;

    try {
      const parsed = JSON.parse(rawOutput);

      description = (parsed.description || "").toString();
      if (parsed.categoryId && typeof parsed.categoryId === "string") {
        chosenCategoryId = parsed.categoryId;
      }
      if (parsed.venueId && typeof parsed.venueId === "string") {
        chosenVenueId = parsed.venueId;
      }
      if (
        typeof parsed.ticketsCount === "number" &&
        parsed.ticketsCount >= 50
      ) {
        ticketsCount = parsed.ticketsCount;
      }
    } catch (e) {
      console.error("generate-event-data: failed to parse AI JSON", e, rawOutput);
      return NextResponse.json(
        { error: "Failed to parse AI JSON response" },
        { status: 500 }
      );
    }

    if (!description || !chosenCategoryId || !chosenVenueId || ticketsCount == null) {
      return NextResponse.json(
        { error: "AI response missing required fields" },
        { status: 500 }
      );
    }

    const chosenCategory = categories.find((c) => c.id === chosenCategoryId)?.name || "";
    const chosenVenue = venues.find((v) => v.id === chosenVenueId)?.title || "";

    return NextResponse.json({
      description,
      category: chosenCategory,
      venue: chosenVenue,
      categoryId: chosenCategoryId,
      venueId: chosenVenueId,
      ticketsCount,
    });
  } catch (err: unknown) {
    console.error("API ERROR:", err);
    const message = err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

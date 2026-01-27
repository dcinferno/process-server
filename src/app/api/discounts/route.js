export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { connectDB } from "../../../lib/db";
import Discount from "../../../lib/models/Discount";

/* ------------------------------------------
   POST /api/discounts
   Creates a new discount with validation
------------------------------------------- */
export async function POST(request) {
  try {
    // 1. Authentication - require internal secret
    const secret = request.headers.get("x-internal-secret");
    if (secret !== process.env.INTERNAL_API_TOKEN) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    // 2. Parse request body
    const body = await request.json();
    const {
      name,
      type,
      percentOff,
      fixedPrice,
      amountOff,
      tags,
      scope,
      creatorName,
      startsAt,
      endsAt,
      active,
    } = body;

    // 3. Validate required fields
    if (!name?.trim()) {
      return NextResponse.json(
        { success: false, error: "Name is required" },
        { status: 400 }
      );
    }

    if (!type) {
      return NextResponse.json(
        { success: false, error: "Type is required" },
        { status: 400 }
      );
    }

    // 4. Validate and map type enum (percent -> percentage)
    const typeMap = {
      percent: "percentage",
      fixed: "fixed",
      amount: "amount",
    };

    const mappedType = typeMap[type];
    if (!mappedType) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid type. Must be 'percent', 'fixed', or 'amount'",
        },
        { status: 400 }
      );
    }

    // 5. Validate type-specific fields
    if (mappedType === "percentage") {
      if (percentOff === undefined || percentOff === null) {
        return NextResponse.json(
          { success: false, error: "percentOff is required for type 'percent'" },
          { status: 400 }
        );
      }
      if (typeof percentOff !== "number" || percentOff < 0 || percentOff > 100) {
        return NextResponse.json(
          { success: false, error: "percentOff must be a number between 0 and 100" },
          { status: 400 }
        );
      }
    }

    if (mappedType === "fixed") {
      if (fixedPrice === undefined || fixedPrice === null) {
        return NextResponse.json(
          { success: false, error: "fixedPrice is required for type 'fixed'" },
          { status: 400 }
        );
      }
      if (typeof fixedPrice !== "number" || fixedPrice < 0) {
        return NextResponse.json(
          { success: false, error: "fixedPrice must be a non-negative number" },
          { status: 400 }
        );
      }
    }

    if (mappedType === "amount") {
      if (amountOff === undefined || amountOff === null) {
        return NextResponse.json(
          { success: false, error: "amountOff is required for type 'amount'" },
          { status: 400 }
        );
      }
      if (typeof amountOff !== "number" || amountOff < 0) {
        return NextResponse.json(
          { success: false, error: "amountOff must be a non-negative number" },
          { status: 400 }
        );
      }
    }

    // 6. Validate scope and map to creators array
    let creators = [];
    if (scope) {
      if (scope !== "global" && scope !== "creator") {
        return NextResponse.json(
          { success: false, error: "scope must be 'global' or 'creator'" },
          { status: 400 }
        );
      }

      if (scope === "creator") {
        if (!creatorName?.trim()) {
          return NextResponse.json(
            { success: false, error: "creatorName is required when scope is 'creator'" },
            { status: 400 }
          );
        }
        creators = [creatorName.trim()];
      }
      // scope === "global" means creators stays as empty array
    }

    // 7. Validate tags if provided
    if (tags !== undefined && tags !== null) {
      if (!Array.isArray(tags)) {
        return NextResponse.json(
          { success: false, error: "tags must be an array" },
          { status: 400 }
        );
      }
      if (!tags.every((tag) => typeof tag === "string")) {
        return NextResponse.json(
          { success: false, error: "All tags must be strings" },
          { status: 400 }
        );
      }
    }

    // 8. Validate required date fields
    if (!startsAt) {
      return NextResponse.json(
        { success: false, error: "startsAt date is required" },
        { status: 400 }
      );
    }

    if (!endsAt) {
      return NextResponse.json(
        { success: false, error: "endsAt date is required" },
        { status: 400 }
      );
    }

    // 9. Parse and validate dates
    const startsAtDate = new Date(startsAt);
    const endsAtDate = new Date(endsAt);

    if (isNaN(startsAtDate.getTime())) {
      return NextResponse.json(
        { success: false, error: "startsAt must be a valid date" },
        { status: 400 }
      );
    }

    if (isNaN(endsAtDate.getTime())) {
      return NextResponse.json(
        { success: false, error: "endsAt must be a valid date" },
        { status: 400 }
      );
    }

    if (startsAtDate >= endsAtDate) {
      return NextResponse.json(
        { success: false, error: "endsAt must be after startsAt" },
        { status: 400 }
      );
    }

    // 10. Connect to database
    await connectDB();

    // 11. Check for duplicate name (optional but recommended)
    const existing = await Discount.findOne({ name: name.trim() });
    if (existing) {
      return NextResponse.json(
        { success: false, error: "A discount with this name already exists" },
        { status: 409 }
      );
    }

    // 12. Create the discount
    const discount = await Discount.create({
      name: name.trim(),
      type: mappedType,
      percentOff: mappedType === "percentage" ? percentOff : null,
      fixedPrice: mappedType === "fixed" ? fixedPrice : null,
      amountOff: mappedType === "amount" ? amountOff : null,
      creators,
      tags: tags && tags.length > 0 ? tags : null,
      startsAt: startsAtDate,
      endsAt: endsAtDate,
      active: active !== undefined ? Boolean(active) : false,
    });

    // 13. Return success response
    return NextResponse.json(
      {
        success: true,
        data: {
          id: discount._id,
          name: discount.name,
          type: type, // Return original type from payload
          percentOff: discount.percentOff,
          fixedPrice: discount.fixedPrice,
          amountOff: discount.amountOff,
          scope: creators.length > 0 ? "creator" : "global",
          creatorName: creators.length > 0 ? creators[0] : undefined,
          tags: discount.tags,
          startsAt: discount.startsAt,
          endsAt: discount.endsAt,
          active: discount.active,
          createdAt: discount.createdAt,
        },
      },
      { status: 201 }
    );
  } catch (err) {
    console.error("Error creating discount:", err);
    return NextResponse.json(
      { success: false, error: "Server error" },
      { status: 500 }
    );
  }
}

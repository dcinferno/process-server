export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { connectDB } from "../../../../lib/db";
import Discount from "../../../../lib/models/Discount";

/* ------------------------------------------
   PATCH /api/discounts/:id
   Updates an existing discount
------------------------------------------- */
export async function PATCH(request, { params }) {
  try {
    // 1. Authentication - require internal secret
    const secret = request.headers.get("x-internal-secret");
    if (secret !== process.env.INTERNAL_API_TOKEN) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    // 2. Get discount ID from params
    const { id } = params;
    if (!id) {
      return NextResponse.json(
        { success: false, error: "Discount ID is required" },
        { status: 400 }
      );
    }

    // 3. Parse request body
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

    // 4. Connect to database
    await connectDB();

    // 5. Check if discount exists
    const existingDiscount = await Discount.findById(id);
    if (!existingDiscount) {
      return NextResponse.json(
        { success: false, error: "Discount not found" },
        { status: 404 }
      );
    }

    // 6. Build update object (only include provided fields)
    const updateData = {};

    // Validate and update name
    if (name !== undefined) {
      if (!name?.trim()) {
        return NextResponse.json(
          { success: false, error: "Name cannot be empty" },
          { status: 400 }
        );
      }

      // Check for duplicate name (excluding current discount)
      const duplicate = await Discount.findOne({
        name: name.trim(),
        _id: { $ne: id },
      });
      if (duplicate) {
        return NextResponse.json(
          { success: false, error: "A discount with this name already exists" },
          { status: 409 }
        );
      }

      updateData.name = name.trim();
    }

    // Validate and map type enum (percent -> percentage)
    let mappedType = existingDiscount.type; // Default to existing type
    if (type !== undefined) {
      const typeMap = {
        percent: "percentage",
        fixed: "fixed",
        amount: "amount",
      };

      mappedType = typeMap[type];
      if (!mappedType) {
        return NextResponse.json(
          {
            success: false,
            error: "Invalid type. Must be 'percent', 'fixed', or 'amount'",
          },
          { status: 400 }
        );
      }
      updateData.type = mappedType;
    }

    // Validate type-specific fields based on the type (new or existing)
    const finalType = updateData.type || existingDiscount.type;

    if (finalType === "percentage") {
      // If type is percentage, we need percentOff
      const newPercentOff = percentOff !== undefined ? percentOff : existingDiscount.percentOff;

      if (newPercentOff === undefined || newPercentOff === null) {
        return NextResponse.json(
          { success: false, error: "percentOff is required for type 'percent'" },
          { status: 400 }
        );
      }
      if (typeof newPercentOff !== "number" || newPercentOff < 0 || newPercentOff > 100) {
        return NextResponse.json(
          { success: false, error: "percentOff must be a number between 0 and 100" },
          { status: 400 }
        );
      }

      updateData.percentOff = newPercentOff;
      updateData.fixedPrice = null;
      updateData.amountOff = null;
    } else if (finalType === "fixed") {
      // If type is fixed, we need fixedPrice
      const newFixedPrice = fixedPrice !== undefined ? fixedPrice : existingDiscount.fixedPrice;

      if (newFixedPrice === undefined || newFixedPrice === null) {
        return NextResponse.json(
          { success: false, error: "fixedPrice is required for type 'fixed'" },
          { status: 400 }
        );
      }
      if (typeof newFixedPrice !== "number" || newFixedPrice < 0) {
        return NextResponse.json(
          { success: false, error: "fixedPrice must be a non-negative number" },
          { status: 400 }
        );
      }

      updateData.fixedPrice = newFixedPrice;
      updateData.percentOff = null;
      updateData.amountOff = null;
    } else if (finalType === "amount") {
      // If type is amount, we need amountOff
      const newAmountOff = amountOff !== undefined ? amountOff : existingDiscount.amountOff;

      if (newAmountOff === undefined || newAmountOff === null) {
        return NextResponse.json(
          { success: false, error: "amountOff is required for type 'amount'" },
          { status: 400 }
        );
      }
      if (typeof newAmountOff !== "number" || newAmountOff < 0) {
        return NextResponse.json(
          { success: false, error: "amountOff must be a non-negative number" },
          { status: 400 }
        );
      }

      updateData.amountOff = newAmountOff;
      updateData.percentOff = null;
      updateData.fixedPrice = null;
    }

    // Handle scope and map to creators array
    if (scope !== undefined) {
      if (scope !== "global" && scope !== "creator") {
        return NextResponse.json(
          { success: false, error: "scope must be 'global' or 'creator'" },
          { status: 400 }
        );
      }

      if (scope === "creator") {
        const finalCreatorName = creatorName !== undefined ? creatorName : existingDiscount.creators[0];

        if (!finalCreatorName?.trim()) {
          return NextResponse.json(
            { success: false, error: "creatorName is required when scope is 'creator'" },
            { status: 400 }
          );
        }
        updateData.creators = [finalCreatorName.trim()];
      } else {
        // scope === "global"
        updateData.creators = [];
      }
    }

    // Validate tags if provided
    if (tags !== undefined) {
      if (tags === null) {
        updateData.tags = null;
      } else {
        if (!Array.isArray(tags)) {
          return NextResponse.json(
            { success: false, error: "tags must be an array or null" },
            { status: 400 }
          );
        }
        if (!tags.every((tag) => typeof tag === "string")) {
          return NextResponse.json(
            { success: false, error: "All tags must be strings" },
            { status: 400 }
          );
        }
        updateData.tags = tags.length > 0 ? tags : null;
      }
    }

    // Validate and update date fields
    let startsAtDate = existingDiscount.startsAt;
    let endsAtDate = existingDiscount.endsAt;

    if (startsAt !== undefined) {
      startsAtDate = new Date(startsAt);
      if (isNaN(startsAtDate.getTime())) {
        return NextResponse.json(
          { success: false, error: "startsAt must be a valid date" },
          { status: 400 }
        );
      }
      updateData.startsAt = startsAtDate;
    }

    if (endsAt !== undefined) {
      endsAtDate = new Date(endsAt);
      if (isNaN(endsAtDate.getTime())) {
        return NextResponse.json(
          { success: false, error: "endsAt must be a valid date" },
          { status: 400 }
        );
      }
      updateData.endsAt = endsAtDate;
    }

    // Validate date range
    if (startsAtDate >= endsAtDate) {
      return NextResponse.json(
        { success: false, error: "endsAt must be after startsAt" },
        { status: 400 }
      );
    }

    // Update active status if provided
    if (active !== undefined) {
      updateData.active = Boolean(active);
    }

    // 7. Update the discount
    const updatedDiscount = await Discount.findByIdAndUpdate(
      id,
      { $set: updateData },
      { new: true, runValidators: true }
    );

    // 8. Return success response
    const responseType = updatedDiscount.type === "percentage" ? "percent" : updatedDiscount.type;

    return NextResponse.json(
      {
        success: true,
        data: {
          id: updatedDiscount._id,
          name: updatedDiscount.name,
          type: responseType,
          percentOff: updatedDiscount.percentOff,
          fixedPrice: updatedDiscount.fixedPrice,
          amountOff: updatedDiscount.amountOff,
          scope: updatedDiscount.creators.length > 0 ? "creator" : "global",
          creatorName: updatedDiscount.creators.length > 0 ? updatedDiscount.creators[0] : undefined,
          tags: updatedDiscount.tags,
          startsAt: updatedDiscount.startsAt,
          endsAt: updatedDiscount.endsAt,
          active: updatedDiscount.active,
          createdAt: updatedDiscount.createdAt,
          updatedAt: updatedDiscount.updatedAt,
        },
      },
      { status: 200 }
    );
  } catch (err) {
    console.error("Error updating discount:", err);

    // Handle invalid MongoDB ObjectId
    if (err.name === "CastError" && err.kind === "ObjectId") {
      return NextResponse.json(
        { success: false, error: "Invalid discount ID format" },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { success: false, error: "Server error" },
      { status: 500 }
    );
  }
}

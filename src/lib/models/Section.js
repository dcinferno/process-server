import mongoose from "mongoose";

const SectionSchema = new mongoose.Schema({
  title: { type: String, required: true },
  content: { type: String, required: true }, // store as HTML or Markdown string
});

const Section =
  mongoose.models.Section || mongoose.model("Section", SectionSchema);

export default Section;

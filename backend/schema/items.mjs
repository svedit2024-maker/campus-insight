import mongoose from "mongoose";

const issueSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },

    category: {
      type: String,
      enum: [
        "Infrastructure",
        "Cleanliness",
        "Electricity",
        "Water",
        "Safety",
        "Internet",
        "Transport",
        "Other"
      ],
      required: true
    },

    location: {
      type: String,
      required: true,
      trim: true
    },

    description: {
      type: String,
      required: true,
      trim: true
    },

    photo: {
      type: String,
      default: null
    },

    status: {
      type: String,
      enum: ["Pending", "In Progress", "Resolved"],
      default: "Pending"
    },

    managementResponse: {
      type: String,
      default: null,
      trim: true
    }
  },
  {
    timestamps: true
  }
);

const Issue = mongoose.model("Issue", issueSchema);

export default Issue;


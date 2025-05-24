import mongoose from "mongoose"

const pricingRuleSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      required: true,
    },
    deviceType: {
      type: String,
      required: true,
      enum: ["desktop", "laptop", "smartphone", "tablet", "server", "network", "printer", "other"],
    },
    urgencyLevel: {
      type: String,
      required: true,
      enum: ["low", "medium", "high", "critical", "all"],
    },
    basePrice: {
      type: Number,
      required: true,
      min: 0,
    },
    multiplier: {
      type: Number,
      required: true,
      min: 0,
      default: 1,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    lastModifiedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  {
    timestamps: true,
  },
)

// Calculate final price based on base price and multiplier
pricingRuleSchema.methods.calculatePrice = function () {
  return this.basePrice * this.multiplier
}

// Find applicable pricing rule
pricingRuleSchema.statics.findApplicableRule = function (deviceType, urgencyLevel) {
  return this.findOne({
    deviceType: deviceType,
    $or: [{ urgencyLevel: urgencyLevel }, { urgencyLevel: "all" }],
    isActive: true,
  }).sort({ urgencyLevel: urgencyLevel === "critical" ? -1 : 1 })
}

const PricingRule = mongoose.model("PricingRule", pricingRuleSchema)

export default PricingRule

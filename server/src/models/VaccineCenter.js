import mongoose from 'mongoose';

const vaccineCenterSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    type: {
      type: String,
      enum: ['government_phc', 'district_hospital', 'private_clinic'],
      required: true,
      default: 'government_phc',
      index: true,
    },
    address: {
      type: String,
      required: true,
    },
    city: {
      type: String,
      required: true,
      index: true,
    },
    state: {
      type: String,
      required: true,
      default: 'Delhi',
    },
    pincode: {
      type: String,
      required: true,
      index: true,
    },
    coordinates: {
      lat: {
        type: Number,
        required: true,
      },
      lng: {
        type: Number,
        required: true,
      },
    },
    contactNumber: {
      type: String,
      default: '+91-11-26588500',
    },
    timing: {
      type: String,
      default: '09:00 AM - 04:00 PM (Mon-Sat)',
    },
    availableVaccines: {
      type: [String],
      default: ['BCG', 'OPV', 'Pentavalent', 'Rotavirus', 'fIPV', 'PCV', 'MR', 'DPT'],
    },
    isGovernmentFree: {
      type: Boolean,
      default: true,
    },
    liveStockStatus: {
      type: String,
      enum: ['in_stock', 'limited', 'out_of_stock'],
      default: 'in_stock',
    },
    rating: {
      type: Number,
      default: 4.8,
    },
    capacityPerDay: {
      type: Number,
      default: 150,
    },
  },
  {
    timestamps: true,
  }
);

vaccineCenterSchema.index({ 'coordinates.lat': 1, 'coordinates.lng': 1 });

const VaccineCenter = mongoose.model('VaccineCenter', vaccineCenterSchema);

export default VaccineCenter;

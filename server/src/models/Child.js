import mongoose from 'mongoose';

const scheduledVaccineSchema = new mongoose.Schema({
  vaccineId: {
    type: String,
    required: true,
  },
  name: {
    type: String,
    required: true,
  },
  shortName: {
    type: String,
    required: true,
  },
  description: {
    type: String,
  },
  dueDate: {
    type: Date,
    required: true,
  },
  administeredDate: {
    type: Date,
  },
  status: {
    type: String,
    enum: ['COMPLETED', 'PENDING', 'OVERDUE', 'UPCOMING'],
    default: 'UPCOMING',
  },
  phase: {
    type: Number,
    required: true,
  },
  doseNumber: {
    type: Number,
  },
  series: {
    type: String,
  },
});

const childSchema = new mongoose.Schema(
  {
    parentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Parent ID is required'],
      index: true,
    },
    name: {
      type: String,
      required: [true, 'Child name is required'],
      trim: true,
    },
    dateOfBirth: {
      type: Date,
      required: [true, 'Date of birth is required'],
    },
    gender: {
      type: String,
      enum: ['male', 'female'],
      required: [true, 'Gender is required'],
    },
    abhaId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    schedule: [scheduledVaccineSchema],
  },
  {
    timestamps: true,
  }
);

// Index for search functionality
childSchema.index({ name: 'text', abhaId: 'text' });

const Child = mongoose.model('Child', childSchema);

export default Child;



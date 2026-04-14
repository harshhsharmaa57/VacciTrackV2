import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const otpSchema = new mongoose.Schema(
  {
    childId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Child',
      required: [true, 'Child ID is required'],
      index: true,
    },
    vaccineId: {
      type: String,
      required: [true, 'Vaccine ID is required'],
    },
    otpHash: {
      type: String,
      required: [true, 'OTP hash is required'],
    },
    expiresAt: {
      type: Date,
      required: true,
    },
    attempts: {
      type: Number,
      default: 0,
    },
    used: {
      type: Boolean,
      default: false,
    },
    doctorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    phone: {
      type: String,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

// TTL index — MongoDB automatically removes expired OTP documents
otpSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// Compound index for quick lookups
otpSchema.index({ childId: 1, vaccineId: 1, used: 0 });

/**
 * Hash OTP before saving using bcrypt.
 * @param {string} otp - The plaintext 6-digit OTP
 * @returns {Promise<string>} The bcrypt hash
 */
otpSchema.statics.hashOtp = async function (otp) {
  const salt = await bcrypt.genSalt(6); // lower cost for OTP (short-lived)
  return bcrypt.hash(otp, salt);
};

/**
 * Compare a plaintext OTP against the stored hash.
 * @param {string} plainOtp
 * @param {string} hash
 * @returns {Promise<boolean>}
 */
otpSchema.statics.compareOtp = async function (plainOtp, hash) {
  return bcrypt.compare(plainOtp, hash);
};

const Otp = mongoose.model('Otp', otpSchema);

export default Otp;

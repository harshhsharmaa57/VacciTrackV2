import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';

/**
 * Generate a unique doctor ID in format DOC-XXXXXX
 * Uses only unambiguous characters (no O/0/I/1/l)
 */
const generateDoctorId = () => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let id = '';
  for (let i = 0; i < 6; i++) {
    id += chars.charAt(crypto.randomInt(0, chars.length));
  }
  return `DOC-${id}`;
};

const userSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email'],
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [6, 'Password must be at least 6 characters'],
      select: false, // Don't return password by default
    },
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
    },
    role: {
      type: String,
      enum: ['parent', 'doctor'],
      required: [true, 'Role is required'],
      default: 'parent',
    },
    phone: {
      type: String,
      trim: true,
    },
    hospitalName: {
      type: String,
      trim: true,
    },
    doctorId: {
      type: String,
      unique: true,
      sparse: true, // allows null for non-doctor users
      uppercase: true,
      index: true,
    },
    specialization: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

// Hash password before saving & auto-generate doctorId for doctors
userSchema.pre('save', async function (next) {
  // Auto-generate doctorId for new doctors
  if (this.isNew && this.role === 'doctor' && !this.doctorId) {
    let id = generateDoctorId();
    let exists = await mongoose.model('User').findOne({ doctorId: id });
    while (exists) {
      id = generateDoctorId();
      exists = await mongoose.model('User').findOne({ doctorId: id });
    }
    this.doctorId = id;
  }

  if (!this.isModified('password')) {
    return next();
  }

  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Method to compare password
userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// Remove password from JSON output
userSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.password;
  return obj;
};

const User = mongoose.model('User', userSchema);

export default User;

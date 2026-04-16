import mongoose, { Schema, Document, Types } from "mongoose";

export interface IUser extends Document {
  _id: Types.ObjectId;
  name: string;
  email: string;
  passwordHash: string;
  role: "owner" | "employee";
  status: "pending_approval" | "active" | "suspended" | "rejected";
  profilePhoto?: string;
  mobile?: string;
  designation?: string;
  agencyId?: Types.ObjectId;
  rememberDevices: { deviceHash: string; expiresAt: Date }[];
  loginAttempts: number;
  lockUntil?: Date;
  passwordChangedAt?: Date;
  lastLoginAt?: Date;
  lastLoginIp?: string;
  emailVerified: boolean;
  createdAt: Date;
  updatedAt: Date;
  approvedBy?: Types.ObjectId;
  approvedAt?: Date;
  rejectedReason?: string;
  isLocked: boolean;
  isActive: boolean;
  incrementLoginAttempts(): Promise<void>;
  resetLoginAttempts(): Promise<void>;
  addRememberDevice(deviceHash: string): Promise<void>;
  removeRememberDevice(deviceHash: string): Promise<void>;
  clearExpiredDevices(): Promise<void>;
}

const UserSchema = new Schema<IUser>(
  {
    name: { type: String, required: true, trim: true, minlength: 2, maxlength: 100 },
    email: { 
      type: String, 
      required: true, 
      unique: true, 
      lowercase: true, 
      trim: true,
      match: [/^\S+@\S+\.\S+$/, "Please enter a valid email address"]
    },
    passwordHash: { type: String, required: true, select: false },
    role: { type: String, enum: ["owner", "employee"], required: true, default: "employee" },
    status: { type: String, enum: ["pending_approval", "active", "suspended", "rejected"], required: true, default: "pending_approval" },
    profilePhoto: { type: String },
    mobile: { 
      type: String, 
      match: [/^[6-9]\d{9}$/, "Please fill a valid 10-digit Indian mobile number"] 
    },
    designation: { type: String },
    agencyId: { type: Schema.Types.ObjectId, ref: 'Agency' },
    rememberDevices: [{
      deviceHash: { type: String, required: true },
      expiresAt: { type: Date, required: true }
    }],
    loginAttempts: { type: Number, default: 0 },
    lockUntil: { type: Date },
    passwordChangedAt: { type: Date },
    lastLoginAt: { type: Date },
    lastLoginIp: { type: String },
    emailVerified: { type: Boolean, default: false },
    approvedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    approvedAt: { type: Date },
    rejectedReason: { type: String }
  },
  { timestamps: true }
);

// Virtuals
UserSchema.virtual('isLocked').get(function() {
  return !!(this.lockUntil && this.lockUntil > new Date());
});

UserSchema.virtual('isActive').get(function() {
  return this.status === 'active' && !this.isLocked;
});

// Methods
UserSchema.methods.incrementLoginAttempts = async function() {
  if (this.lockUntil && this.lockUntil < new Date()) {
    return this.updateOne({
      $set: { loginAttempts: 1 },
      $unset: { lockUntil: 1 }
    });
  }

  const updates = { $inc: { loginAttempts: 1 } } as any;
  if (this.loginAttempts + 1 >= 5 && !this.isLocked) {
    updates.$set = { lockUntil: new Date(Date.now() + 30 * 60 * 1000) }; // 30 minutes
    updates.$set.loginAttempts = 0;
  }
  return this.updateOne(updates);
};

UserSchema.methods.resetLoginAttempts = async function() {
  return this.updateOne({
    $set: { loginAttempts: 0 },
    $unset: { lockUntil: 1 }
  });
};

UserSchema.methods.addRememberDevice = async function(deviceHash: string) {
  this.clearExpiredDevices();
  const expiresAt = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000); // 90 days
  this.rememberDevices.push({ deviceHash, expiresAt });
  
  // Sort by expiresAt desc, keep 5 most recent
  this.rememberDevices.sort((a: { deviceHash: string; expiresAt: Date }, b: { deviceHash: string; expiresAt: Date }) => b.expiresAt.getTime() - a.expiresAt.getTime());
  if (this.rememberDevices.length > 5) {
    this.rememberDevices = this.rememberDevices.slice(0, 5);
  }
  return this.save();
}

UserSchema.methods.removeRememberDevice = async function(deviceHash: string) {
  this.rememberDevices = this.rememberDevices.filter((d: any) => d.deviceHash !== deviceHash);
  return this.save();
}

UserSchema.methods.clearExpiredDevices = function() {
  const now = new Date();
  this.rememberDevices = this.rememberDevices.filter((d: any) => d.expiresAt > now);
}

// Statics
UserSchema.statics.findByEmail = function(email: string) {
  return this.findOne({ email }).select('+passwordHash');
};

// Hooks
UserSchema.pre('save', function(next) {
  if (this.isModified('passwordHash') && !this.isNew) {
    this.passwordChangedAt = new Date();
  }
  next();
});

// Indexes
UserSchema.index({ status: 1 });
UserSchema.index({ role: 1 });

export default mongoose.models.User || mongoose.model<IUser>("User", UserSchema);

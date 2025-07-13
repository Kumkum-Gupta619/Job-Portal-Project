import mongoose from 'mongoose';
import validator from 'validator';
import bcrypt from 'bcryptjs';
import jWT from 'jsonwebtoken';

const userSchema = new mongoose.Schema({
   name: {
      type: String,
      required: [true, 'Name is required']
   },
   lastName: {
      type: String
   },
   email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      validate: validator.isEmail
   },
   password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [6, "Password should be greater than 6 characters"],
      select: false
   },
   location: {
      type: String,
      default: 'India'
   },
}, { timestamps: true });

// Hash password only if modified
userSchema.pre('save', async function () {
   if (!this.isModified('password')) return;
   const salt = await bcrypt.genSalt(10);
   this.password = await bcrypt.hash(this.password, salt);
});

// Compare password
userSchema.methods.comparePassword = async function (candidatePassword) {
   return await bcrypt.compare(candidatePassword, this.password);
};

// JSON WEBTOKEN
userSchema.methods.createJWT = function () {
   return jWT.sign(
      { userId: this._id },
      process.env.JWT_SECRET,
      { expiresIn: '1d' }
   );
};

export default mongoose.model('User', userSchema);
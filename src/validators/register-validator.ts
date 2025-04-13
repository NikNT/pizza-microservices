import { checkSchema } from "express-validator";

export default checkSchema({
  email: {
    errorMessage: "Email is required",
    notEmpty: true,
    trim: true,
    isEmail: true,
  },
  firstName: {
    notEmpty: true,
    trim: true,
    errorMessage: "First name is required",
  },
  lastName: {
    notEmpty: true,
    trim: true,
    errorMessage: "Last name is required",
  },
  password: {
    notEmpty: true,
    trim: true,
    errorMessage: "Password is required",
    isLength: {
      options: { min: 8 },
      errorMessage: "Password must be at least 8 characters long",
    },
  },
});

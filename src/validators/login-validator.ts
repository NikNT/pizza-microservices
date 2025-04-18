import { checkSchema } from "express-validator";

export default checkSchema({
  email: {
    errorMessage: "Email is required",
    notEmpty: true,
    trim: true,
    isEmail: true,
  },
  password: {
    notEmpty: true,
    trim: true,
    errorMessage: "Password is required",
  },
});

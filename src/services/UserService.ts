import { Repository } from "typeorm";

import { User } from "../entity/User";
import { UserData } from "../types";
import createHttpError from "http-errors";
import { Roles } from "../constants";
import bcrypt from "bcrypt";

export class UserService {
  constructor(private userRepository: Repository<User>) {}
  async create({ firstName, lastName, email, password }: UserData) {
    const user = await this.userRepository.findOne({
      where: { email: email },
    });

    // Check if the user already exists
    if (user) {
      const err = createHttpError(400, "Email already in use");
      throw err;
    }

    // Hash the password
    const saltRounds: number = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    try {
      const response = await this.userRepository.save({
        firstName,
        lastName,
        email,
        password: hashedPassword,
        role: Roles.CUSTOMER,
      });
      return response;
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (err) {
      const error = createHttpError(
        500,
        "Failed to store the data in the database",
      );
      throw error;
    }
  }

  async findByEmail(email: string) {
    const user = await this.userRepository.findOne({
      where: { email: email },
    });
    return user;
  }
}

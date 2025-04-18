import bcrypt from "bcrypt";
export class CredentialService {
  /**
   * Compares a given password with a given hashed password.
   *
   * @param userPassword the password to compare
   * @param hashedPassword the hashed password to compare with
   * @returns whether the given password matches the hashed password
   */
  async comparePassword(
    userPassword: string,
    hashedPassword: string,
  ): Promise<boolean> {
    return await bcrypt.compare(userPassword, hashedPassword);
  }
}

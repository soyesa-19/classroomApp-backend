import { db } from "./firebase.js";
import { User } from "../types/users.js";
import { CollectionReference } from "firebase-admin/firestore";

class UserService {
  private static readonly usersCollection = db.collection(
    "users"
  ) as CollectionReference<User>;

  static async getUserByEmail(email: string): Promise<User | null> {
    try {
      const userDoc = await this.usersCollection
        .where("email", "==", email)
        .get();

      if (userDoc.empty) {
        return null;
      }

      const user = userDoc.docs[0].data();
      return user;
    } catch (error) {
      console.error("Error getting user:", error);
      throw new Error("Failed to get user");
    }
  }

  static async createUser(userData: Omit<User, "id">): Promise<User> {
    try {
      // Check if user with email already exists
      const existingUser = await this.usersCollection
        .where("email", "==", userData.email)
        .get();

      if (!existingUser.empty) {
        throw new Error("User with this email already exists");
      }

      // Create new user document
      const userRef = this.usersCollection.doc();
      const newUser: User = {
        id: userRef.id,
        ...userData,
      };

      await userRef.set(newUser);
      return newUser;
    } catch (error) {
      console.error("Error creating user:", error);
      throw error;
    }
  }

  static async getUsers(userIds: string[]): Promise<User[]> {
    if (!userIds) {
      return [];
    }
    try {
      const usersDocs = userIds.map((userId) =>
        UserService.usersCollection.doc(userId)
      );
      return (await db.getAll(...usersDocs)).map((userDoc) =>
        userDoc.data()
      ) as User[];
    } catch (error) {
      console.error("Error getting user:", error);
      throw new Error("Failed to get user");
    }
  }
}

export default UserService;

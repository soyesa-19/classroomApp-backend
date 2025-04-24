import { CollectionReference } from "firebase-admin/firestore";
import { db } from "./firebase.js";
import type { Booking } from "../types/classroom.js";

export class BookingService {
  private static readonly bookingCollection = db.collection(
    "bookings"
  ) as CollectionReference<Booking>;

  static async getAllBookings(): Promise<Booking[]> {
    try {
      const bookingsSnapshot = await BookingService.bookingCollection.get();
      return bookingsSnapshot.docs.map(doc => doc.data());
    } catch (error) {
      console.error("Error fetching bookings:", error);
      throw new Error("Failed to fetch bookings");
    }
  }

  static async getBookingById(id: string): Promise<Booking | null> {
    const bookingDoc = await BookingService.bookingCollection
      .doc(id)
      .get();
    if (!bookingDoc.exists) {
      return null;
    }
    return bookingDoc.data() || null;
  }
}


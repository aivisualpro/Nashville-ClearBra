import type { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import dbConnect from "@/lib/mongodb";

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.AUTH_GOOGLE_ID!,
      clientSecret: process.env.AUTH_GOOGLE_SECRET!,
    }),
  ],
  pages: {
    signIn: "/login",
    error: "/login",
  },
  secret: process.env.NEXTAUTH_SECRET,
  callbacks: {
    async signIn({ user }) {
      // Validate user email against Nashville_Users collection
      try {
        const mongoose = await dbConnect();
        const db = mongoose.connection.db;
        if (!db) return false;

        const collection = db.collection("Nashville_Users");
        const dbUser = await collection.findOne({
          email: user.email,
          status: "Active",
        });

        if (!dbUser) {
          console.log(`Login denied for ${user.email}: not found or inactive`);
          return false;
        }

        return true;
      } catch (error) {
        console.error("Error validating user:", error);
        return false;
      }
    },
    async session({ session }) {
      return session;
    },
  },
};

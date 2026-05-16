import type { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import dbConnect from "@/lib/mongodb";

// Extend NextAuth session types
declare module "next-auth" {
  interface Session {
    user: {
      name?: string | null;
      email?: string | null;
      image?: string | null;
      role?: string;
      profileImage?: string;
      userId?: string;
    };
  }
}

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
      // Enrich session with role & profileImage from DB
      try {
        const mongoose = await dbConnect();
        const db = mongoose.connection.db;
        if (db && session.user?.email) {
          const dbUser = await db.collection("Nashville_Users").findOne(
            { email: session.user.email },
            { projection: { roles: 1, profileImage: 1, _id: 1 } }
          );
          if (dbUser) {
            session.user.role = dbUser.roles || "Team Member";
            session.user.profileImage = dbUser.profileImage || "";
            session.user.userId = dbUser._id.toString();
          }
        }
      } catch (e) {
        console.error("Session enrichment error:", e);
      }
      return session;
    },
  },
};

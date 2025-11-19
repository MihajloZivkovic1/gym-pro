// lib/auth.ts
import { NextAuthOptions } from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import GoogleProvider from "next-auth/providers/google"
import bcrypt from "bcryptjs"
import { PrismaClient, UserRole } from "@prisma/client"

const prisma = new PrismaClient()

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),

    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null
        }

        try {
          const user = await prisma.user.findUnique({
            where: { email: credentials.email }
          })

          if (!user || !user.password) {
            return null
          }

          const isPasswordValid = await bcrypt.compare(
            credentials.password,
            user.password
          )

          if (!isPasswordValid) {
            return null
          }

          if (!user.isActive) {
            throw new Error("Account is deactivated")
          }

          return {
            id: user.id,
            email: user.email,
            name: `${user.firstName} ${user.lastName}`,
            role: user.role,
          }
        } catch (error) {
          console.error("Auth error:", error)
          return null
        }
      }
    })
  ],

  callbacks: {
    async signIn({ user, account, profile }) {
      if (account?.provider === "google" && profile?.email) {
        try {
          const existingUser = await prisma.user.findUnique({
            where: { email: profile.email }
          })

          if (!existingUser) {
            const newUser = await prisma.user.create({
              data: {
                email: profile.email,
                firstName: profile.name?.split(' ')[0] || 'User',
                lastName: profile.name?.split(' ').slice(1).join(' ') || '',
                role: UserRole.MEMBER,
                isActive: true,
                qrCode: `google-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
              }
            })

            user.id = newUser.id
            user.role = newUser.role
          } else {
            user.id = existingUser.id
            user.role = existingUser.role

            if (!existingUser.isActive) {
              return false
            }
          }
        } catch (error) {
          console.error("Google sign-in error:", error)
          return false
        }
      }
      return true
    },

    async jwt({ token, user }) {
      if (user) {
        token.role = user.role ?? UserRole.MEMBER
        token.id = user.id
      }
      return token
    },

    async session({ session, token }) {
      if (token) {
        session.user.id = token.id as string
        session.user.role = token.role as UserRole
      }
      return session
    }
  },

  pages: {
    signIn: '/auth/login',
  },

  session: {
    strategy: "jwt"
  },

  secret: process.env.NEXTAUTH_SECRET,
}

declare module "next-auth" {
  interface Session {
    user: {
      id: string
      email: string
      name: string
      role: UserRole
    }
  }

  interface User {
    role: UserRole
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    role: UserRole
    id: string
  }
}
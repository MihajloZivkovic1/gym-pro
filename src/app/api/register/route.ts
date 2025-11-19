// app/api/auth/register/route.ts
import { NextRequest, NextResponse } from "next/server"
import bcrypt from "bcryptjs"
import { prisma } from "@/lib/prisma" // Use your existing prisma instance
import { UserRole } from "@prisma/client"
import { z } from "zod"

// Validation schema
const registerSchema = z.object({
  email: z.string().email("Neispravna email adresa"),
  password: z.string().min(6, "Lozinka mora imati najmanje 6 karaktera"),
  firstName: z.string().min(1, "Ime je obavezno"),
  lastName: z.string().min(1, "Prezime je obavezno"),
  phone: z.string().optional(),
})

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()

    // Validate input
    const validatedData = registerSchema.parse(body)

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: validatedData.email }
    })

    if (existingUser) {
      return NextResponse.json(
        { error: "Korisnik sa ovim email-om već postoji" },
        { status: 400 }
      )
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(validatedData.password, 12)

    // Generate unique QR code
    const qrCode = `member-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`

    // Create new user
    const newUser = await prisma.user.create({
      data: {
        email: validatedData.email,
        password: hashedPassword,
        firstName: validatedData.firstName,
        lastName: validatedData.lastName,
        phone: validatedData.phone,
        role: UserRole.MEMBER,
        isActive: true,
        qrCode: qrCode,
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        qrCode: true,
        createdAt: true,
      }
    })

    return NextResponse.json({
      success: true,
      message: "Korisnik je uspešno registrovan",
      user: newUser
    }, { status: 201 })

  } catch (error) {
    console.error("Registration error:", error)

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Greška validacije", details: error.issues }, // Fixed: .issues not .errors
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: "Greška servera" },
      { status: 500 }
    )
  }
}
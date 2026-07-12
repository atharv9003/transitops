import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { LoginDto, AuthResponse, JwtPayload } from './auth.types';

const prisma = new PrismaClient();
const MAX_LOGIN_ATTEMPTS = 5;
const LOCK_DURATION_MINUTES = 30;

export async function loginUser(dto: LoginDto): Promise<AuthResponse> {
  const user = await prisma.user.findUnique({
    where: { email: dto.email },
    include: { role: true },
  });

  if (!user) {
    throw new Error('Invalid credentials');
  }

  // Check account lock
  if (user.lockedUntil && user.lockedUntil > new Date()) {
    const minutesLeft = Math.ceil((user.lockedUntil.getTime() - Date.now()) / 60000);
    throw new Error(`Account locked. Try again in ${minutesLeft} minute(s).`);
  }

  const isPasswordValid = await bcrypt.compare(dto.password, user.passwordHash);

  if (!isPasswordValid) {
    const attempts = user.loginAttempts + 1;
    const updateData: { loginAttempts: number; lockedUntil?: Date } = {
      loginAttempts: attempts,
    };

    if (attempts >= MAX_LOGIN_ATTEMPTS) {
      const lockUntil = new Date(Date.now() + LOCK_DURATION_MINUTES * 60 * 1000);
      updateData.lockedUntil = lockUntil;
    }

    await prisma.user.update({ where: { id: user.id }, data: updateData });

    const remaining = MAX_LOGIN_ATTEMPTS - attempts;
    if (remaining <= 0) {
      throw new Error(`Invalid credentials. Account locked after ${MAX_LOGIN_ATTEMPTS} failed attempts.`);
    }
    throw new Error(`Invalid credentials. ${remaining} attempt(s) remaining before lockout.`);
  }

  // Reset login attempts on success
  await prisma.user.update({
    where: { id: user.id },
    data: { loginAttempts: 0, lockedUntil: null },
  });

  const payload: JwtPayload = {
    userId: user.id,
    email: user.email,
    role: user.role.name,
    roleId: user.roleId,
  };

  const token = jwt.sign(payload, process.env.JWT_SECRET || 'fallback-secret', {
    expiresIn: (process.env.JWT_EXPIRES_IN || '7d') as string,
  });

  return {
    token,
    user: {
      id: user.id,
      email: user.email,
      role: user.role.name,
    },
  };
}

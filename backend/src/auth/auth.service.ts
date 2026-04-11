import {
  ConflictException,
  Injectable,
  InternalServerErrorException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Prisma } from '@prisma/client';
import bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';

export type AuthUserPayload = {
  id: number;
  login: string;
  firstname: string;
  surname: string;
  phone: string;
  tg: string | null;
};

type UserRow = {
  id: number;
  login: string;
  firstname: string;
  surname: string;
  phone: string;
  tg: string | null;
};

const BCRYPT_ROUNDS = 12;

function assertBcryptHash(value: string): void {
  if (!value.startsWith('$2')) {
    throw new Error('bcrypt: expected hash to start with $2a/$2b/$2y');
  }
}

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  async login(
    dto: LoginDto,
  ): Promise<{ accessToken: string; user: AuthUserPayload }> {
    const user = await this.prisma.user.findUnique({
      where: { login: dto.login },
    });

    if (!user?.passwordHash) {
      throw new UnauthorizedException('Неверный логин или пароль');
    }

    const ok = await bcrypt.compare(dto.password, user.passwordHash);
    if (!ok) {
      throw new UnauthorizedException('Неверный логин или пароль');
    }

    return this.buildSession(user);
  }

  async register(
    dto: RegisterDto,
  ): Promise<{ accessToken: string; user: AuthUserPayload }> {
    const passwordHash = await bcrypt.hash(dto.password, BCRYPT_ROUNDS);
    try {
      assertBcryptHash(passwordHash);
    } catch {
      throw new InternalServerErrorException('Не удалось подготовить пароль');
    }

    try {
      const user = await this.prisma.user.create({
        data: {
          login: dto.login,
          passwordHash,
          firstname: dto.firstname,
          surname: dto.surname,
          phone: dto.phone,
          tg: dto.tg ?? null,
        },
      });
      return this.buildSession(user);
    } catch (e: unknown) {
      if (
        e instanceof Prisma.PrismaClientKnownRequestError &&
        e.code === 'P2002'
      ) {
        throw new ConflictException('Такой логин уже занят');
      }
      throw e;
    }
  }

  private async buildSession(
    user: UserRow,
  ): Promise<{ accessToken: string; user: AuthUserPayload }> {
    const accessToken = await this.jwtService.signAsync({
      sub: user.id,
      login: user.login,
    });

    return {
      accessToken,
      user: {
        id: user.id,
        login: user.login,
        firstname: user.firstname,
        surname: user.surname,
        phone: user.phone,
        tg: user.tg,
      },
    };
  }
}

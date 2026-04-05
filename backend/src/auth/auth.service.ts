import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { LoginDto } from './dto/login.dto';

export type AuthUserPayload = {
  id: number;
  login: string;
  firstname: string;
  surname: string;
  phone: string;
  tg: string | null;
};

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
        phone: user.phone.toString(),
        tg: user.tg,
      },
    };
  }
}

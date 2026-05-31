import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtStrategy } from './jwt.strategy';
import { AuthRepository, PrismaAuthRepository } from './repositories/auth.repository';

@Module({
  imports: [PassportModule, JwtModule.register({})],
  controllers: [AuthController],
  providers: [
    AuthService,
    JwtStrategy,
    // Bind the abstraction to its Prisma implementation. This single line is
    // where Dependency Inversion is wired — change it and the whole module
    // swaps persistence with no edits to AuthService.
    { provide: AuthRepository, useClass: PrismaAuthRepository },
  ],
})
export class AuthModule {}

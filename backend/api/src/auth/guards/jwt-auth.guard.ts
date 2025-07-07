import {
  Injectable,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { JsonWebTokenError, TokenExpiredError } from 'jsonwebtoken';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  canActivate(context: ExecutionContext) {
    // Call the parent canActivate to trigger passport authentication
    return super.canActivate(context);
  }

  handleRequest(err: any, user: any, info: any) {
    // Handle specific JWT errors
    if (info instanceof TokenExpiredError) {
      throw new UnauthorizedException('Token expired');
    }

    if (info instanceof JsonWebTokenError) {
      throw new UnauthorizedException('Invalid token');
    }

    // Handle other errors
    if (err || !user) {
      throw err || new UnauthorizedException('Authentication failed');
    }

    return user;
  }
}

import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  Logger,
} from '@nestjs/common';
import { WsException } from '@nestjs/websockets';
import { Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
import { CustomForbiddenException } from 'src/common/execeptions';
import { JwtPayload } from 'src/auth/types';
// import { AuthService } from '../auth/auth.service';
// import { User } from '../auth/entity/user.entity';

@Injectable()
export class WsJwtGuard implements CanActivate {
  private logger: Logger = new Logger(WsJwtGuard.name);

  constructor(private readonly jwtService: JwtService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    try {
      const client: Socket = context.switchToWs().getClient<Socket>();

      const authToken = client.handshake?.headers?.authorization?.split(' ')[1];

      if (!authToken) {
        throw new CustomForbiddenException('Invalid token');
      }

      const user: JwtPayload = await this.jwtService.verifyAsync(authToken);

      context.switchToWs().getClient().user = user;

      return Boolean(user);
    } catch (err) {
      this.logger.error(err);
      console.log(this);
      throw new WsException(err.message);
    }
  }
}

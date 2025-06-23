import { ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthGuard } from '@nestjs/passport';
import { Observable } from 'rxjs';

/**
 * 将未携带jwt请求的接口过滤
 */
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {}

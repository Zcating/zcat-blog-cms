import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

/**
 * 将未携带jwt请求的接口过滤
 */
@Injectable()
export class CmsJwtAuthGuard extends AuthGuard('jwt') {}

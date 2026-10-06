import type { User } from '@food/shared-types';

declare global {
  namespace Express {
    interface Request {
      user?: User;
    }
  }
}

export {};

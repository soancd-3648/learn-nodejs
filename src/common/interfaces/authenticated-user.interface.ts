import { Role } from '../enums/role.enum';

export interface AuthenticatedUser {
  id: string;
  email: string;
  roles: Role[];
}

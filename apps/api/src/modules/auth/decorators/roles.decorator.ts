import { SetMetadata } from '@nestjs/common';
import { UserRole } from '@attrio/contracts';

export const ROLES_KEY = 'roles';

/**
 * Define os roles permitidos para acessar uma rota
 * @param roles Lista de roles permitidos
 */
export const Roles = (...roles: UserRole[]) => SetMetadata(ROLES_KEY, roles);

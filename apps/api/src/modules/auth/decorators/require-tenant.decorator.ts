import { SetMetadata } from '@nestjs/common';
import { REQUIRE_TENANT_KEY } from '../guards/tenant.guard';

/**
 * Marca uma rota como exigindo contexto de tenant.
 * Usuario sem tenant associado recebera erro 403.
 */
export const RequireTenant = () => SetMetadata(REQUIRE_TENANT_KEY, true);

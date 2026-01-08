import { SetMetadata } from '@nestjs/common';

export const REQUIRES_REASON_KEY = 'requires_reason';
export const RequiresReason = () => SetMetadata(REQUIRES_REASON_KEY, true);


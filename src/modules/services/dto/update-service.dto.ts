import { PartialType } from '@nestjs/swagger';
import { CreateServiceDto } from './create-service.dto';

/** All fields optional — reuse the create rules via PartialType. */
export class UpdateServiceDto extends PartialType(CreateServiceDto) {}

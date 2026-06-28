import { PartialType } from '@nestjs/mapped-types';
import { CreateProPanelHandlerDto } from './create-pro-panel_handler.dto';

export class UpdateProPanelHandlerDto extends PartialType(CreateProPanelHandlerDto) {}

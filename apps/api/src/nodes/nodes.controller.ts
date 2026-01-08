import { Controller, Get, Param, Inject, InternalServerErrorException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';
import { NodesService } from './nodes.service';

@ApiTags('nodes')
@Controller('nodes')
export class NodesController {
  constructor(@Inject(NodesService) private readonly nodesService: NodesService) {
    if (!this.nodesService) {
      throw new InternalServerErrorException('NodesService injection failed');
    }
  }

  @Get('descriptions')
  @ApiOperation({ summary: 'Получить все описания узлов' })
  @ApiResponse({ status: 200, description: 'Описания узлов' })
  async getAllDescriptions() {
    return this.nodesService.getAllDescriptions();
  }

  @Get('descriptions/:nodeId')
  @ApiOperation({ summary: 'Получить описание узла по ID' })
  @ApiParam({ name: 'nodeId', type: String, description: 'ID узла' })
  @ApiResponse({ status: 200, description: 'Описание узла найдено' })
  @ApiResponse({ status: 404, description: 'Узел не найден' })
  async getNodeDescription(@Param('nodeId') nodeId: string) {
    return this.nodesService.getNodeDescription(nodeId);
  }
}


import { Controller, Get, Param, Inject, InternalServerErrorException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';
import { CasesService } from './cases.service';

@ApiTags('cases')
@Controller('cases')
export class CasesController {
  constructor(@Inject(CasesService) private readonly casesService: CasesService) {
    if (!this.casesService) {
      throw new InternalServerErrorException('CasesService injection failed');
    }
  }

  @Get()
  @ApiOperation({ summary: 'Получить все интерактивные кейсы' })
  @ApiResponse({ status: 200, description: 'Список кейсов' })
  async getAllCases() {
    return this.casesService.getAllCases();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Получить кейс по ID' })
  @ApiParam({ name: 'id', type: String, description: 'ID кейса' })
  @ApiResponse({ status: 200, description: 'Кейс найден' })
  @ApiResponse({ status: 404, description: 'Кейс не найден' })
  async getCase(@Param('id') id: string) {
    return this.casesService.getCase(id);
  }

  @Get('by-node/:nodeId')
  @ApiOperation({ summary: 'Получить кейсы для узла' })
  @ApiParam({ name: 'nodeId', type: String, description: 'ID узла' })
  @ApiResponse({ status: 200, description: 'Список кейсов для узла' })
  @ApiResponse({ status: 404, description: 'Узел не найден' })
  async getCasesByNode(@Param('nodeId') nodeId: string) {
    return this.casesService.getCasesByNode(nodeId);
  }

  @Get('by-branch/:branchId')
  @ApiOperation({ summary: 'Получить кейсы для ветки' })
  @ApiParam({ name: 'branchId', type: String, description: 'ID ветки' })
  @ApiResponse({ status: 200, description: 'Список кейсов для ветки' })
  @ApiResponse({ status: 404, description: 'Ветка не найдена' })
  async getCasesByBranch(@Param('branchId') branchId: string) {
    return this.casesService.getCasesByBranch(branchId);
  }

  @Get('cache/clear')
  @ApiOperation({ summary: 'Очистить кеш кейсов (для разработки)' })
  @ApiResponse({ status: 200, description: 'Кеш очищен' })
  async clearCache() {
    this.casesService.clearCache();
    return { message: 'Cache cleared' };
  }
}


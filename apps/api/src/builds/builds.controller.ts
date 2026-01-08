import { Controller, Get, Param, Inject, InternalServerErrorException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiBearerAuth } from '@nestjs/swagger';
import { BuildsService } from './builds.service';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@ApiTags('builds')
@Controller('builds')
export class BuildsController {
  constructor(@Inject(BuildsService) private readonly buildsService: BuildsService) {
    if (!this.buildsService) {
      throw new InternalServerErrorException('BuildsService injection failed');
    }
  }

  @Get()
  @ApiOperation({ summary: 'Получить все билды' })
  @ApiResponse({ status: 200, description: 'Список билдов' })
  @ApiResponse({ status: 500, description: 'Внутренняя ошибка сервера' })
  async getAllBuilds() {
    return this.buildsService.getAllBuilds();
  }

  @Get('current')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Определить текущий билд пользователя' })
  @ApiResponse({ status: 200, description: 'Статусы билдов' })
  async getCurrentBuild(@CurrentUser('sub') userId?: string) {
    return this.buildsService.detectCurrentBuild(userId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Получить билд по ID' })
  @ApiParam({ name: 'id', type: String, description: 'ID билда' })
  @ApiResponse({ status: 200, description: 'Билд найден' })
  @ApiResponse({ status: 404, description: 'Билд не найден' })
  async getBuild(@Param('id') id: string) {
    return this.buildsService.getBuild(id);
  }

  @Get('by-node/:nodeId')
  @ApiOperation({ summary: 'Получить билды для узла' })
  @ApiParam({ name: 'nodeId', type: String, description: 'ID узла' })
  @ApiResponse({ status: 200, description: 'Список билдов для узла' })
  @ApiResponse({ status: 404, description: 'Узел не найден' })
  async getBuildsByNode(@Param('nodeId') nodeId: string) {
    return this.buildsService.getBuildsByNode(nodeId);
  }
}


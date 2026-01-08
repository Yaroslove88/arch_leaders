import { Controller, Get, Param } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';
import { JobsService } from './jobs.service';

@ApiTags('jobs')
@Controller('jobs')
export class JobsController {
  constructor(private readonly jobsService: JobsService) {}

  @Get(':id/status')
  @ApiOperation({ summary: 'Получить статус задачи' })
  @ApiParam({ name: 'id', type: String, description: 'ID задачи' })
  @ApiResponse({ status: 200, description: 'Статус задачи' })
  @ApiResponse({ status: 404, description: 'Задача не найдена' })
  async getStatus(@Param('id') id: string) {
    const status = await this.jobsService.getStatus(id);
    if (!status) {
      return { error: 'Job not found' };
    }
    return status;
  }
}


import {
  Controller,
  Get,
  Param,
  Post,
  Query,
  UseGuards,
  Inject,
  InternalServerErrorException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiQuery, ApiBearerAuth } from '@nestjs/swagger';
import { AdminJobsService } from './admin-jobs.service';
import { AdminAuthGuard } from '../common/guards/admin-auth.guard';
import { AdminRolesGuard } from '../common/guards/admin-roles.guard';
import { AdminRoles } from '../common/decorators/admin-roles.decorator';
import { AdminRole } from '../common/enums/admin-role.enum';

@ApiTags('admin-jobs')
@Controller('admin/v1/jobs')
@UseGuards(AdminAuthGuard, AdminRolesGuard)
export class AdminJobsController {
  constructor(@Inject(AdminJobsService) private readonly adminJobsService: AdminJobsService) {
    if (!this.adminJobsService) {
      throw new InternalServerErrorException('AdminJobsService injection failed');
    }
  }

  @Get()
  @ApiBearerAuth()
  @AdminRoles(AdminRole.SUPER_ADMIN, AdminRole.OPERATOR)
  @ApiOperation({ summary: 'Получить список задач' })
  @ApiQuery({ name: 'status', required: false, type: String })
  @ApiQuery({ name: 'job_type', required: false, type: String })
  @ApiQuery({ name: 'user_id', required: false, type: String })
  @ApiQuery({ name: 'entity_type', required: false, type: String })
  @ApiQuery({ name: 'entity_id', required: false, type: String })
  @ApiQuery({ name: 'from', required: false, type: String })
  @ApiQuery({ name: 'to', required: false, type: String })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'cursor', required: false, type: String })
  @ApiQuery({ name: 'sort', required: false, type: String })
  @ApiQuery({ name: 'order', required: false, enum: ['asc', 'desc'] })
  @ApiResponse({ status: 200, description: 'Список задач' })
  @ApiResponse({ status: 401, description: 'Не авторизован' })
  async getJobs(
    @Query('status') status?: string,
    @Query('job_type') jobType?: string,
    @Query('user_id') userId?: string,
    @Query('entity_type') entityType?: string,
    @Query('entity_id') entityId?: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
    @Query('limit') limit?: string,
    @Query('cursor') cursor?: string,
    @Query('sort') sort?: string,
    @Query('order') order?: 'asc' | 'desc',
  ) {
    return this.adminJobsService.getJobs({
      status,
      jobType,
      userId,
      entityType,
      entityId,
      from: from ? new Date(from) : undefined,
      to: to ? new Date(to) : undefined,
      limit: limit ? parseInt(limit, 10) : undefined,
      cursor,
      sort,
      order,
    });
  }

  @Get(':job_id')
  @ApiBearerAuth()
  @AdminRoles(AdminRole.SUPER_ADMIN, AdminRole.OPERATOR)
  @ApiOperation({ summary: 'Получить задачу по ID' })
  @ApiParam({ name: 'job_id', type: String, description: 'ID задачи' })
  @ApiResponse({ status: 200, description: 'Задача найдена' })
  @ApiResponse({ status: 404, description: 'Задача не найдена' })
  @ApiResponse({ status: 401, description: 'Не авторизован' })
  async getJobById(@Param('job_id') jobId: string) {
    return this.adminJobsService.getJobById(jobId);
  }

  @Post(':job_id/retry')
  @ApiBearerAuth()
  @AdminRoles(AdminRole.SUPER_ADMIN, AdminRole.OPERATOR)
  @ApiOperation({ summary: 'Повторить выполнение задачи' })
  @ApiParam({ name: 'job_id', type: String, description: 'ID задачи' })
  @ApiResponse({ status: 200, description: 'Задача перезапущена' })
  @ApiResponse({ status: 404, description: 'Задача не найдена' })
  @ApiResponse({ status: 401, description: 'Не авторизован' })
  async retryJob(@Param('job_id') jobId: string) {
    return this.adminJobsService.retryJob(jobId);
  }

  @Post(':job_id/cancel')
  @ApiBearerAuth()
  @AdminRoles(AdminRole.SUPER_ADMIN, AdminRole.OPERATOR)
  @ApiOperation({ summary: 'Отменить выполнение задачи' })
  @ApiParam({ name: 'job_id', type: String, description: 'ID задачи' })
  @ApiResponse({ status: 200, description: 'Задача отменена' })
  @ApiResponse({ status: 404, description: 'Задача не найдена' })
  @ApiResponse({ status: 401, description: 'Не авторизован' })
  async cancelJob(@Param('job_id') jobId: string) {
    return this.adminJobsService.cancelJob(jobId);
  }
}


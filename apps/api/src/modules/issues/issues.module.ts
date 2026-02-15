import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { IssueEntity } from './entities/issue.entity';
import { IssueCategoryEntity } from './entities/issue-category.entity';
import { IssuesService } from './issues.service';
import { IssueCategoriesService } from './issue-categories.service';
import { IssuesController } from './issues.controller';
import { IssueCategoriesController } from './issue-categories.controller';

@Module({
  imports: [TypeOrmModule.forFeature([IssueEntity, IssueCategoryEntity])],
  controllers: [IssuesController, IssueCategoriesController],
  providers: [IssuesService, IssueCategoriesService],
  exports: [IssuesService],
})
export class IssuesModule {}

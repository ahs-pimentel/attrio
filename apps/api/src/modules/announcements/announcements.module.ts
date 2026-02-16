import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AnnouncementEntity } from './announcement.entity';
import { AnnouncementViewEntity } from './announcement-view.entity';
import { AnnouncementLikeEntity } from './announcement-like.entity';
import { AnnouncementsService } from './announcements.service';
import { AnnouncementsController } from './announcements.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      AnnouncementEntity,
      AnnouncementViewEntity,
      AnnouncementLikeEntity,
    ]),
  ],
  controllers: [AnnouncementsController],
  providers: [AnnouncementsService],
  exports: [AnnouncementsService],
})
export class AnnouncementsModule {}

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { Project } from './Project';

@Entity('trending_snapshots')
@Index(['date', 'rank'])
export class TrendingSnapshot {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'datetime' })
  @Index()
  date!: Date;

  @Column()
  project_id!: number;

  @Column({ default: 0 })
  stars_at_snapshot!: number;

  @Column({ nullable: true })
  rank?: number;

  @CreateDateColumn()
  created_at!: Date;

  @ManyToOne(() => Project, (project) => project.trending_snapshots, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'project_id' })
  project!: Project;
}

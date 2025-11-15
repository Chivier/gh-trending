import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  Index,
} from 'typeorm';
import { TrendingSnapshot } from './TrendingSnapshot';

@Entity('projects')
export class Project {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ length: 255 })
  @Index()
  name!: string;

  @Column({ length: 255, unique: true })
  @Index()
  full_name!: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({ length: 100, nullable: true })
  @Index()
  language?: string;

  @Column({ default: 0 })
  @Index()
  stars!: number;

  @Column({ length: 500 })
  url!: string;

  @CreateDateColumn()
  created_at!: Date;

  @UpdateDateColumn()
  updated_at!: Date;

  @OneToMany(() => TrendingSnapshot, (snapshot) => snapshot.project, {
    cascade: true,
  })
  trending_snapshots!: TrendingSnapshot[];
}

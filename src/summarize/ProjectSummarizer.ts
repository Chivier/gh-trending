import { Repository } from 'typeorm';
import { Project } from '../database/models/Project';
import { Summary } from '../database/models/Summary';
import { OpenAIClient } from './OpenAIClient';

export class ProjectSummarizer {
  private projectRepo: Repository<Project>;
  private summaryRepo: Repository<Summary>;
  private openaiClient: OpenAIClient;

  constructor(
    projectRepo: Repository<Project>,
    summaryRepo: Repository<Summary>,
    openaiApiKey?: string
  ) {
    this.projectRepo = projectRepo;
    this.summaryRepo = summaryRepo;
    this.openaiClient = new OpenAIClient(openaiApiKey);
  }

  async summarizeProject(projectId: number): Promise<Summary | null> {
    try {
      const project = await this.projectRepo.findOne({
        where: { id: projectId },
      });

      if (!project) {
        console.error(`Project ${projectId} not found`);
        return null;
      }

      // Check if summary already exists
      const existingSummary = await this.summaryRepo.findOne({
        where: { project_id: projectId },
      });

      if (existingSummary) {
        console.log(`Summary already exists for project ${projectId}`);
        return existingSummary;
      }

      // Generate summary and analysis
      const summaryText = await this.openaiClient.generateSummary(
        project.full_name,
        project.description || '',
        project.language
      );

      const analysis = await this.openaiClient.analyzeProject(
        project.full_name,
        project.description || '',
        project.language,
        project.stars
      );

      // Save summary
      const summary = this.summaryRepo.create({
        project_id: projectId,
        summary_text: summaryText,
        analysis: analysis,
      });

      await this.summaryRepo.save(summary);
      console.log(`Created summary for project ${projectId}`);

      return summary;
    } catch (error) {
      console.error(`Error summarizing project ${projectId}:`, error);
      throw error;
    }
  }

  async summarizeTrendingProjects(limit: number = 10): Promise<Summary[]> {
    try {
      // Get top trending projects without summaries
      const projects = await this.projectRepo
        .createQueryBuilder('project')
        .leftJoin('project.summaries', 'summary')
        .where('summary.id IS NULL')
        .orderBy('project.stars', 'DESC')
        .take(limit)
        .getMany();

      const summaries: Summary[] = [];

      for (const project of projects) {
        try {
          const summary = await this.summarizeProject(project.id);
          if (summary) {
            summaries.push(summary);
          }
          // Small delay to avoid rate limiting
          await new Promise((resolve) => setTimeout(resolve, 1000));
        } catch (error) {
          console.error(`Failed to summarize project ${project.id}:`, error);
        }
      }

      return summaries;
    } catch (error) {
      console.error('Error summarizing trending projects:', error);
      throw error;
    }
  }
}

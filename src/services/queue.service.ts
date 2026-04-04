import { Queue, QueueEvents, Worker, Job } from "bullmq";
import { redisConfig, QUEUE_NAMES, workerConfig } from "../config/redis";
import { AppDataSource } from "../data-source";
import { langchainService } from "./langchain.service";
import { aiRuleService } from "./ai-rule.service";
import { Score } from "../entities/Score";
import { Attempt } from "../entities/Attempt";
import { ScoringJob } from "../entities/ScoringJob";
import { AttemptStatus, ScoringJobStatus } from "../enums";

/**
 * Job data for scoring queue
 */
export interface ScoringJobData {
  attemptId: string;
  transcript: string;
  aiRuleId: string;
  promptContent?: string;
  skillType: string; // 'speaking' or 'writing'
}

/**
 * Job result from scoring worker
 */
export interface ScoringJobResult {
  success: boolean;
  scoreId?: string;
  error?: string;
}

class QueueService {
  private scoringQueue: Queue<ScoringJobData, ScoringJobResult>;
  private scoringQueueEvents: QueueEvents;
  private scoringWorker: Worker<ScoringJobData, ScoringJobResult> | null = null;
  private isInitialized = false;

  constructor() {
    this.scoringQueue = new Queue<ScoringJobData, ScoringJobResult>(
      QUEUE_NAMES.SCORING,
      {
        connection: redisConfig,
        defaultJobOptions: {
          attempts: 3,
          backoff: {
            type: "exponential",
            delay: 1000,
          },
          removeOnComplete: {
            age: 24 * 3600, // Keep completed jobs for 24 hours
            count: 1000, // Keep last 1000 completed jobs
          },
          removeOnFail: {
            age: 7 * 24 * 3600, // Keep failed jobs for 7 days
          },
        },
      },
    );

    this.scoringQueueEvents = new QueueEvents(QUEUE_NAMES.SCORING, {
      connection: redisConfig,
    });
  }

  /**
   * Process a scoring job
   */
  private async processScoringJob(
    job: Job<ScoringJobData, ScoringJobResult>,
  ): Promise<ScoringJobResult> {
    const { attemptId, transcript, aiRuleId, promptContent, skillType } =
      job.data;

    console.log(`[Worker] Processing scoring job for attempt ${attemptId}`);

    const attemptRepository = AppDataSource.getRepository(Attempt);
    const scoreRepository = AppDataSource.getRepository(Score);
    const scoringJobRepository = AppDataSource.getRepository(ScoringJob);

    try {
      // Update scoring job status to PROCESSING
      await scoringJobRepository.update(
        { attemptId },
        { status: ScoringJobStatus.PROCESSING, startedAt: new Date() },
      );

      await job.updateProgress(10);

      // Get the AI Rule
      const aiRule = await aiRuleService.getAIRuleById(aiRuleId);
      await job.updateProgress(20);

      // Call the AI scoring service based on skill type
      console.log(
        `[Worker] Calling LangChain service for ${skillType} attempt ${attemptId}`,
      );

      let scoreResponse: any;
      const scoreMetadata: Record<string, number> = {};

      if (skillType === "speaking") {
        scoreResponse = await langchainService.scoreIELTSSpeaking(
          transcript,
          aiRule,
          promptContent,
        );

        // Map speaking scores
        if (scoreResponse.fluency !== undefined) {
          scoreMetadata.fluency = scoreResponse.fluency;
          // Fallback: Map fluency score to coherence column to satisfy DB constraint if coherence is missing/merged
          if (scoreResponse.coherence === undefined) {
              scoreMetadata.coherence_cohesion = scoreResponse.fluency;
          }
        }
        if (scoreResponse.coherence !== undefined)
          scoreMetadata.coherence_cohesion = scoreResponse.coherence;
        if (scoreResponse.lexical !== undefined)
          scoreMetadata.lexical = scoreResponse.lexical;
        if (scoreResponse.grammar !== undefined)
          scoreMetadata.grammar = scoreResponse.grammar;
        if (scoreResponse.pronunciation !== undefined)
          scoreMetadata.pronunciation = scoreResponse.pronunciation;
      } else if (skillType === "writing") {
        scoreResponse = await langchainService.scoreIELTSWriting(
          transcript,
          aiRule,
          promptContent,
        );

        // Map writing scores
        if (scoreResponse.task_achievement !== undefined)
          scoreMetadata.task_achievement = scoreResponse.task_achievement;
        if (scoreResponse.coherence_cohesion !== undefined)
          scoreMetadata.coherence_cohesion = scoreResponse.coherence_cohesion;
        if (scoreResponse.lexical !== undefined)
          scoreMetadata.lexical = scoreResponse.lexical;
        if (scoreResponse.grammatical !== undefined)
          scoreMetadata.grammatical = scoreResponse.grammatical;
      } else {
        throw new Error(`Unsupported skill type: ${skillType}`);
      }

      await job.updateProgress(80);

      // Check if a score already exists for this attempt (e.g. from a failed previous job that partially succeeded)
      // and delete it to avoid unique constraint violations
      const existingScore = await scoreRepository.findOne({ where: { attemptId } });
      if (existingScore) {
          console.log(`[Worker] Removing existing score for attempt ${attemptId} before saving new score`);
          await scoreRepository.remove(existingScore);
      }

      const score = scoreRepository.create({
        attemptId,
        // scoreMetadata property removed as it's not in the entity
        overallBand: scoreResponse.overallBand,
        feedback: JSON.stringify(scoreResponse.feedback),
        detailedFeedback: scoreResponse.feedback,
        // Map specific criteria scores
        fluency: scoreMetadata.fluency,
        pronunciation: scoreMetadata.pronunciation,
        lexical: scoreMetadata.lexical,
        grammar: scoreMetadata.grammar || scoreMetadata.grammatical,
        coherence: scoreMetadata.coherence_cohesion,
        taskResponse: scoreMetadata.task_achievement,
      });

      const savedScore = await scoreRepository.save(score);
      await job.updateProgress(90);

      // Update attempt status to SCORED
      await attemptRepository.update(attemptId, {
        status: AttemptStatus.SCORED,
        scoredAt: new Date(),
      });

      // Update scoring job status to COMPLETED
      await scoringJobRepository.update(
        { attemptId },
        { status: ScoringJobStatus.COMPLETED, completedAt: new Date() },
      );

      await job.updateProgress(100);

      console.log(
        `[Worker] Successfully scored attempt ${attemptId}, score ID: ${savedScore.id}`,
      );

      return {
        success: true,
        scoreId: savedScore.id,
      };
    } catch (error: any) {
      console.error(
        `[Worker] Error scoring attempt ${attemptId}:`,
        error.message,
      );

      // Update scoring job with error
      const scoringJob = await scoringJobRepository.findOne({
        where: { attemptId },
      });
      if (scoringJob) {
        const retryCount = (scoringJob.retryCount || 0) + 1;
        const maxRetries = 3;
        const status =
          retryCount >= maxRetries
            ? ScoringJobStatus.FAILED
            : ScoringJobStatus.QUEUED;

        await scoringJobRepository.update(
          { attemptId },
          {
            status,
            errorMessage: error.message,
            retryCount,
          },
        );
      }

      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Initialize queue event listeners and start the worker
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    // Setup queue event listeners
    this.scoringQueueEvents.on("completed", ({ jobId, returnvalue }) => {
      console.log(`[Queue] Job ${jobId} completed:`, returnvalue);
    });

    this.scoringQueueEvents.on("failed", ({ jobId, failedReason }) => {
      console.error(`[Queue] Job ${jobId} failed:`, failedReason);
    });

    this.scoringQueueEvents.on("progress", ({ jobId, data }) => {
      console.log(`[Queue] Job ${jobId} progress:`, data);
    });

    // Initialize the worker
    this.scoringWorker = new Worker<ScoringJobData, ScoringJobResult>(
      QUEUE_NAMES.SCORING,
      (job) => this.processScoringJob(job),
      {
        connection: redisConfig,
        concurrency: workerConfig.concurrency,
      },
    );

    // Worker event handlers
    this.scoringWorker.on("completed", (job, result) => {
      console.log(`[Worker] Job ${job.id} completed with result:`, result);
    });

    this.scoringWorker.on("failed", (job, error) => {
      console.error(
        `[Worker] Job ${job?.id} failed with error:`,
        error.message,
      );
    });

    this.scoringWorker.on("error", (error) => {
      console.error("[Worker] Worker error:", error);
    });

    this.scoringWorker.on("ready", () => {
      console.log(
        `[Worker] Worker ready. Concurrency: ${workerConfig.concurrency}`,
      );
    });

    this.isInitialized = true;
    console.log("[Queue] Queue service initialized with worker");
  }

  /**
   * Add a scoring job to the queue
   */
  async addScoringJob(data: ScoringJobData): Promise<string> {
    const job = await this.scoringQueue.add("score-attempt", data, {
      jobId: `scoring-${data.attemptId}-${Date.now()}`,
    });

    console.log(
      `[Queue] Added scoring job ${job.id} for attempt ${data.attemptId}`,
    );
    return job.id!;
  }

  /**
   * Get queue statistics
   */
  async getQueueStats(): Promise<{
    waiting: number;
    active: number;
    completed: number;
    failed: number;
    delayed: number;
  }> {
    const [waiting, active, completed, failed, delayed] = await Promise.all([
      this.scoringQueue.getWaitingCount(),
      this.scoringQueue.getActiveCount(),
      this.scoringQueue.getCompletedCount(),
      this.scoringQueue.getFailedCount(),
      this.scoringQueue.getDelayedCount(),
    ]);

    return { waiting, active, completed, failed, delayed };
  }

  /**
   * Get job by ID
   */
  async getJob(jobId: string) {
    return this.scoringQueue.getJob(jobId);
  }

  /**
   * Pause the queue
   */
  async pause(): Promise<void> {
    await this.scoringQueue.pause();
    console.log("[Queue] Scoring queue paused");
  }

  /**
   * Resume the queue
   */
  async resume(): Promise<void> {
    await this.scoringQueue.resume();
    console.log("[Queue] Scoring queue resumed");
  }

  /**
   * Clean up old jobs
   */
  async clean(): Promise<void> {
    await this.scoringQueue.clean(24 * 3600 * 1000, 1000, "completed");
    await this.scoringQueue.clean(7 * 24 * 3600 * 1000, 100, "failed");
    console.log("[Queue] Queue cleaned");
  }

  /**
   * Close connections
   */
  async close(): Promise<void> {
    if (this.scoringWorker) {
      await this.scoringWorker.close();
      console.log("[Worker] Worker closed");
    }
    await this.scoringQueueEvents.close();
    await this.scoringQueue.close();
    console.log("[Queue] Queue service closed");
  }

  /**
   * Get the underlying queue for worker attachment
   */
  getQueue(): Queue<ScoringJobData, ScoringJobResult> {
    return this.scoringQueue;
  }
}

export const queueService = new QueueService();

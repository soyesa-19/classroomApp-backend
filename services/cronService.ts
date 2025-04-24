import cron from "node-cron";

/**
 * Service class for managing cron tasks.
 * Provides functionality to schedule, remove, list and check existence of cron tasks.
 */
export class CronTaskService {
  private static scheduledTasks: Map<string, cron.ScheduledTask> = new Map();

  /**
   * Schedule a new cron task.
   * @param taskId - A unique identifier for the task.
   * @param cronExpression - The cron expression defining the schedule.
   * @param task - The function to execute on the schedule.
   */
  static scheduleTask(
    taskId: string,
    cronExpression: string,
    task: () => Promise<void> | void
  ): void {
    if (CronTaskService.scheduledTasks.has(taskId)) {
      console.warn(`Task with ID ${taskId} is already scheduled.`);
      return;
    }

    const scheduledTask = cron.schedule(cronExpression, task, {
      scheduled: true,
      name: taskId,
    });

    CronTaskService.scheduledTasks.set(taskId, scheduledTask);
    console.log(`Task ${taskId} scheduled with expression: ${cronExpression}`);
  }

  /**
   * Remove a scheduled cron task.
   * @param taskId - The unique identifier of the task to remove.
   */
  static removeTask(taskId: string): void {
    const task = CronTaskService.scheduledTasks.get(taskId);
    if (task) {
      task.stop();
      CronTaskService.scheduledTasks.delete(taskId);
      console.log(`Task ${taskId} removed.`);
    } else {
      console.warn(`Task with ID ${taskId} not found.`);
    }
  }

  /**
   * Check if a task with the given ID exists.
   * @param taskId - The unique identifier of the task.
   * @returns True if the task exists, false otherwise.
   */
  static taskExists(taskId: string): boolean {
    return CronTaskService.scheduledTasks.has(taskId);
  }

  /**
   * List all currently scheduled tasks.
   * @returns An array of task IDs.
   */
  static listTasks(): string[] {
    return Array.from(CronTaskService.scheduledTasks.keys());
  }
}
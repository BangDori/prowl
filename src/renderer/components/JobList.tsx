import { LaunchdJob, JobCustomization, JobCustomizations } from '../../shared/types';
import JobCard from './JobCard';

interface JobActionsHook {
  toggling: string | null;
  running: string | null;
  toggle: (jobId: string) => Promise<any>;
  run: (jobId: string) => Promise<any>;
  getLogs: (jobId: string, lines?: number) => Promise<any>;
}

interface JobListProps {
  jobs: LaunchdJob[];
  actions: JobActionsHook;
  customizations: JobCustomizations;
  onUpdateCustomization: (jobId: string, customization: JobCustomization) => Promise<void>;
}

export default function JobList({
  jobs,
  actions,
  customizations,
  onUpdateCustomization,
}: JobListProps) {
  return (
    <div className="space-y-2">
      {jobs.map((job) => (
        <JobCard
          key={job.id}
          job={job}
          customization={customizations[job.id]}
          isToggling={actions.toggling === job.id}
          isRunning={actions.running === job.id}
          onToggle={() => actions.toggle(job.id)}
          onRun={() => actions.run(job.id)}
          onViewLogs={() => actions.getLogs(job.id)}
          onUpdateCustomization={(c) => onUpdateCustomization(job.id, c)}
        />
      ))}
    </div>
  );
}

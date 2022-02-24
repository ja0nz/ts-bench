import { rerequest } from './net';

// DELETES
export function deleteMilestone(url: string, milestone_number: number) {
  return () =>
    rerequest(url)(
      'DELETE /repos/{owner}/{repo}/milestones/{milestone_number}',
      { milestone_number } as any
    );
}

// CREATES
export function createMilestone(url: string, title: string) {
  return () =>
    rerequest(url)('POST /repos/{owner}/{repo}/milestones', { title } as any);
}

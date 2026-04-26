import Workspace from '@/components/Workspace';
import { NavigationBlocker } from '@/components/NavigationBlocker';
import { useProjectStore } from '@/store/projectStore';

export default function WorkspacePage() {
  const { project } = useProjectStore();
  
  // Block if there are instructions, a title, or a source URL
  const hasChanges = 
    project.instructions.length > 0 || 
    project.project_title !== 'Untitled Project' ||
    project.source_youtube_url !== '';

  return (
    <>
      <NavigationBlocker shouldBlock={hasChanges} />
      <Workspace />
    </>
  );
}
